import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  subscriptions, 
  walletTransactions,
  insertSubscriptionSchema,
  insertWalletTransactionSchema
} from '@shared/schema';
import { verifyUSDCTransaction } from '../solanaService';

/**
 * Check for a pending USDC payment based on a transaction signature
 * Used by QR code payment flow and direct wallet payments
 */
export async function checkPaymentStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    const { signature, tierId, expectedAmount } = req.body;
    
    if (!signature) {
      return res.status(400).json({ error: 'Transaction signature required' });
    }
    
    if (!expectedAmount) {
      return res.status(400).json({ error: 'Expected payment amount required' });
    }
    
    // Check if transaction was already processed successfully
    const existingTransaction = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.signature, signature),
          eq(walletTransactions.status, 'confirmed')
        )
      )
      .limit(1);
    
    if (existingTransaction.length > 0) {
      // Transaction already processed successfully
      return res.status(200).json({
        paymentFound: true,
        success: true,
        verified: true,
        message: 'Payment already verified and processed',
        transactionId: existingTransaction[0].id
      });
    }
    
    // Verify the transaction on the blockchain
    console.log(`Checking payment status for transaction ${signature}`);
    const verification = await verifyUSDCTransaction(
      signature,
      expectedAmount.toString()
    );
    
    if (!verification.isValid) {
      return res.status(200).json({
        paymentFound: false,
        success: false,
        verified: false,
        message: verification.errorMessage || 'Transaction verification failed'
      });
    }
    
    // Payment verified successfully, record it and update subscription
    console.log('USDC payment verified successfully:', verification);
    
    // Record the transaction
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        userId,
        signature,
        fromAddress: verification.sender || '',
        toAddress: verification.receiver || '',
        amount: verification.amount?.toString() || expectedAmount.toString(),
        transactionType: 'subscription',
        currency: 'usdc',
        status: 'confirmed',
        rawData: JSON.stringify(verification),
        confirmedAt: new Date()
      })
      .returning();
    
    // Create or update subscription
    try {
      // Calculate subscription dates
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 30); // 30 days subscription
      
      const gracePeriodEnd = new Date(expirationDate);
      gracePeriodEnd.setDate(expirationDate.getDate() + 7); // 7 days grace period
      
      // Create new subscription
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          userId,
          tierId,
          status: 'active',
          paymentMethod: 'usdc',
          amount: verification.amount?.toString() || expectedAmount.toString(),
          activatedAt: now,
          expiresAt: expirationDate,
          gracePeriodEnds: gracePeriodEnd,
          renewalEnabled: true
        })
        .returning();
      
      return res.status(200).json({
        paymentFound: true,
        success: true,
        verified: true,
        message: 'Payment verified and subscription activated',
        subscription: newSubscription,
        transaction
      });
    } catch (error) {
      console.error('Error creating subscription after payment verification:', error);
      return res.status(200).json({
        paymentFound: true,
        success: false,
        verified: true,
        message: 'Payment verified but failed to create subscription',
        transaction
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
}

/**
 * Get current subscription status for the authenticated user
 */
export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    const now = new Date();
    
    // Get user's most recent subscription
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.id))
      .limit(1);
    
    // If no subscription exists, return free tier
    if (userSubscriptions.length === 0) {
      return res.status(200).json({
        status: 'none',
        tier: 'free',
        message: 'No active subscription found'
      });
    }
    
    // Get the most recent subscription
    const subscription = userSubscriptions[0];
    let status = subscription.status;
    let tierId = subscription.tierId;
    
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
    
    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.transactionType, 'subscription')
        )
      )
      .orderBy(desc(walletTransactions.id))
      .limit(5);
    
    return res.status(200).json({
      id: subscription.id,
      status,
      tier: tierId,
      expiresAt: subscription.expiresAt,
      gracePeriodEnds: subscription.gracePeriodEnds,
      autoRenew: subscription.renewalEnabled,
      transactions: recentTransactions,
      message: `Subscription status: ${status}`
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}