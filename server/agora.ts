import { Request, Response } from 'express';
import crypto from 'crypto';

// In-memory store for active channels (in a real app, use your database)
const activeChannels: Map<string, ChannelConfig> = new Map();

interface ChannelConfig {
  uid: string;
  channelName: string;
  role: 'host' | 'audience';
  created: Date;
  rtmpDestinations?: string[];
}

/**
 * Get Agora App ID (public endpoint)
 */
export async function getAgoraAppId(req: Request, res: Response) {
  const appId = process.env.AGORA_APP_ID;
  
  if (!appId) {
    return res.status(500).json({ error: 'Agora App ID not configured' });
  }
  
  res.json({ appId });
}

/**
 * Initialize a channel for streaming
 */
export async function initializeChannel(req: Request, res: Response) {
  try {
    const { channelName, role = 'host' } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    // Generate a random user ID for this channel
    const uid = crypto.randomBytes(8).toString('hex');
    
    // Create channel configuration
    const channelConfig: ChannelConfig = {
      uid,
      channelName,
      role,
      created: new Date(),
      rtmpDestinations: []
    };
    
    // Store channel configuration
    activeChannels.set(channelName, channelConfig);
    
    // Return necessary information
    res.json({
      uid,
      channelName,
      appId: process.env.AGORA_APP_ID,
      role,
    });
  } catch (error) {
    console.error('Error initializing channel:', error);
    res.status(500).json({ error: 'Failed to initialize channel' });
  }
}

/**
 * Add RTMP destinations for multiplatform streaming
 */
export async function addRtmpDestination(req: Request, res: Response) {
  try {
    const { channelName, rtmpUrl } = req.body;
    
    if (!channelName || !rtmpUrl) {
      return res.status(400).json({ error: 'Channel name and RTMP URL are required' });
    }
    
    const channel = activeChannels.get(channelName);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Add RTMP URL to channel configuration
    if (!channel.rtmpDestinations) {
      channel.rtmpDestinations = [];
    }
    
    // Don't add duplicates
    if (!channel.rtmpDestinations.includes(rtmpUrl)) {
      channel.rtmpDestinations.push(rtmpUrl);
    }
    
    // Update channel in store
    activeChannels.set(channelName, channel);
    
    res.json({
      success: true,
      message: 'RTMP destination added',
      rtmpUrl,
      channelName
    });
  } catch (error) {
    console.error('Error adding RTMP destination:', error);
    res.status(500).json({ error: 'Failed to add RTMP destination' });
  }
}

/**
 * Get all active channels (for debugging)
 */
export async function getActiveChannels(req: Request, res: Response) {
  const channels = Array.from(activeChannels.values());
  
  res.json({
    count: channels.length,
    channels: channels.map(c => ({
      channelName: c.channelName,
      created: c.created,
      rtmpDestinations: c.rtmpDestinations || []
    }))
  });
}