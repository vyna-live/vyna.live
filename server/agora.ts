import { Request, Response } from 'express';
import * as agoraAccessToken from 'agora-access-token';

// Define constants from the module
const PUBLISHER_ROLE = 1; // RtcRole.PUBLISHER value 
const SUBSCRIBER_ROLE = 2; // RtcRole.SUBSCRIBER value
const RTM_ROLE = 1; // RTM Role.Publisher is always 1

// Agora app credentials from environment variables
const appId = process.env.AGORA_APP_ID!;
const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

// Check if Agora credentials are available
function areAgoraCredentialsAvailable(): boolean {
  return Boolean(appId && appCertificate);
}

// Helper to build an RTC token with uid (for video/audio)
function generateRtcToken(channelName: string, uid: number, role: number, expirationTimeInSeconds: number = 3600) {
  if (!areAgoraCredentialsAvailable()) {
    throw new Error('Missing Agora credentials');
  }

  // Calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expirationTimeInSeconds;

  // Build the RTC token
  return agoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );
}

// Helper to build an RTM token (for chat messaging)
function generateRtmToken(userId: string, expirationTimeInSeconds: number = 3600) {
  if (!areAgoraCredentialsAvailable()) {
    throw new Error('Missing Agora credentials');
  }

  // Calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expirationTimeInSeconds;

  // Build the RTM token
  return agoraAccessToken.RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    userId,
    RTM_ROLE,
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

    // Generate a token with host privileges for RTC (video/audio)
    const rtcToken = generateRtcToken(channelName, uidNumber, PUBLISHER_ROLE);
    
    // Generate an RTM token for chat (using the UID as a string for the user ID)
    const rtmToken = generateRtmToken(uidNumber.toString());

    res.json({
      rtcToken,
      rtmToken,
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

    console.log(`Generating audience token for channel: ${channelName}`);
    
    // If the channel starts with "stream_", we need to make sure we're using the right format
    let actualChannelName = channelName;
    
    // Get actual channel name from our mappings if it exists
    if (global.streamIdToChannel) {
      const mappedChannel = global.streamIdToChannel.get(channelName);
      if (mappedChannel) {
        actualChannelName = mappedChannel;
        console.log(`Found mapped channel: ${channelName} -> ${actualChannelName}`);
      }
    }
    
    console.log(`Using channel name for token: ${actualChannelName}`);
    
    // Convert string uid to number if needed
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    // Generate tokens for audience
    const rtcToken = generateRtcToken(actualChannelName, uidNumber, SUBSCRIBER_ROLE);
    const rtmToken = generateRtmToken(uidNumber.toString());

    console.log(`Generated tokens for audience member with UID: ${uidNumber}`);
    
    res.json({
      rtcToken,
      rtmToken,
      appId,
      channelName: actualChannelName,
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

    // Generate a simpler, more reliable stream ID
    // Format: "stream_" + random alphanumeric string + timestamp
    const randomStr = Math.random().toString(36).substring(2, 8);
    const streamId = `stream_${randomStr}_${Date.now()}`;
    
    // Use a simpler channel name format that doesn't include the full title
    // This avoids issues with special characters and long titles
    const channelName = streamId;
    
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    // Generate tokens with host privileges
    const rtcToken = generateRtcToken(channelName, uidNumber, PUBLISHER_ROLE);
    const rtmToken = generateRtmToken(uidNumber.toString());

    console.log(`Creating livestream: ${title} with ID ${streamId} and channel ${channelName}`);
    
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
        rtcToken,
        rtmToken,
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