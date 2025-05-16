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
    id: 'free',
    name: 'Free',
    headline: 'Get started with basic features',
    description: 'Experience VynaAI with essential features for casual users.',
    priceUsdc: 0,
    features: [
      'Access to basic AI model (standard response quality)',
      'Limited rich response formatting (5 per chat session daily)',
      'One active chat session at a time',
      'Up to 5 saved notes',
      'Basic text formatting',
      'Manual saves only',
      'No rich content support',
      'No categorization or tagging features',
      'Basic customer support (email only, 48-hour response time)',
      'Research rewards program participation (basic level)'
    ],
    featureAccess: {
      maxChatSessions: 1,
      maxMessagePerDay: 20,
      maxNotes: 5,
      allowedAiModels: ['basic'],
      richResponsesPerDay: 5,
      advancedFormatting: false,
      noteCategories: false,
      searchEnabled: false,
      exportEnabled: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    headline: 'For power users and creators',
    description: 'Enhance your experience with advanced features and capabilities.',
    priceUsdc: 15.00,
    features: [
      'Access to advanced AI models (Claude, GPT-4)',
      'Unlimited messages per day',
      'Rich response formatting (tables, code blocks, cards)',
      'Up to 10 concurrent chat sessions',
      'Ability to export chat history',
      'Unlimited saved notes',
      'Advanced text formatting and markdown support',
      'Supports embedding images and links',
      'Auto-save feature',
      'Basic categorization with tags',
      'Search functionality across notes',
      'Priority customer support (24-hour response time)',
      'Enhanced research rewards program (higher points multiplier)',
      'Customizable UI themes',
      'AI model selection option'
    ],
    mostPopular: true,
    featureAccess: {
      maxChatSessions: 10,
      maxMessagePerDay: -1, // Unlimited
      maxNotes: -1, // Unlimited
      allowedAiModels: ['basic', 'claude', 'gpt4'],
      richResponsesPerDay: -1, // Unlimited
      advancedFormatting: true,
      noteCategories: true,
      searchEnabled: true,
      exportEnabled: true
    }
  },
  {
    id: 'max',
    name: 'Max',
    headline: 'For professionals and teams',
    description: 'Unlock the full potential with our most comprehensive plan.',
    priceUsdc: 75.00,
    features: [
      'Access to all AI models, including exclusive Max-only models',
      'Priority API access (faster response times)',
      'Premium response quality with enhanced visualizations',
      'Unlimited concurrent chat sessions',
      'Unlimited chat history retention',
      'Advanced data visualization in responses',
      'Custom AI configuration options (tone, verbosity, etc.)',
      'Unlimited notes with version history',
      'Advanced formatting with templates',
      'Collaborative notes with sharing options',
      'Real-time sync across devices',
      'Advanced organization with folders and nested tags',
      'Full-text search with filters',
      'Export in multiple formats (PDF, HTML, Markdown)',
      'AI-powered note suggestions and enhancements',
      'Max support (dedicated account manager)',
      'Highest research rewards program tier',
      'White-label option for embedded use',
      'API access for custom integrations',
      'Analytics dashboard for usage statistics',
      'Custom training for AI responses'
    ],
    featureAccess: {
      maxChatSessions: -1, // Unlimited
      maxMessagePerDay: -1, // Unlimited
      maxNotes: -1, // Unlimited
      allowedAiModels: ['basic', 'claude', 'gpt4', 'max-exclusive'],
      richResponsesPerDay: -1, // Unlimited
      advancedFormatting: true,
      advancedVisualization: true,
      noteCategories: true,
      advancedNoteOrganization: true,
      searchEnabled: true,
      exportEnabled: true,
      collaborationEnabled: true,
      apiAccessEnabled: true,
      customTraining: true
    }
  }
];

