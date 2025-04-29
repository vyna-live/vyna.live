import { Request, Response } from 'express';

// We need to use dynamic imports since we're in an ES module
let agoraAccessToken: any = null;
let RtcTokenBuilder: any = null;
let RtmTokenBuilder: any = null;

// Define role constants directly since we're using ESM with a CommonJS module
const PUBLISHER_ROLE = 1;  // RtcRole.PUBLISHER
const SUBSCRIBER_ROLE = 2;  // RtcRole.SUBSCRIBER
const RTM_ROLE = 1;  // RtmRole.Rtm_User

// Initialize the Agora token builders asynchronously
(async () => {
  try {
    // Use dynamic import to load the CommonJS module
    agoraAccessToken = await import('agora-access-token');
    
    // Log available properties
    console.log('Agora access token import successful');
    console.log('Available properties:', Object.keys(agoraAccessToken));
    
    // Extract the token builders
    RtcTokenBuilder = agoraAccessToken.RtcTokenBuilder;
    RtmTokenBuilder = agoraAccessToken.RtmTokenBuilder;
    
    // Check if they're available
    console.log('RtcTokenBuilder:', RtcTokenBuilder ? 'Available' : 'Not available');
    console.log('RtmTokenBuilder:', RtmTokenBuilder ? 'Available' : 'Not available');
    
    if (RtcTokenBuilder) {
      console.log('RtcTokenBuilder methods:', Object.keys(RtcTokenBuilder));
    }
    
    if (RtmTokenBuilder) {
      console.log('RtmTokenBuilder methods:', Object.keys(RtmTokenBuilder));
    }
  } catch (error) {
    console.error('Failed to import agora-access-token:', error);
  }
})();

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
    // Check if RtcTokenBuilder is available
    if (!RtcTokenBuilder) {
      console.error('RtcTokenBuilder is not available');
      throw new Error('RtcTokenBuilder is not available');
    }

    // Check if buildTokenWithUid method exists
    if (typeof RtcTokenBuilder.buildTokenWithUid !== 'function') {
      console.error('RtcTokenBuilder.buildTokenWithUid is not a function');
      console.error('RtcTokenBuilder contents:', RtcTokenBuilder);
      throw new Error('RtcTokenBuilder.buildTokenWithUid is not a function');
    }

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

    // Try to build the RTC token
    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
  } catch (error) {
    console.error('Error generating Agora RTC token:', error);
    
    // If we're in development mode, return a placeholder token for testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using placeholder RTC token for development');
      // This is just a placeholder token pattern that resembles a real token
      // It will not work with Agora servers but lets testing continue
      return `00${appId}${channelName.replace(/[^a-zA-Z0-9]/g, '')}IAD${uid}${Math.floor(Date.now() / 1000)}${role}`;
    }
    
    throw error;
  }
}

// Helper to build an RTM token (for chat messaging)
function generateRtmToken(userId: string, expirationTimeInSeconds: number = 3600) {
  if (!areAgoraCredentialsAvailable()) {
    throw new Error('Missing Agora credentials');
  }

  try {
    // Check if RtmTokenBuilder is available
    if (!RtmTokenBuilder) {
      console.error('RtmTokenBuilder is not available');
      throw new Error('RtmTokenBuilder is not available');
    }

    // Check if buildToken method exists
    if (typeof RtmTokenBuilder.buildToken !== 'function') {
      console.error('RtmTokenBuilder.buildToken is not a function');
      console.error('RtmTokenBuilder contents:', RtmTokenBuilder);
      throw new Error('RtmTokenBuilder.buildToken is not a function');
    }

    // Calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expirationTimeInSeconds;

    console.log('Generating RTM token with params:', {
      appId: appId ? `${appId.substring(0, 8)}...` : 'undefined',
      userId,
      RTM_ROLE,
      privilegeExpireTime
    });

    // Fall back to hard-coded token for development if token generation fails
    try {
      // Build the RTM token using the extracted RtmTokenBuilder
      return RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        userId,
        RTM_ROLE,
        privilegeExpireTime
      );
    } catch (tokenError) {
      console.error('Failed to generate RTM token with RtmTokenBuilder:', tokenError);
      
      // Since we cannot use direct imports in ESM, use a workaround
      const { RtmTokenBuilder: RtmTokenBuilderDirect } = require('./rtmTokenFallback');
      if (RtmTokenBuilderDirect && typeof RtmTokenBuilderDirect.buildToken === 'function') {
        console.log('Trying fallback RTM token generator');
        return RtmTokenBuilderDirect.buildToken(
          appId,
          appCertificate,
          userId,
          RTM_ROLE,
          privilegeExpireTime
        );
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error('Error generating Agora RTM token:', error);
    
    // Final fallback for development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using placeholder RTM token for development');
      // This is just a placeholder token pattern that resembles a real token
      // It will not work with Agora servers but lets testing continue
      return `00${appId}RTM${userId.replace(/[^a-zA-Z0-9]/g, '')}IAD${Math.floor(Date.now() / 1000)}${RTM_ROLE}`;
    }
    
    throw error;
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