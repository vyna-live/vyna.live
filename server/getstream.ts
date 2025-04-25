import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const {
  GETSTREAM_API_KEY,
  GETSTREAM_API_SECRET
} = process.env;

if (!GETSTREAM_API_KEY || !GETSTREAM_API_SECRET) {
  throw new Error('GetStream API credentials are required to run livestreaming services');
}

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

// Create a call with egress configuration (for multiplatform streaming)
export async function createCallWithEgress(
  callId: string, 
  userId: string,
  egressSettings?: {
    enabled: boolean;
    platforms: {
      youtube?: { enabled: boolean; streamKey?: string; streamUrl?: string };
      twitch?: { enabled: boolean; streamKey?: string; streamUrl?: string };
      facebook?: { enabled: boolean; streamKey?: string; streamUrl?: string };
      custom?: { enabled: boolean; streamKey?: string; streamUrl?: string; name?: string };
    };
  }
) {
  try {
    // Build the egress configuration according to GetStream docs
    const egressConfig: any = { enabled: false, targets: [] };
    
    if (egressSettings?.enabled) {
      egressConfig.enabled = true;
      
      // YouTube configuration
      if (egressSettings.platforms.youtube?.enabled && 
          egressSettings.platforms.youtube.streamKey &&
          egressSettings.platforms.youtube.streamUrl) {
        egressConfig.targets.push({
          name: 'youtube',
          rtmp: {
            url: egressSettings.platforms.youtube.streamUrl,
            streamKey: egressSettings.platforms.youtube.streamKey
          }
        });
      }
      
      // Twitch configuration
      if (egressSettings.platforms.twitch?.enabled && 
          egressSettings.platforms.twitch.streamKey &&
          egressSettings.platforms.twitch.streamUrl) {
        egressConfig.targets.push({
          name: 'twitch',
          rtmp: {
            url: egressSettings.platforms.twitch.streamUrl,
            streamKey: egressSettings.platforms.twitch.streamKey
          }
        });
      }
      
      // Facebook configuration
      if (egressSettings.platforms.facebook?.enabled && 
          egressSettings.platforms.facebook.streamKey &&
          egressSettings.platforms.facebook.streamUrl) {
        egressConfig.targets.push({
          name: 'facebook',
          rtmp: {
            url: egressSettings.platforms.facebook.streamUrl,
            streamKey: egressSettings.platforms.facebook.streamKey
          }
        });
      }
      
      // Custom RTMP endpoint configuration
      if (egressSettings.platforms.custom?.enabled && 
          egressSettings.platforms.custom.streamKey &&
          egressSettings.platforms.custom.streamUrl) {
        egressConfig.targets.push({
          name: egressSettings.platforms.custom.name || 'custom',
          rtmp: {
            url: egressSettings.platforms.custom.streamUrl,
            streamKey: egressSettings.platforms.custom.streamKey
          }
        });
      }
    }
    
    // In a real implementation, we would make an API call to GetStream
    // to create the call with the egress configuration
    
    // For now, we're simulating the response
    return {
      id: callId,
      type: 'livestream',
      cid: `livestream:${callId}`,
      egressConfig: egressConfig,
      egress: egressConfig.enabled ? { 
        status: 'ready',
        targets: egressConfig.targets.map((target: any) => ({
          name: target.name,
          status: 'ready'
        }))
      } : null
    };
  } catch (error) {
    console.error('Error creating call with egress:', error);
    throw error;
  }
}

// Endpoint to get Stream API key
export async function getStreamApiKey(req: Request, res: Response) {
  try {
    return res.status(200).json({ apiKey: GETSTREAM_API_KEY });
  } catch (error) {
    console.error('Error in getStreamApiKey:', error);
    return res.status(500).json({ error: 'Failed to get API key' });
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
    const { callId, userId, token, egressSettings } = req.body;
    
    if (!callId || !userId || !token) {
      return res.status(400).json({ error: 'callId, userId, and token are required' });
    }
    
    // Create a call with egress configuration if provided
    const call = await createCallWithEgress(callId, userId, egressSettings);
    
    return res.status(200).json({ 
      callId: call.id,
      callType: call.type,
      callCid: call.cid,
      egress: call.egress
    });
  } catch (error) {
    console.error('Error in createLivestream:', error);
    return res.status(500).json({ error: 'Failed to create livestream' });
  }
}

// Endpoint to update egress configuration for a livestream
export async function updateEgressConfig(req: Request, res: Response) {
  try {
    const { callId, userId, egressSettings } = req.body;
    
    if (!callId || !userId) {
      return res.status(400).json({ error: 'callId and userId are required' });
    }
    
    // In a real implementation, we would make an API call to GetStream
    // to update the egress configuration for an existing call
    // For now we simulate success with egress configuration
    
    const egressConfig: any = { enabled: false, targets: [] };
    
    if (egressSettings?.enabled) {
      egressConfig.enabled = true;
      
      // Add any configured platforms to targets
      Object.entries(egressSettings.platforms || {}).forEach(([platform, config]: [string, any]) => {
        if (config?.enabled && config.streamKey && config.streamUrl) {
          egressConfig.targets.push({
            name: platform === 'custom' ? (config.name || 'custom') : platform,
            rtmp: {
              url: config.streamUrl,
              streamKey: config.streamKey
            }
          });
        }
      });
    }
    
    return res.status(200).json({
      callId,
      egress: egressConfig.enabled ? {
        status: 'ready',
        targets: egressConfig.targets.map((target: any) => ({
          name: target.name,
          status: 'ready'
        }))
      } : null
    });
  } catch (error) {
    console.error('Error in updateEgressConfig:', error);
    return res.status(500).json({ error: 'Failed to update egress configuration' });
  }
}