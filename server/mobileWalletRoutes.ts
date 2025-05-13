import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { db } from './db';
import { 
  mobileSessions, 
  MobileSessionStatus,
  WalletProvider, 
  PaymentMethod, 
  TransactionStatus 
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// In-memory session store for development
const mobileSessions_temp = new Map<string, {
  sessionId: string,
  status: 'pending' | 'connected' | 'completed' | 'expired',
  createdAt: Date,
  publicKey?: string,
  provider?: 'phantom' | 'solflare',
  expiresAt: Date,
  transactionData?: {
    status: 'pending' | 'completed' | 'failed',
    amount: string,
    recipient: string,
    paymentMethod: 'sol' | 'usdc',
    tierId?: string,
    signature?: string
  }
}>();

// Create a new mobile wallet session
export async function createMobileSession(req: Request, res: Response) {
  try {
    // Generate unique session ID
    const sessionId = randomBytes(16).toString('hex');
    
    // Create expiration date (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    if (db) {
      // Store in database if available
      await db.insert(mobileSessions).values({
        sessionId,
        status: 'pending',
        createdAt: new Date(),
        expiresAt
      });
    } else {
      // Use in-memory store if database not available
      mobileSessions_temp.set(sessionId, {
        sessionId,
        status: 'pending',
        createdAt: new Date(),
        expiresAt
      });
    }
    
    // Return session data
    return res.status(201).json({ 
      sessionId,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating mobile session:', error);
    return res.status(500).json({ 
      error: 'Failed to create mobile session' 
    });
  }
}

// Get mobile session status
export async function getMobileSessionStatus(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    let session;
    
    if (db) {
      // Get from database
      const [dbSession] = await db.select()
        .from(mobileSessions)
        .where(eq(mobileSessions.sessionId, sessionId));
      
      session = dbSession;
    } else {
      // Get from in-memory store
      session = mobileSessions_temp.get(sessionId);
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session expired
    if (new Date() > session.expiresAt) {
      // Update session status to expired
      if (db) {
        await db.update(mobileSessions)
          .set({ status: 'expired' })
          .where(eq(mobileSessions.sessionId, sessionId));
      } else {
        session.status = 'expired';
        mobileSessions_temp.set(sessionId, session);
      }
      
      return res.status(410).json({ error: 'Session expired' });
    }
    
    // Return session status
    return res.status(200).json({
      status: session.status,
      publicKey: session.publicKey,
      provider: session.provider,
      expiresAt: session.expiresAt,
      transactionData: session.transactionData
    });
  } catch (error) {
    console.error('Error getting mobile session status:', error);
    return res.status(500).json({ error: 'Failed to get session status' });
  }
}

// Update mobile session (connect wallet)
export async function updateMobileSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { publicKey, provider } = req.body;
    
    if (!sessionId || !publicKey || !provider) {
      return res.status(400).json({ 
        error: 'Session ID, public key, and provider are required' 
      });
    }
    
    let session;
    
    if (db) {
      // Get from database
      const [dbSession] = await db.select()
        .from(mobileSessions)
        .where(eq(mobileSessions.sessionId, sessionId));
      
      session = dbSession;
    } else {
      // Get from in-memory store
      session = mobileSessions_temp.get(sessionId);
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session expired
    if (new Date() > session.expiresAt) {
      return res.status(410).json({ error: 'Session expired' });
    }
    
    // Update session
    if (db) {
      await db.update(mobileSessions)
        .set({ 
          status: 'connected',
          publicKey,
          provider: provider === 'phantom' ? 'phantom' : 'solflare'
        })
        .where(eq(mobileSessions.sessionId, sessionId));
    } else {
      session.status = 'connected';
      session.publicKey = publicKey;
      session.provider = provider === 'phantom' ? 'phantom' : 'solflare';
      mobileSessions_temp.set(sessionId, session);
    }
    
    return res.status(200).json({ 
      message: 'Session updated successfully',
      sessionId
    });
  } catch (error) {
    console.error('Error updating mobile session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

// Create payment request for a mobile session
export async function createMobilePaymentRequest(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { amount, recipient, paymentMethod, tierId } = req.body;
    
    if (!sessionId || !amount || !recipient || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Session ID, amount, recipient, and payment method are required' 
      });
    }
    
    let session;
    
    if (db) {
      // Get from database
      const [dbSession] = await db.select()
        .from(mobileSessions)
        .where(eq(mobileSessions.sessionId, sessionId));
      
      session = dbSession;
    } else {
      // Get from in-memory store
      session = mobileSessions_temp.get(sessionId);
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session expired
    if (new Date() > session.expiresAt) {
      return res.status(410).json({ error: 'Session expired' });
    }
    
    // Check if wallet is connected
    if (session.status !== 'connected') {
      return res.status(400).json({ error: 'Wallet not connected for this session' });
    }
    
    // Update session with transaction data
    if (db) {
      await db.update(mobileSessions)
        .set({ 
          transactionData: {
            status: 'pending',
            amount,
            recipient,
            paymentMethod,
            tierId
          }
        })
        .where(eq(mobileSessions.sessionId, sessionId));
    } else {
      session.transactionData = {
        status: 'pending',
        amount,
        recipient,
        paymentMethod,
        tierId
      };
      mobileSessions_temp.set(sessionId, session);
    }
    
    return res.status(200).json({ 
      message: 'Payment request created',
      sessionId,
      amount,
      recipient,
      paymentMethod
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    return res.status(500).json({ error: 'Failed to create payment request' });
  }
}

// Confirm mobile payment
export async function confirmMobilePayment(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { signature } = req.body;
    
    if (!sessionId || !signature) {
      return res.status(400).json({ 
        error: 'Session ID and transaction signature are required' 
      });
    }
    
    let session;
    
    if (db) {
      // Get from database
      const [dbSession] = await db.select()
        .from(mobileSessions)
        .where(eq(mobileSessions.sessionId, sessionId));
      
      session = dbSession;
    } else {
      // Get from in-memory store
      session = mobileSessions_temp.get(sessionId);
    }
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session expired
    if (new Date() > session.expiresAt) {
      return res.status(410).json({ error: 'Session expired' });
    }
    
    // Check if payment request exists
    if (!session.transactionData) {
      return res.status(400).json({ error: 'No payment request found for this session' });
    }
    
    // Update session with transaction completion
    const updatedTransactionData = {
      ...session.transactionData,
      status: 'completed' as const,
      signature
    };
    
    if (db) {
      await db.update(mobileSessions)
        .set({ 
          status: 'completed',
          transactionData: updatedTransactionData
        })
        .where(eq(mobileSessions.sessionId, sessionId));
    } else {
      session.status = 'completed';
      session.transactionData = updatedTransactionData;
      mobileSessions_temp.set(sessionId, session);
    }
    
    // Return updated session data
    return res.status(200).json({
      message: 'Payment confirmed',
      sessionId,
      status: 'completed',
      transactionData: updatedTransactionData
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
}

// Register mobile wallet routes
export function registerMobileWalletRoutes(app: express.Express) {
  // Mobile session routes
  app.post('/api/mobile/session', createMobileSession);
  app.get('/api/mobile/session/:sessionId', getMobileSessionStatus);
  app.post('/api/mobile/session/:sessionId/connect', updateMobileSession);
  app.post('/api/mobile/session/:sessionId/payment', createMobilePaymentRequest);
  app.post('/api/mobile/session/:sessionId/payment/confirm', confirmMobilePayment);
}