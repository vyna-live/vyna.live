import express, { Request, Response } from 'express';
import { db } from './db';
import { subscriptions, walletTransactions, users } from '@shared/schema';
import { ensureAuthenticated } from './auth';
import { eq, and, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import { log } from './vite';

// Validation schemas
const createSubscriptionSchema = z.object({
  tierId: z.string(),
  paymentMethod: z.enum(['sol', 'usdc']),
  amount: z.string(),
  transactionSignature: z.string()
});

const renewSubscriptionSchema = z.object({
  subscriptionId: z.number(),
  transactionSignature: z.string()
});

// Subscription tiers configuration
const subscriptionTiers = {
  'free': {
    name: 'Free',
    durationDays: 0, // Unlimited
    gracePeriodDays: 0
  },
  'basic': {
    name: 'Basic',
    durationDays: 30,
    gracePeriodDays: 3
  },
  'pro': {
    name: 'Pro',
    durationDays: 30,
    gracePeriodDays: 5
  },
  'enterprise': {
    name: 'Enterprise',
    durationDays: 30,
    gracePeriodDays: 7
  }
};

// Helper to calculate expiration date
function calculateExpirationDate(tierId: string): Date {
  const tier = subscriptionTiers[tierId as keyof typeof subscriptionTiers];
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + tier.durationDays);
  return expirationDate;
}

// Helper to calculate grace period end date
function calculateGracePeriodEnd(tierId: string, expirationDate: Date): Date {
  const tier = subscriptionTiers[tierId as keyof typeof subscriptionTiers];
  const gracePeriodEnd = new Date(expirationDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + tier.gracePeriodDays);
  return gracePeriodEnd;
}

/**
 * Check if a user has an active subscription
 */
export async function checkUserSubscription(userId: number): Promise<boolean> {
  try {
    const now = new Date();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.expiresAt, now)
        )
      );
    
    return !!subscription;
  } catch (error) {
    log(`Error checking user subscription: ${error}`, 'error');
    return false;
  }
}

/**
 * Get subscription benefits and features
 */
