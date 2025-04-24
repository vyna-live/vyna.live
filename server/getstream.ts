import { StreamVideoClient } from '@stream-io/video-client';
import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const {
  GETSTREAM_API_KEY,
  GETSTREAM_API_SECRET
} = process.env;

if (!GETSTREAM_API_KEY || !GETSTREAM_API_SECRET) {
  throw new Error('GetStream API credentials are required to run livestreaming services');
}

// Initialize Stream client
const client = new StreamVideoClient({
  apiKey: GETSTREAM_API_KEY,
  token: '', // This will be set per user/call
  tokenProvider: async () => {
    // This is a fallback and should not be used in production
    return '';
  },
});

// Generate a token for the frontend
export async function generateStreamToken(userId: string, userName: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
  
  try {
    // Create a JWT token manually
    const payload = {
      user_id: userId,
      name: userName,
      role: 'admin',
      exp: expiresAt
    };

    const token = jwt.sign(
      payload,
      GETSTREAM_API_SECRET as string,
      { algorithm: 'HS256' }
    );
    
    return token;
  } catch (error) {
    console.error('Error generating Stream token:', error);
    throw error;
  }
}

// Create a call (livestream session)
export async function createCall(callId: string, userId: string, userToken: string) {
  try {
    // Connect the user to the Stream service
    await client.connectUser({ id: userId }, userToken);
    
    // Create a call instance
    const call = client.call('livestream', callId);
    
    // Initialize the call on the Stream servers
    await call.getOrCreate();
    
    return {
      id: callId,
      type: 'livestream',
      cid: `livestream:${callId}` 
    };
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
}

// Endpoint to get a Stream token
export async function getStreamToken(req: Request, res: Response) {
  try {
    const { userId, userName } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ error: 'userId and userName are required' });
    }
    
    const token = await generateStreamToken(userId, userName);
    
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error in getStreamToken:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}

// Endpoint to create a new livestream
export async function createLivestream(req: Request, res: Response) {
  try {
    const { callId, userId, token } = req.body;
    
    if (!callId || !userId || !token) {
      return res.status(400).json({ error: 'callId, userId, and token are required' });
    }
    
    const call = await createCall(callId, userId, token);
    
    return res.status(200).json({ 
      callId: call.id,
      callType: call.type,
      callCid: call.cid
    });
  } catch (error) {
    console.error('Error in createLivestream:', error);
    return res.status(500).json({ error: 'Failed to create livestream' });
  }
}