// Calculates expiration date based on tier
function calculateExpirationDate(tierId: string): Date {
  const now = new Date();
  let durationInDays = 30; // Default to 30 days

  switch (tierId) {
    case 'free':
      durationInDays = 30; // Free tier also has a duration, used for tracking
      break;
    case 'pro':
      durationInDays = 30;
      break;
    case 'max':
      durationInDays = 30;
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
 * Get a user's current subscription tier and access controls
 */
export async function getUserSubscriptionTier(userId: number): Promise<{
  tierId: string;
  featureAccess: any;
  status: string;
  expiresAt: Date | null;
}> {
  try {
    const now = new Date();
    
    // Default to free tier
    let tierId = 'free';
    let status = 'active';
    let expiresAt = null;
    
    // Check for active subscription
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.id));
    
    if (userSubscriptions.length > 0) {
      const subscription = userSubscriptions[0];
      tierId = subscription.tierId;
      status = subscription.status;
      expiresAt = subscription.expiresAt;
      
      // Check if subscription is expired but in grace period
      if (status === 'active' && subscription.expiresAt && new Date(subscription.expiresAt) < now) {
        // If within grace period, mark as grace period
        if (subscription.gracePeriodEnds && new Date(subscription.gracePeriodEnds) >= now) {
          status = 'grace_period';
        } else {
          status = 'expired';
          tierId = 'free'; // Revert to free tier if expired
        }
      }
    }
    
    // Get feature access for the tier
    const tier = subscriptionTiers.find(t => t.id === tierId);
    if (!tier) {
      // Fallback to free tier if the tier isn't found
      const freeTier = subscriptionTiers.find(t => t.id === 'free');
      return {
        tierId: 'free',
        featureAccess: freeTier ? freeTier.featureAccess : {},
        status,
        expiresAt
      };
    }
    
    return {
      tierId,
      featureAccess: tier.featureAccess,
      status,
      expiresAt
    };
  } catch (error) {
    console.error('Error getting user subscription tier:', error);
    // Fallback to free tier
    const freeTier = subscriptionTiers.find(t => t.id === 'free');
    return {
      tierId: 'free',
      featureAccess: freeTier ? freeTier.featureAccess : {},
      status: 'none',
      expiresAt: null
    };
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(userId: number, feature: string, value?: any): Promise<boolean> {
  try {
    const { featureAccess, status } = await getUserSubscriptionTier(userId);
    
    // If user's subscription is not active, restrict access to premium features
    if (status !== 'active' && status !== 'grace_period' && feature !== 'maxChatSessions' && feature !== 'maxNotes') {
      // Allow basic features even for expired subscriptions
      const basicFeatures = ['allowedAiModels', 'maxChatSessions', 'maxNotes'];
      if (!basicFeatures.includes(feature)) {
        return false;
      }
    }
    
    // If the feature doesn't exist in the access control, deny access
    if (!(feature in featureAccess)) {
      return false;
    }
    
    const accessValue = featureAccess[feature];
    
    // Handle different types of feature checks
    if (feature === 'allowedAiModels' && value) {
      // Check if the requested AI model is in the allowed list
      return Array.isArray(accessValue) && accessValue.includes(value);
    } else if (feature === 'maxChatSessions' || feature === 'maxMessagePerDay' || feature === 'maxNotes') {
      // For numeric limits, -1 means unlimited
      if (accessValue === -1) return true;
      
      // Check if the current usage is below the limit
      return value <= accessValue;
    } else {
      // For boolean features, return the value directly
      return !!accessValue;
    }
  } catch (error) {
    console.error(`Error checking feature access for ${feature}:`, error);
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
    const { tierId, amount, transactionSignature, paymentSource } = req.body;
    const paymentMethod = 'usdc'; // We now only support USDC
    const senderWalletAddress = req.body.walletAddress; // Optional: wallet address that made the payment
    
    console.log(`Subscription request: Tier ${tierId}, Amount ${amount} USDC, Signature ${transactionSignature}`);
    console.log(`Payment source: ${paymentSource || 'direct_wallet'}`);
    
    // Validate tier ID
    if (!['free', 'pro', 'max'].includes(tierId)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }
    
    // Special case for free tier
    if (tierId === 'free') {
      console.log('Processing free tier subscription - no payment required');
      
      // Calculate subscription dates
      const now = new Date();
      const expirationDate = calculateExpirationDate(tierId);
      const gracePeriodEnd = calculateGracePeriodEnd(tierId, expirationDate);
      
      // Create free subscription without payment verification
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          userId,
          tierId: tierId,
          status: 'active',
          paymentMethod: 'none',
          amount: '0',
          activatedAt: now,
          expiresAt: expirationDate,
          gracePeriodEnds: gracePeriodEnd,
          renewalEnabled: true
        })
        .returning();
      
      return res.status(201).json(newSubscription);
    }
    
    // Find the tier to validate the amount
    const tier = subscriptionTiers.find(t => t.id === tierId);
    if (!tier) {
      return res.status(400).json({ error: 'Subscription tier not found' });
    }
    
    // Get expected price for the tier
    const expectedAmount = tier.priceUsdc.toFixed(2);
    
    // For paid tiers, require a transaction signature
    if (!transactionSignature) {
      return res.status(400).json({ 
        error: 'Transaction signature required for paid subscriptions'
      });
    }
    
    // Import the Solana verification service
    const { verifyUSDCTransaction } = await import('./solanaService');
    
    // Verify the transaction on the blockchain
    console.log(`Verifying transaction ${transactionSignature} for amount ${expectedAmount} USDC`);
    const verification = await verifyUSDCTransaction(
      transactionSignature,
      expectedAmount,
      senderWalletAddress
    );
    
    // If transaction verification failed
    if (!verification.isValid) {
      console.error(`Transaction verification failed: ${verification.errorMessage}`);
      return res.status(400).json({
        error: 'Transaction validation failed',
        details: verification.errorMessage
      });
    }
    
    console.log('Transaction verified successfully:', verification);
    
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
        amount: verification.amount?.toString() || amount.toString(),
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
  
  // Get user's subscription status (support both endpoints for compatibility)
  app.get('/api/subscription/status', ensureAuthenticated, getUserSubscription);
  app.get('/api/subscription', ensureAuthenticated, getUserSubscription);
  
  // Create a new subscription (support both endpoints for compatibility)
  app.post('/api/subscription/create', ensureAuthenticated, createUserSubscription);
  app.post('/api/subscription', ensureAuthenticated, createUserSubscription);
  
  // Cancel a subscription
  app.delete('/api/subscription/:subscriptionId', ensureAuthenticated, cancelUserSubscription);
  app.post('/api/subscription/cancel', ensureAuthenticated, (req, res) => {
    const subscriptionId = req.body.subscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    req.params.subscriptionId = subscriptionId;
    return cancelUserSubscription(req, res);
  });
  
  // Toggle auto-renewal
  app.patch('/api/subscription/:subscriptionId/renewal', ensureAuthenticated, toggleSubscriptionRenewal);
  app.post('/api/subscription/toggle-renewal', ensureAuthenticated, (req, res) => {
    const subscriptionId = req.body.subscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    req.params.subscriptionId = subscriptionId;
    return toggleSubscriptionRenewal(req, res);
  });
}