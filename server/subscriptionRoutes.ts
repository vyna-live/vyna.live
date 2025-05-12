import express, { Request, Response } from 'express';
import { db } from './db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  subscriptions, 
  walletTransactions,
  insertSubscriptionSchema,
  insertWalletTransactionSchema
} from '@shared/schema';
import { ensureAuthenticated } from './auth';

// Define subscription tiers (same as client-side but defined here for server use)
const subscriptionTiers = [
  {
    id: 'basic',
    name: 'Basic',
    headline: 'For casual streamers',
    description: 'Get started with the essential features to enhance your streams',
    priceSol: 0.05,
    priceUsdc: 5,
    features: [
      'AI Assistant with Standard Models',
      'Up to 5 saved sessions per month',
      'Basic streaming features',
      'Standard quality video'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    headline: 'For growing creators',
    description: 'Take your content to the next level with advanced features',
    priceSol: 0.25,
    priceUsdc: 25,
    features: [
      'Advanced AI with premium models',
      'Unlimited saved sessions',
      'Priority streaming slots',
      'HD quality video',
      'Custom stream branding',
      'Priority customer support'
    ],
    mostPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headline: 'For professional content creators',
    description: 'Unlock the full potential with our premium offering',
    priceSol: 1,
    priceUsdc: 100,
    features: [
      'Exclusive AI models access',
      'Unlimited everything',
      '4K video quality',
      'Advanced analytics dashboard',
      'White-labeled solution',
      'Dedicated account manager',
      'Custom integration support'
    ]
  }
];

// Calculates expiration date based on tier
function calculateExpirationDate(tierId: string): Date {
  const now = new Date();
  let durationInDays = 30; // Default to 30 days

  switch (tierId) {
    case 'basic':
      durationInDays = 30;
      break;
    case 'pro':
      durationInDays = 30;
      break;
    case 'enterprise':
      durationInDays = 90;
      break;
    default:
      durationInDays = 30;
  }

  const expirationDate = new Date(now);
  expirationDate.setDate(now.getDate() + durationInDays);
  return expirationDate;
}

// Calculates grace period end date (7 days after expiration)
function calculateGracePeriodEnd(tierId: string, expirationDate: Date): Date {
  const gracePeriodEnd = new Date(expirationDate);
  gracePeriodEnd.setDate(expirationDate.getDate() + 7);
  return gracePeriodEnd;
}

/**
 * Check if a user has an active subscription
 */
export async function checkUserSubscription(userId: number): Promise<boolean> {
  try {
    const now = new Date();
    
    // Check if user has an active subscription that hasn't expired
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.expiresAt, now)
        )
      );
    
    return userSubscriptions.length > 0;
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return false;
  }
}

/**
 * Get subscription benefits and features
 */
export async function getSubscriptionTierBenefits(req: Request, res: Response) {
  try {
    // Return subscription tiers with features
    res.status(200).json(subscriptionTiers);
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const now = new Date();
    
    // Get user's most recent active subscription
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.id);
    
    if (userSubscriptions.length === 0) {
      return res.status(200).json({ 
        status: 'none', 
        tier: 'free',
        message: 'No active subscription found'
      });
    }
    
    // Get the most recent subscription
    const subscription = userSubscriptions[userSubscriptions.length - 1];
    
    // Add transactions for the subscription
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.transactionType, 'subscription')
        )
      )
      .limit(5);
    
    const subscriptionWithTransactions = {
      ...subscription,
      transactions
    };
    
    res.status(200).json(subscriptionWithTransactions);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}

/**
 * Create a new subscription
 */
