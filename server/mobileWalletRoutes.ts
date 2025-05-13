import { Request, Response } from 'express';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { mobileSessions, MobileSessionStatus, WalletProvider, PaymentMethod, TransactionStatus } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { addMinutes } from 'date-fns';

// Create a new mobile session
export async function createMobileSession(req: Request, res: Response) {
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = addMinutes(new Date(), 15);
    
    // Insert new session into database
    const [session] = await db.insert(mobileSessions).values({
      sessionId,
      status: 'pending',
      expiresAt,
    }).returning();
    
    // Return session data
    return res.status(201).json({
      sessionId: session.sessionId,
      status: session.status,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Error creating mobile session:', error);
    return res.status(500).json({ error: 'Failed to create mobile session' });
  }
}

// Get mobile session status
export async function getMobileSessionStatus(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Get session from database
    const [session] = await db.select().from(mobileSessions).where(eq(mobileSessions.sessionId, sessionId));
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Update session status to expired
      await db.update(mobileSessions)
        .set({ status: 'expired' })
        .where(eq(mobileSessions.sessionId, sessionId));
      
      // Return expired session
      return res.status(410).json({
        sessionId: session.sessionId,
        status: 'expired',
        expiresAt: session.expiresAt,
      });
    }
    
    // Return session data
    return res.json({
      sessionId: session.sessionId,
      status: session.status,
      publicKey: session.publicKey,
      provider: session.provider,
      expiresAt: session.expiresAt,
      transactionData: session.transactionData,
    });
  } catch (error) {
    console.error('Error getting mobile session status:', error);
    return res.status(500).json({ error: 'Failed to get session status' });
  }
}

// Update mobile session with wallet connection
export async function updateMobileSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { publicKey, provider } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }
    
    if (!provider || (provider !== 'phantom' && provider !== 'solflare')) {
      return res.status(400).json({ error: 'Provider must be either "phantom" or "solflare"' });
    }
    
    // Get session from database
    const [session] = await db.select().from(mobileSessions).where(eq(mobileSessions.sessionId, sessionId));
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Update session status to expired
      await db.update(mobileSessions)
        .set({ status: 'expired' })
        .where(eq(mobileSessions.sessionId, sessionId));
      
      // Return expired session
      return res.status(410).json({
        sessionId: session.sessionId,
        status: 'expired',
        expiresAt: session.expiresAt,
      });
    }
    
    // Update session with wallet connection
    const [updatedSession] = await db.update(mobileSessions)
      .set({
        status: 'connected' as MobileSessionStatus,
        publicKey,
        provider: provider as WalletProvider,
      })
      .where(eq(mobileSessions.sessionId, sessionId))
      .returning();
    
    // Return updated session data
    return res.json({
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      publicKey: updatedSession.publicKey,
      provider: updatedSession.provider,
      expiresAt: updatedSession.expiresAt,
      transactionData: updatedSession.transactionData,
    });
  } catch (error) {
    console.error('Error updating mobile session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

// Create a payment request for a mobile session
export async function createMobilePaymentRequest(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { amount, paymentMethod, tierId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    if (!paymentMethod || (paymentMethod !== 'sol' && paymentMethod !== 'usdc')) {
      return res.status(400).json({ error: 'Payment method must be either "sol" or "usdc"' });
    }
    
    // Get session from database
    const [session] = await db.select().from(mobileSessions).where(eq(mobileSessions.sessionId, sessionId));
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Update session status to expired
      await db.update(mobileSessions)
        .set({ status: 'expired' })
        .where(eq(mobileSessions.sessionId, sessionId));
      
      // Return expired session
      return res.status(410).json({
        sessionId: session.sessionId,
        status: 'expired',
        expiresAt: session.expiresAt,
      });
    }
    
    // Program wallet that receives the payment (must match the one in the client)
    const recipient = 'HF7EHsCJAiQvuVyvEZpEXGAnbLk1hotBKuuTq7v9JBYU';
    
    // Update session with payment request
    const transactionData = {
      status: 'pending' as TransactionStatus,
      amount,
      recipient,
      paymentMethod: paymentMethod as PaymentMethod,
      tierId,
    };
    
    const [updatedSession] = await db.update(mobileSessions)
      .set({ transactionData })
      .where(eq(mobileSessions.sessionId, sessionId))
      .returning();
    
    // Return updated session data
    return res.json({
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      publicKey: updatedSession.publicKey,
      provider: updatedSession.provider,
      expiresAt: updatedSession.expiresAt,
      transactionData: updatedSession.transactionData,
    });
  } catch (error) {
    console.error('Error creating mobile payment request:', error);
    return res.status(500).json({ error: 'Failed to create payment request' });
  }
}

// Confirm a payment for a mobile session
export async function confirmMobilePayment(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { signature } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!signature) {
      return res.status(400).json({ error: 'Transaction signature is required' });
    }
    
    // Get session from database
    const [session] = await db.select().from(mobileSessions).where(eq(mobileSessions.sessionId, sessionId));
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Update session status to expired
      await db.update(mobileSessions)
        .set({ status: 'expired' })
        .where(eq(mobileSessions.sessionId, sessionId));
      
      // Return expired session
      return res.status(410).json({
        sessionId: session.sessionId,
        status: 'expired',
        expiresAt: session.expiresAt,
      });
    }
    
    // Check if session has transaction data
    if (!session.transactionData) {
      return res.status(400).json({ error: 'No payment request found for this session' });
    }
    
    // Update transaction data with signature
    const transactionData = {
      ...session.transactionData,
      status: 'completed' as TransactionStatus,
      signature,
    };
    
    // Update session with completed payment
    const [updatedSession] = await db.update(mobileSessions)
      .set({
        status: 'completed' as MobileSessionStatus,
        transactionData,
      })
      .where(eq(mobileSessions.sessionId, sessionId))
      .returning();
    
    // Return updated session data
    return res.json({
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      publicKey: updatedSession.publicKey,
      provider: updatedSession.provider,
      expiresAt: updatedSession.expiresAt,
      transactionData: updatedSession.transactionData,
    });
  } catch (error) {
    console.error('Error confirming mobile payment:', error);
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
}

// Register all mobile wallet routes
export function registerMobileWalletRoutes(app: express.Express) {
  app.post('/api/mobile/session', createMobileSession);
  app.get('/api/mobile/session/:sessionId', getMobileSessionStatus);
  app.post('/api/mobile/session/:sessionId/connect', updateMobileSession);
  app.post('/api/mobile/payment/:sessionId', createMobilePaymentRequest);
  app.post('/api/mobile/payment/:sessionId/confirm', confirmMobilePayment);
}