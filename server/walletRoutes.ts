import { Request, Response } from 'express';
import { db } from './db';
import { users, walletTransactions } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Define session types
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Extend Express request type
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
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { address, provider } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Update user record with wallet info
    await db
      .update(users)
      .set({
        walletAddress: address,
        walletProvider: provider || 'phantom',
        walletConnectedAt: new Date(),
      })
      .where(eq(users.id, req.session.userId));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating user wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user's wallet information
export async function getUserWallet(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db
      .select({
        walletAddress: users.walletAddress,
        walletProvider: users.walletProvider,
        walletConnectedAt: users.walletConnectedAt,
      })
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Record a new transaction
export async function recordTransaction(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      signature,
      amount,
      transactionType,
      fromAddress,
      toAddress,
    } = req.body;

    if (!signature || !amount || !transactionType) {
      return res.status(400).json({ error: 'Missing required transaction information' });
    }

    // Insert transaction record
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        userId: req.session.userId,
        signature,
        amount: amount.toString(),
        transactionType,
        status: 'pending',
        fromAddress: fromAddress,
        toAddress: toAddress,
        createdAt: new Date(),
      })
      .returning();

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Error recording transaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Update transaction status (confirmed/failed)
export async function updateTransactionStatus(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Transaction ID and status are required' });
    }

    // Validate status
    if (!['confirmed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "confirmed" or "failed"' });
    }

    // Update transaction record
    const [transaction] = await db
      .update(walletTransactions)
      .set({
        status,
        confirmedAt: status === 'confirmed' ? new Date() : null,
      })
      .where(
        and(
          eq(walletTransactions.id, id),
          eq(walletTransactions.userId, req.session.userId)
        )
      )
      .returning();

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user's transaction history
export async function getUserTransactions(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get transactions ordered by most recent first
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, req.session.userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(50);

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}