export async function createUserSubscription(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const { tierId, paymentMethod, amount, transactionSignature } = req.body;
    
    // Validate tier ID
    if (!['basic', 'pro', 'enterprise'].includes(tierId)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }
    
    // Validate payment method
    if (!['sol', 'usdc'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    // Special case: 'ALREADY_PROCESSED' signature 
    // This is a placeholder used when a transaction was already processed
    if (transactionSignature === 'ALREADY_PROCESSED') {
      // Check if user already has an active subscription
      // Get the most recent active subscription
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, 'active')
          )
        )
        // Use a simpler approach without desc()
        .orderBy(subscriptions.createdAt)
        .limit(1);
      
      // If user already has an active subscription, return it
      if (existingSubscription.length > 0) {
        return res.status(200).json(existingSubscription[0]);
      }
      
      // Otherwise, we'll just continue with creating a new subscription
      // We'll create a unique ID for the transaction
      req.body.transactionSignature = `already-processed-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Calculate subscription dates
    const now = new Date();
    const expirationDate = calculateExpirationDate(tierId);
    const gracePeriodEnd = calculateGracePeriodEnd(tierId, expirationDate);
    
    // Create new subscription
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        tierId: tierId,
        status: 'active',
        paymentMethod: paymentMethod,
        amount: amount.toString(),
        activatedAt: now,
        expiresAt: expirationDate,
        gracePeriodEnds: gracePeriodEnd,
        renewalEnabled: true
      })
      .returning();
    
    // Check if this transaction signature has already been recorded
    // This helps prevent duplicate entries if a client resubmits the same transaction
    let transaction;
    try {
      const existingTransaction = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.signature, transactionSignature))
        .limit(1);
      
      if (existingTransaction.length > 0) {
        // Transaction already exists, just use it
        transaction = existingTransaction[0];
        console.log(`Transaction ${transactionSignature} already exists in database, reusing record.`);
        
        // Update the metadata to link to this new subscription if needed
        // First check if there's any existing metadata
        const existingMetadata = typeof transaction.metadata === 'object' 
          ? transaction.metadata as Record<string, unknown> 
          : {};
        
        // Check if subscriptionId exists in the metadata
        const hasSubscriptionId = existingMetadata 
          && 'subscriptionId' in existingMetadata;
          
        if (!hasSubscriptionId) {
          // Create new metadata object with the subscription info
          const newMetadata = {
            ...existingMetadata,
            subscriptionId: newSubscription.id,
            tier: tierId
          };
          
          await db
            .update(walletTransactions)
            .set({ metadata: newMetadata })
            .where(eq(walletTransactions.id, transaction.id));
        }
      } else {
        // Save new transaction details
        const [newTransaction] = await db
          .insert(walletTransactions)
          .values({
            userId,
            signature: transactionSignature,
            amount: amount.toString(),
            transactionType: 'subscription',
            status: 'confirmed',
            fromAddress: req.body.fromAddress || 'unknown',
            toAddress: req.body.toAddress || 'unknown',
            metadata: {
              subscriptionId: newSubscription.id,
              tier: tierId
            },
            createdAt: now,
            confirmedAt: now
          })
          .returning();
        
        transaction = newTransaction;
      }
    } catch (error) {
      console.error('Error processing transaction record:', error);
      // If we can't record the transaction, we'll still return the subscription
      // since the payment has been made
    }
    
    res.status(201).json({
      subscription: newSubscription,
      transaction: transaction
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

/**
 * Cancel a user's subscription
 */
export async function cancelUserSubscription(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const { subscriptionId } = req.params;
    
    // Verify subscription belongs to user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, parseInt(subscriptionId)),
          eq(subscriptions.userId, userId)
        )
      );
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Update subscription status
    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        renewalEnabled: false
      })
      .where(eq(subscriptions.id, parseInt(subscriptionId)));
    
    res.status(200).json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

/**
 * Toggle automatic renewal for subscription
 */
export async function toggleSubscriptionRenewal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const { subscriptionId } = req.params;
    const { renewalEnabled } = req.body;
    
    if (typeof renewalEnabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid renewal status' });
    }
    
    // Verify subscription belongs to user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, parseInt(subscriptionId)),
          eq(subscriptions.userId, userId)
        )
      );
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Update renewal status
    await db
      .update(subscriptions)
      .set({ renewalEnabled })
      .where(eq(subscriptions.id, parseInt(subscriptionId)));
    
    res.status(200).json({ 
      message: `Auto-renewal ${renewalEnabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling subscription renewal:', error);
    res.status(500).json({ error: 'Failed to update renewal status' });
  }
}

/**
 * Register subscription routes
 */
export function registerSubscriptionRoutes(app: express.Express) {
  // Get subscription tiers and benefits
  app.get('/api/subscription/tiers', getSubscriptionTierBenefits);
  
  // Get user's subscription status
  app.get('/api/subscription', ensureAuthenticated, getUserSubscription);
  
  // Create a new subscription
  app.post('/api/subscription', ensureAuthenticated, createUserSubscription);
  
  // Cancel a subscription
  app.delete('/api/subscription/:subscriptionId', ensureAuthenticated, cancelUserSubscription);
  
  // Toggle auto-renewal
  app.patch(
    '/api/subscription/:subscriptionId/renewal',
    ensureAuthenticated,
    toggleSubscriptionRenewal
  );
}