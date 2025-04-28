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
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || 0;

    // Generate a token with audience privileges
    const token = generateAgoraToken(channelName, uidNumber, SUBSCRIBER_ROLE);

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

// Create a livestream
export async function createLivestream(req: Request, res: Response) {
  try {
    const { title, userName, uid } = req.body;

    if (!title || !userName) {
      return res.status(400).json({ error: 'Title and userName are required' });
    }

    // Generate a channel name (using title and some random string for uniqueness)
    const channelName = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    // Generate a token with host privileges
    const token = generateAgoraToken(channelName, uidNumber, PUBLISHER_ROLE);

    // In a real implementation, you would save the livestream details to a database
    // For now, we just return the channel details
    res.json({
      success: true,
      livestream: {
        id: channelName,
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