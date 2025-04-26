import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Agora API handling for livestreaming
 */

// Check if the app ID is set
const AGORA_APP_ID = process.env.AGORA_APP_ID;
if (!AGORA_APP_ID) {
  console.warn('Warning: AGORA_APP_ID environment variable is not set. Agora functionality will be limited.');
}

// Store active channels with their configurations
interface ChannelConfig {
  uid: string;
  channelName: string;
  role: 'host' | 'audience';
  created: Date;
  rtmpDestinations?: string[];
}

const activeChannels = new Map<string, ChannelConfig>();

/**
 * Get Agora App ID (public endpoint)
 */
export async function getAgoraAppId(req: Request, res: Response) {
  if (!AGORA_APP_ID) {
    return res.status(500).json({ 
      error: 'Agora App ID not configured on server' 
    });
  }
  
  res.json({ appId: AGORA_APP_ID });
}

/**
 * Initialize a channel for streaming
 */
export async function initializeChannel(req: Request, res: Response) {
  try {
    const { 
      channelName = `channel-${Date.now()}`,
      role = 'host'
    } = req.body;
    
    if (!AGORA_APP_ID) {
      return res.status(500).json({ 
        error: 'Agora App ID not configured on server' 
      });
    }
    
    // Generate a unique ID for this user in this channel
    const uid = randomUUID().replace(/-/g, '').slice(0, 16);
    
    // Save the channel config
    const channelConfig: ChannelConfig = {
      uid,
      channelName,
      role,
      created: new Date(),
    };
    
    activeChannels.set(channelName, channelConfig);
    
    // Return the necessary information to join the channel
    res.json({
      appId: AGORA_APP_ID,
      channel: channelName,
      uid,
      // In a production environment, we would generate a token here
      // token: generateToken(channelName, uid, role),
    });
  } catch (error: any) {
    console.error('Error initializing Agora channel:', error);
    res.status(500).json({ 
      error: 'Failed to initialize streaming channel',
      details: error.message || String(error)
    });
  }
}

/**
 * Add RTMP destinations for multiplatform streaming
 */
export async function addRtmpDestination(req: Request, res: Response) {
  try {
    const { channelName, rtmpUrl } = req.body;
    
    if (!channelName || !rtmpUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameters: channelName, rtmpUrl' 
      });
    }
    
    const channelConfig = activeChannels.get(channelName);
    if (!channelConfig) {
      return res.status(404).json({ 
        error: 'Channel not found' 
      });
    }
    
    // Add the RTMP destination
    if (!channelConfig.rtmpDestinations) {
      channelConfig.rtmpDestinations = [];
    }
    
    channelConfig.rtmpDestinations.push(rtmpUrl);
    activeChannels.set(channelName, channelConfig);
    
    // In a real implementation, we would call Agora's Cloud Recording API
    // to start recording and streaming to RTMP destinations
    
    res.json({
      success: true,
      message: 'RTMP destination added',
      destinations: channelConfig.rtmpDestinations
    });
  } catch (error) {
    console.error('Error adding RTMP destination:', error);
    res.status(500).json({ 
      error: 'Failed to add RTMP destination',
      details: error.message
    });
  }
}

/**
 * Get all active channels (for debugging)
 */
export async function getActiveChannels(req: Request, res: Response) {
  const channels = Array.from(activeChannels.entries()).map(([name, config]) => ({
    name,
    ...config,
    // Don't expose the full uid for security
    uid: config.uid.substring(0, 4) + '...',
  }));
  
  res.json({
    channels,
    count: channels.length
  });
}