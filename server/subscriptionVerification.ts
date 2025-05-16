import { Request, Response } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { subscriptions, pendingPayments, users } from '@shared/schema';
import { verifyUSDCTransaction, checkRecentTransactionsFromWallet } from './solanaService';

// Get the subscription tier data from database
async function getSubscriptionTierPrice(tierId: string): Promise<number | null> {
  try {
    // Query for subscription tier data from the database
    // This would be fetched from a tiers table or known configuration
    if (tierId === 'free') {
      return 0;
    } else if (tierId === 'pro') {
      return 15;
    } else if (tierId === 'max') {
      return 75;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting tier price:', error);
    return null;
  }
}

/**
 * Verifies a Solana USDC transaction and activates a subscription if valid
 */
export async function verifySubscriptionPayment(
  userId: number, 
  signature: string, 
  tierId: string, 
  amount: number
): Promise<{ success: boolean, message: string }> {
  try {
    console.log(`Verifying payment signature ${signature} for user ${userId}, tier ${tierId}, amount ${amount}`);

    // Verify the transaction on the blockchain
    const verification = await verifyUSDCTransaction(signature, amount.toString());
    
    if (!verification.isValid) {
      console.error(`Transaction verification failed: ${verification.errorMessage}`);
      return { success: false, message: verification.errorMessage || 'Payment verification failed' };
    }
    
    console.log(`Transaction verified successfully: ${JSON.stringify(verification)}`);

    // Get the subscription tier price to verify amount
    const tierPrice = await getSubscriptionTierPrice(tierId);

    if (tierPrice === null) {
      return { success: false, message: 'Invalid subscription tier' };
    }

    // Verify the amount matches the subscription price (free tier price is 0)
    if (tierPrice > 0 && Math.abs(amount - tierPrice) > 0.01) {
      return { 
        success: false, 
        message: `Payment amount ${amount} doesn't match subscription price ${tierPrice}`
      };
    }

    // Insert a new subscription record
    await db.insert(subscriptions).values({
      userId,
      tierId,
      status: 'active',
      paymentMethod: 'usdc',
      amount: amount.toString(),
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      transactionSignature: signature,
      featureAccess: {},
      usageMetrics: {},
      paymentDetails: { signature, amount, timestamp: Date.now() },
      metadata: { verificationDetails: verification }
    });

    console.log(`Subscription activated for user ${userId}, tier ${tierId}`);
    
    return { success: true, message: 'Payment verified and subscription activated' };
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    return { success: false, message: `Payment verification error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Handles verification of a QR code payment
 * Returns status of any pending payment check
 */
export async function checkPendingPayment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tierId, expectedAmount, walletAddress } = req.body;

    if (!tierId || !expectedAmount || !walletAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`Checking pending payment for user ${userId}, tier ${tierId}, amount ${expectedAmount} from wallet ${walletAddress}`);

    // Check for recent transactions from the user's wallet to our company wallet
    const paymentCheck = await checkRecentTransactionsFromWallet(
      walletAddress,
      expectedAmount.toString()
    );

    if (paymentCheck.found && paymentCheck.signature) {
      // Payment found, verify and activate subscription
      const verification = await verifySubscriptionPayment(
        userId,
        paymentCheck.signature,
        tierId,
        parseFloat(expectedAmount)
      );

      // If verification successful, remove any pending payment records
      if (verification.success) {
        await db.delete(pendingPayments)
          .where(eq(pendingPayments.userId, userId));
      }

      return res.json({
        success: verification.success,
        message: verification.message,
        paymentFound: true,
        signature: paymentCheck.signature
      });
    }

    // No payment found yet
    return res.json({
      success: false,
      paymentFound: false,
      message: 'No matching payment found yet. Please complete payment or try again later.'
    });
  } catch (error) {
    console.error('Error checking pending payment:', error);
    return res.status(500).json({ 
      error: `Payment check error: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
}