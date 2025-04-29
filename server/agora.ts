import { Request, Response } from 'express';
// Import Agora token module using dynamic import for compatibility
import AgoraTokenModule from 'agora-token';

// Create a safer way to access the module
const AgoraToken = AgoraTokenModule as any;

// Define role constants
const PUBLISHER_ROLE = 1; // RtcRole.PUBLISHER
const SUBSCRIBER_ROLE = 2; // RtcRole.SUBSCRIBER

// Log startup info
console.log('Using agora-token package for token generation');
console.log('Available roles:', { PUBLISHER: PUBLISHER_ROLE, SUBSCRIBER: SUBSCRIBER_ROLE });

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

  try {
    // Log token generation attempt
    console.log('Attempting to generate RTC token with role:', role);

    // Calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expirationTimeInSeconds;

    console.log('Generating RTC token with params:', {
      appId: appId ? `${appId.substring(0, 8)}...` : 'undefined',
      channelName,
      uid,
      role,
      privilegeExpireTime
    });

    // Enhanced error handling and debugging for RTC token generation
    try {
      console.log('Using AgoraToken.RtcTokenBuilder.buildTokenWithUid with proper parameters');
      
      // Try to build the RTC token using the agora-token package
      // For RTC tokens, use the RtcTokenBuilder.buildTokenWithUid method
      const token = AgoraToken.RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpireTime,
        privilegeExpireTime // Added privilegeExpire parameter
      );
      
      console.log(`Successfully generated RTC token: ${token.substring(0, 10)}...`);
      return token;
    } catch (primaryError) {
      console.error('Error in primary RTC token generation method:', primaryError);
      throw primaryError;
    }
  } catch (error) {
    console.error('All RTC token generation methods failed:', error);
    
    // We need real tokens for RTC to work
    // Clearly communicate the issue
    console.error('Cannot generate valid RTC token - Agora RTC may not function correctly');
    throw new Error('Failed to generate valid RTC token');
  }
}

// Helper to build an RTM token (for chat messaging)
function generateRtmToken(userId: string, expirationTimeInSeconds: number = 3600) {
  if (!areAgoraCredentialsAvailable()) {
    throw new Error('Missing Agora credentials');
  }

  try {
    // Log token generation attempt
    console.log('Attempting to generate RTM token');

    // Calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expirationTimeInSeconds;

    console.log('Generating RTM token with params:', {
      appId: appId ? `${appId.substring(0, 8)}...` : 'undefined',
      userId,
      privilegeExpireTime
    });

    // First try using the agora-token package with proper params
    try {
      // Enhanced error handling and debugging
      console.log('Using AgoraToken.RtmTokenBuilder.buildToken with proper parameters');
      
      // Generate a token using the agora-token package
      // Important: For RTM tokens, use the RtmTokenBuilder.buildToken method
      const token = AgoraToken.RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        userId,
        privilegeExpireTime
      );
      
      console.log(`Successfully generated RTM token: ${token.substring(0, 10)}...`);
      return token;
    } catch (primaryError) {
      console.error('Error in primary RTM token generation method:', primaryError);
      throw primaryError;
    }
  } catch (error) {
    console.error('All RTM token generation methods failed:', error);
    
    // Never use development placeholder tokens - we need real tokens for RTM to work
    // Clearly communicate the issue
    console.error('Cannot generate valid RTM token - Agora RTM may not function correctly');
    throw new Error('Failed to generate valid RTM token - chat functionality may be limited');
  }
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
      // Print current mappings for debugging
      const mappings = Array.from(global.streamIdToChannel.entries())
        .map(([id, channel]) => `${id} -> ${channel}`);
      console.log('Current stream mappings:', mappings);
      
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

    console.log(`Creating livestream: ${title} with ID ${streamId} and channel ${channelName} for UID: ${uidNumber}`);
    
    // Generate tokens with host privileges
    let rtcToken, rtmToken;
    try {
      rtcToken = generateRtcToken(channelName, uidNumber, PUBLISHER_ROLE);
      console.log('Generated RTC host token successfully');
    } catch (rtcError) {
      console.error('Error generating RTC token:', rtcError);
      throw new Error('Failed to generate RTC host token');
    }
    
    try {
      rtmToken = generateRtmToken(uidNumber.toString());
      console.log('Generated RTM host token successfully');
    } catch (rtmError) {
      console.error('Error generating RTM token:', rtmError);
      throw new Error('Failed to generate RTM host token');
    }
    
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