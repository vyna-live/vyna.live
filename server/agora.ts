import { Request, Response } from 'express';
import * as agoraAccessToken from 'agora-access-token';

// Define constants from the module
const PUBLISHER_ROLE = 1; // RtcRole.PUBLISHER value 
const SUBSCRIBER_ROLE = 2; // RtcRole.SUBSCRIBER value

// Agora app credentials from environment variables
const appId = process.env.AGORA_APP_ID!;
const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

// Check if Agora credentials are available
function areAgoraCredentialsAvailable(): boolean {
  return Boolean(appId && appCertificate);
}

// Helper to build a token with uid
function generateAgoraToken(channelName: string, uid: number, role: number, expirationTimeInSeconds: number = 3600) {
  if (!areAgoraCredentialsAvailable()) {
    throw new Error('Missing Agora credentials');
  }

  // Calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expirationTimeInSeconds;

  // Build the token
  return agoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );
}

// API endpoint to get the Agora App ID
export function getAgoraAppId(req: Request, res: Response) {
  if (!areAgoraCredentialsAvailable()) {
    return res.status(500).json({ error: 'Missing Agora credentials' });
  }

  res.json({ appId });
}

// API endpoint to generate a token for a host (broadcaster)
export function getHostToken(req: Request, res: Response) {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    // Convert string uid to number if needed
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || 0;

    // Generate a token with host privileges
    const token = generateAgoraToken(channelName, uidNumber, PUBLISHER_ROLE);

    res.json({
      token,
      appId,
      channelName,
      uid: uidNumber,
      role: 'host',
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate token' });
  }
}

// API endpoint to generate a token for an audience member
export function getAudienceToken(req: Request, res: Response) {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    // Convert string uid to number if needed
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    console.log(`Generating audience token for channel: ${channelName}, uid: ${uidNumber}`);
    
    // Generate a token with audience privileges and longer expiration (4 hours)
    const token = generateAgoraToken(channelName, uidNumber, SUBSCRIBER_ROLE, 14400);

    // Log the token (partial) for debugging
    console.log(`Generated audience token: ${token.substring(0, 20)}...`);

    res.json({
      token,
      appId,
      channelName,
      uid: uidNumber,
      role: 'audience',
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate token' });
  }
}

// Declare types for global objects
declare global {
  var streamIdToChannel: Map<string, string>;
  var streamViewers: Map<string, {
    count: number,
    title: string,
    streamId?: string,
    hostName?: string,
    hostAvatar?: string,
    isActive?: boolean,
    lastUpdated: number
  }>;
}

// Create a livestream
export async function createLivestream(req: Request, res: Response) {
  try {
    const { title, userName, uid } = req.body;

    if (!title || !userName) {
      return res.status(400).json({ error: 'Title and userName are required' });
    }

    // Generate a clean channel name (using title and timestamp for uniqueness)
    // Make sure it doesn't include any special characters that could cause token issues
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const channelName = `${cleanTitle}${Date.now()}`;
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    // Generate a token with host privileges with longer expiration time (4 hours)
    const token = generateAgoraToken(channelName, uidNumber, PUBLISHER_ROLE, 14400);

    // Use the same channelName as the streamId for consistency
    const streamId = channelName;

    console.log(`Creating livestream: ${title} with ID ${streamId}`);
    
    // Initialize global maps if they don't exist yet
    if (!global.streamIdToChannel) {
      global.streamIdToChannel = new Map();
    }
    
    if (!global.streamViewers) {
      global.streamViewers = new Map();
    }

    // Update global mappings for this stream
    global.streamIdToChannel.set(streamId, channelName);
    console.log(`Added mapping: ${streamId} -> ${channelName}`);

    global.streamViewers.set(channelName, {
      count: 1, // Start with 1 viewer (the streamer)
      title: title,
      hostName: userName,
      streamId: streamId,
      isActive: true,
      lastUpdated: Date.now()
    });
    console.log(`Added viewer data for channel: ${channelName}`);

    // Return the live stream details
    res.json({
      success: true,
      livestream: {
        id: streamId,
        title,
        hostName: userName,
        channelName,
        token,
        appId,
        uid: uidNumber,
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating livestream:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create livestream' });
  }
}