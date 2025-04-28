import { Request, Response } from 'express';
import { db } from './db';
import { users, walletTransactions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// This is for type augmentation
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: number;
        [key: string]: any;
      };
    }
  }
}

// Update user's wallet information
export async function updateUserWallet(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress, walletProvider } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Update user's wallet information
    const [updatedUser] = await db
      .update(users)
      .set({
        walletAddress,
        walletProvider: walletProvider || 'phantom',
        walletConnectedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return res.status(200).json({
      success: true,
      walletAddress: updatedUser.walletAddress,
      walletProvider: updatedUser.walletProvider,
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Failed to update wallet information' });
  }
}

// Get user's wallet information
export async function getUserWallet(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [user] = await db
      .select({
        walletAddress: users.walletAddress,
        walletProvider: users.walletProvider,
        walletConnectedAt: users.walletConnectedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.walletAddress) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting wallet:', error);
    return res.status(500).json({ error: 'Failed to get wallet information' });
  }
}

// Record a new wallet transaction
export async function recordTransaction(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      signature,
      amount,
      transactionType,
      fromAddress,
      toAddress,
      livestreamId,
      metadata,
    } = req.body;

    if (!signature || !amount || !transactionType || !fromAddress || !toAddress) {
      return res.status(400).json({ error: 'Missing required transaction information' });
    }

    // Insert transaction record
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        userId,
        signature,
        amount,
        transactionType,
        status: 'pending',
        fromAddress,
        toAddress,
        livestreamId: livestreamId || null,
        metadata: metadata || null,
        createdAt: new Date(),
      })
      .returning();

    return res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    return res.status(500).json({ error: 'Failed to record transaction' });
  }
}

// Update transaction status (e.g. after confirmation)
export async function updateTransactionStatus(req: Request, res: Response) {
  try {
    const { signature, status } = req.body;
    if (!signature || !status) {
      return res.status(400).json({ error: 'Signature and status are required' });
    }

    const [updatedTransaction] = await db
      .update(walletTransactions)
      .set({
        status,
        confirmedAt: status === 'confirmed' ? new Date() : null,
      })
      .where(eq(walletTransactions.signature, signature))
      .returning();

    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return res.status(500).json({ error: 'Failed to update transaction' });
  }
}

// Get user's transactions
export async function getUserTransactions(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(walletTransactions.createdAt);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ error: 'Failed to get transactions' });
  }
}