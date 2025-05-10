import express, { Request, Response } from 'express';
import { db } from './db';
import { subscriptions, users } from '../shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { ensureAuthenticated } from './auth';

// Check if a user has an active subscription
export async function checkUserSubscription(userId: number): Promise<boolean> {
  try {
    const today = new Date();
    
    // Find a valid subscription for the user
    const [activeSubscription] = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.expiresAt, today)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
      
    return !!activeSubscription;
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return false;
  }
}

// Get subscription tier benefits
export async function getSubscriptionTierBenefits(req: Request, res: Response) {
  try {
    const { tierId } = req.params;
    
    if (!tierId) {
      return res.status(400).json({ error: 'Tier ID is required' });
    }
    
    // In a real app, you would fetch this from a database
    // For now, return hard-coded benefits based on tierId
    const tierBenefits = {
      basic: {
        aiModels: ['Standard'],
        savedSessions: 5,
        streamingQuality: 'Standard',
        support: 'Email'
      },
      pro: {
        aiModels: ['Standard', 'Premium'],
        savedSessions: 'Unlimited',
        streamingQuality: 'HD',
        customBranding: true,
        prioritySupport: true
      },
      enterprise: {
        aiModels: ['Standard', 'Premium', 'Exclusive'],
        savedSessions: 'Unlimited',
        streamingQuality: '4K',
        customBranding: true,
        whiteLabel: true,
        dedicatedSupport: true,
        customIntegrations: true
      }
    };
    
    const benefits = tierBenefits[tierId as keyof typeof tierBenefits];
    
    if (!benefits) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }
    
    return res.status(200).json(benefits);
  } catch (error) {
    console.error('Error fetching subscription tier benefits:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription tier benefits' });
  }
}

// Get user's current subscription
export async function getUserSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const today = new Date();
    
    // Find the user's active subscription
    const [activeSubscription] = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.expiresAt, today)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
      
    if (!activeSubscription) {
      return res.status(200).json({ hasSubscription: false });
    }
    
    return res.status(200).json({
      hasSubscription: true,
      subscription: activeSubscription
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return res.status(500).json({ error: 'Failed to fetch user subscription' });
  }
}

// Create a new subscription for a user
export async function createUserSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { tierId, transactionSignature } = req.body;
    
    if (!tierId || !transactionSignature) {
      return res.status(400).json({ error: 'Tier ID and transaction signature are required' });
    }
    
    // Verify the transaction on the blockchain (simplified for now)
    // In a real app, you would verify the transaction details with the Solana blockchain
    
    // Set expiration date to 30 days from now
    const now = new Date();
    const expiresAt = new Date(now.setDate(now.getDate() + 30));
    
    // Create the subscription
    const [newSubscription] = await db.insert(subscriptions)
      .values({
        userId,
        tierId,
        status: 'active',
        transactionSignature,
        activatedAt: new Date(),
        expiresAt
      })
      .returning();
      
    // Update user's subscription status
    await db.update(users)
      .set({
        subscriptionStatus: 'active',
        subscriptionTier: tierId
      })
      .where(eq(users.id, userId));
      
    return res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}

// Cancel a user's subscription
export async function cancelUserSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { subscriptionId } = req.params;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    // Find the subscription
    const [subscription] = await db.select()
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
    
    // Update the subscription status
    await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date()
      })
      .where(eq(subscriptions.id, parseInt(subscriptionId)));
      
    // Update user's subscription status
    await db.update(users)
      .set({
        subscriptionStatus: 'inactive'
      })
      .where(eq(users.id, userId));
      
    return res.status(200).json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

export function registerSubscriptionRoutes(app: express.Express) {
  // Get subscription tier benefits
  app.get('/api/subscriptions/tiers/:tierId/benefits', getSubscriptionTierBenefits);
  
  // Get user's current subscription
  app.get('/api/subscriptions/current', ensureAuthenticated, getUserSubscription);
  
  // Create a new subscription
  app.post('/api/subscriptions/activate', ensureAuthenticated, createUserSubscription);
  
  // Cancel a subscription
  app.post('/api/subscriptions/:subscriptionId/cancel', ensureAuthenticated, cancelUserSubscription);
}