export async function getSubscriptionTierBenefits(req: Request, res: Response) {
  try {
    // For now, return static tier benefits
    const tierBenefits = [
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
    
    res.status(200).json(tierBenefits);
  } catch (error) {
    log(`Error getting subscription tier benefits: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to get subscription tier benefits' });
  }
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user?.id;
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt, 'desc')
      .limit(1);
      
    if (!subscription) {
      return res.status(200).json({ 
        status: 'none',
        tier: 'free',
        message: 'No active subscription'
      });
    }
    
    const now = new Date();
    let status = subscription.status;
    
    // Check if the subscription has expired but is in grace period
    if (subscription.status === 'active' && 
        subscription.expiresAt < now && 
        subscription.gracePeriodEnds && 
        subscription.gracePeriodEnds > now) {
      status = 'grace_period';
    }
    
    // Check if the subscription has fully expired
    if ((subscription.status === 'active' || subscription.status === 'grace_period') && 
        subscription.expiresAt < now && 
        (!subscription.gracePeriodEnds || subscription.gracePeriodEnds < now)) {
      status = 'expired';
      
      // Update the status in the database
      await db
        .update(subscriptions)
        .set({ status: 'expired', updatedAt: now })
        .where(eq(subscriptions.id, subscription.id));
    }
    
    // Get related transactions
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.subscriptionId, subscription.id))
      .orderBy(walletTransactions.createdAt, 'desc');
    
    res.status(200).json({
      id: subscription.id,
      status,
      tier: subscription.tierId,
      activatedAt: subscription.activatedAt,
      expiresAt: subscription.expiresAt,
      gracePeriodEnds: subscription.gracePeriodEnds,
      renewalEnabled: subscription.renewalEnabled,
      transactions: transactions.map(tx => ({
        id: tx.id,
        signature: tx.signature,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
        confirmedAt: tx.confirmedAt
      }))
    });
  } catch (error) {
    log(`Error getting user subscription: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to get subscription information' });
  }
}

/**
 * Create a new subscription
 */
export async function createUserSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const validatedData = createSubscriptionSchema.parse(req.body);
    const userId = req.user?.id;
    const now = new Date();
    const expirationDate = calculateExpirationDate(validatedData.tierId);
    const gracePeriodEnd = calculateGracePeriodEnd(validatedData.tierId, expirationDate);
    
    // Check for existing active subscriptions
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.expiresAt, now)
        )
      );
    
    // If there's an existing subscription, extend it instead of creating a new one
    if (existingSubscription) {
      const newExpirationDate = new Date(existingSubscription.expiresAt);
      newExpirationDate.setDate(newExpirationDate.getDate() + subscriptionTiers[validatedData.tierId as keyof typeof subscriptionTiers].durationDays);
      
      const newGracePeriodEnd = calculateGracePeriodEnd(validatedData.tierId, newExpirationDate);
      
      // Update the existing subscription
      await db
        .update(subscriptions)
        .set({ 
          expiresAt: newExpirationDate, 
          gracePeriodEnds: newGracePeriodEnd,
          updatedAt: now 
        })
        .where(eq(subscriptions.id, existingSubscription.id));
      
      // Create a transaction record
      const [transaction] = await db
        .insert(walletTransactions)
        .values({
          userId,
          subscriptionId: existingSubscription.id,
          signature: validatedData.transactionSignature,
          amount: validatedData.amount,
          currency: validatedData.paymentMethod,
          transactionType: 'subscription_renewal',
          status: 'confirmed',
          fromAddress: 'user_wallet', // In production, this would be the actual wallet address
          toAddress: 'treasury_wallet', // In production, this would be the treasury wallet address
          confirmedAt: now,
          createdAt: now
        })
        .returning();
      
      return res.status(200).json({
        message: 'Subscription extended successfully',
        subscription: {
          id: existingSubscription.id,
          status: existingSubscription.status,
          tier: existingSubscription.tierId,
          expiresAt: newExpirationDate
        },
        transaction
      });
    }
    
    // Create a new subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        tierId: validatedData.tierId,
        status: 'active',
        paymentMethod: validatedData.paymentMethod,
        amount: validatedData.amount,
        activatedAt: now,
        expiresAt: expirationDate,
        gracePeriodEnds: gracePeriodEnd,
        renewalEnabled: false,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    // Create a transaction record
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        userId,
        subscriptionId: subscription.id,
        signature: validatedData.transactionSignature,
        amount: validatedData.amount,
        currency: validatedData.paymentMethod,
        transactionType: 'subscription_new',
        status: 'confirmed',
        fromAddress: 'user_wallet', // In production, this would be the actual wallet address
        toAddress: 'treasury_wallet', // In production, this would be the treasury wallet address
        confirmedAt: now,
        createdAt: now
      })
      .returning();
    
    // Update user's subscription status
    await db
      .update(users)
      .set({ 
        subscriptionStatus: 'active',
        subscriptionTier: validatedData.tierId,
        subscriptionExpiresAt: expirationDate,
        updatedAt: now 
      })
      .where(eq(users.id, userId));
    
    res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
      transaction
    });
  } catch (error) {
    log(`Error creating subscription: ${error}`, 'error');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid subscription data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

/**
 * Cancel a user's subscription
 */
export async function cancelUserSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const subscriptionId = parseInt(req.params.id);
    const userId = req.user?.id;
    const now = new Date();
    
    // Get the subscription and verify it belongs to the user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId)
        )
      );
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // If already cancelled, return early
    if (subscription.status === 'cancelled') {
      return res.status(200).json({ message: 'Subscription is already cancelled' });
    }
    
    // Update the subscription
    await db
      .update(subscriptions)
      .set({ 
        status: 'cancelled',
        cancelledAt: now,
        renewalEnabled: false,
        updatedAt: now 
      })
      .where(eq(subscriptions.id, subscriptionId));
    
    // Update user record
    await db
      .update(users)
      .set({ 
        subscriptionStatus: 'cancelled',
        updatedAt: now 
      })
      .where(eq(users.id, userId));
    
    res.status(200).json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    log(`Error cancelling subscription: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

/**
 * Toggle automatic renewal for subscription
 */
export async function toggleSubscriptionRenewal(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const subscriptionId = parseInt(req.params.id);
    const { renewalEnabled } = req.body;
    
    if (typeof renewalEnabled !== 'boolean') {
      return res.status(400).json({ error: 'renewalEnabled must be a boolean' });
    }
    
    const userId = req.user?.id;
    const now = new Date();
    
    // Get the subscription and verify it belongs to the user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId)
        )
      );
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Update the subscription
    await db
      .update(subscriptions)
      .set({ 
        renewalEnabled,
        updatedAt: now 
      })
      .where(eq(subscriptions.id, subscriptionId));
    
    res.status(200).json({ 
      message: `Auto-renewal ${renewalEnabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    log(`Error toggling subscription renewal: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to update subscription renewal settings' });
  }
}

/**
 * Register subscription routes
 */
export function registerSubscriptionRoutes(app: express.Express) {
  // Public routes
  app.get('/api/subscription/tiers', getSubscriptionTierBenefits);
  
  // Protected routes
  app.get('/api/subscription', ensureAuthenticated, getUserSubscription);
  app.post('/api/subscription', ensureAuthenticated, createUserSubscription);
  app.delete('/api/subscription/:id', ensureAuthenticated, cancelUserSubscription);
  app.patch('/api/subscription/:id/renewal', ensureAuthenticated, toggleSubscriptionRenewal);
}