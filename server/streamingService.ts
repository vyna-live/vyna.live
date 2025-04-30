import { Request, Response } from 'express';
import * as agoraAccessToken from 'agora-access-token';
import { WebSocket } from 'ws';
import { log } from './vite';

// Define roles from agora-access-token
const PUBLISHER_ROLE = 1; // RtcRole.PUBLISHER value 
const SUBSCRIBER_ROLE = 2; // RtcRole.SUBSCRIBER value

// Agora app credentials from environment variables
const appId = process.env.AGORA_APP_ID!;
const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

// Declare global types for our streaming tracking system
declare global {
  var activeStreams: Map<string, {
    channelName: string;
    title: string;
    hostName: string;
    hostAvatar?: string;
    viewerCount: number;
    viewers?: number; // For backward compatibility
    startTime: number;
    lastPing: number;
    status: 'active' | 'inactive';
  }>;
  var connectedClients: Map<string, WebSocket>;
  var streamIdToChannel: Map<string, string>;
  var streamViewers: Map<string, {
    count: number;
    title: string;
    streamId?: string;
    hostName?: string;
    hostAvatar?: string;
    isActive?: boolean;
    lastUpdated: number;
  }>;
}

// Initialize our global storage if it doesn't exist
if (!global.activeStreams) {
  global.activeStreams = new Map();
}

if (!global.connectedClients) {
  global.connectedClients = new Map();
}

if (!global.streamIdToChannel) {
  global.streamIdToChannel = new Map();
}

if (!global.streamViewers) {
  global.streamViewers = new Map();
}

// === Utility Functions ===

/**
 * Checks if Agora credentials are available
 */
function areAgoraCredentialsAvailable(): boolean {
  return Boolean(appId && appCertificate);
}

/**
 * Generates a valid token for Agora RTC
 */
function generateAgoraToken(
  channelName: string, 
  uid: number, 
  role: number,
  expirationTimeInSeconds: number = 14400 // 4 hours
): string {
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

/**
 * Creates a URL-friendly stream ID from a title
 */
function generateStreamId(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '') // Keep only alphanumeric
    .replace(/\s+/g, ''); // Remove spaces
  
  return cleanTitle + Date.now().toString();
}

/**
 * Broadcasts a stream status update to all connected clients
 */
function broadcastStreamStatus(streamId: string, status: 'active' | 'inactive'): void {
  const streamData = global.activeStreams.get(streamId);
  if (!streamData) return;
  
  const message = JSON.stringify({
    type: 'streamStatus',
    stream: {
      id: streamId,
      title: streamData.title,
      hostName: streamData.hostName,
      hostAvatar: streamData.hostAvatar,
      viewerCount: streamData.viewerCount,
      status: status
    }
  });
  
  global.connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  log(`Broadcasted ${status} status for stream ${streamId} to ${global.connectedClients.size} clients`);
}

// === API Endpoints ===

/**
 * Get the Agora App ID
 */
export function getAgoraAppId(req: Request, res: Response): void {
  if (!areAgoraCredentialsAvailable()) {
    res.status(500).json({ error: 'Missing Agora credentials' });
    return;
  }

  res.json({ appId });
}

/**
 * Generate a token for a host (broadcaster)
 */
export function getHostToken(req: Request, res: Response): void {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      res.status(400).json({ error: 'channelName is required' });
      return;
    }

    // Convert string uid to number if needed, or use 0 (Agora will assign a uid)
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || 0;
    
    log(`Generating host token for channel: ${channelName}, uid: ${uidNumber}`);

    // Generate a token with host privileges with longer expiration (4 hours)
    const token = generateAgoraToken(channelName, uidNumber, PUBLISHER_ROLE);
    
    // Log the token (partial) for debugging
    log(`Generated host token for channel ${channelName}: ${token.substring(0, 20)}...`);

    res.json({
      token,
      appId,
      channelName,
      uid: uidNumber,
      role: 'host',
      expiresInSeconds: 14400,
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate token';
    res.status(500).json({ 
      error: errorMessage, 
      details: error instanceof Error ? error.stack : undefined 
    });
  }
}

/**
 * Generate a token for an audience member
 */
export function getAudienceToken(req: Request, res: Response): void {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      res.status(400).json({ error: 'channelName is required' });
      return;
    }

    // Generate random uid if not provided
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || Math.floor(Math.random() * 1000000);

    log(`Generating audience token for channel: ${channelName}, uid: ${uidNumber}`);
    
    // Check if this is an active stream
    let isActive = false;
    global.activeStreams.forEach(stream => {
      if (stream.channelName === channelName) {
        isActive = stream.status === 'active';
      }
    });
    
    if (!isActive) {
      log(`Warning: Generating audience token for potentially inactive stream: ${channelName}`);
    }
    
    // Generate a token with audience privileges with 4-hour expiration
    const token = generateAgoraToken(channelName, uidNumber, SUBSCRIBER_ROLE);
    log(`Generated audience token for channel ${channelName}: ${token.substring(0, 20)}...`);

    res.json({
      token,
      appId,
      channelName,
      uid: uidNumber,
      role: 'audience',
      expiresInSeconds: 14400,
    });
  } catch (error) {
    console.error('Error generating audience token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate token';
    res.status(500).json({ 
      error: errorMessage, 
      details: error instanceof Error ? error.stack : undefined,
      channelName: req.body.channelName
    });
  }
}

/**
 * Create a new livestream
 */
export function createLivestream(req: Request, res: Response): void {
  try {
    const { title, userName, uid, avatar } = req.body;

    if (!title || !userName) {
      res.status(400).json({ error: 'Title and userName are required' });
      return;
    }

    // Generate a clean ID for the stream
    const streamId = generateStreamId(title);
    
    // Use the streamId directly as the channelName
    const channelName = streamId;
    
    // Convert string uid to number if needed, or use 0 (Agora will assign a uid)
    const uidNumber = typeof uid === 'string' ? parseInt(uid, 10) : uid || 0;

    // Generate a token with host privileges and 4 hour expiration time
    const token = generateAgoraToken(channelName, uidNumber, PUBLISHER_ROLE);

    log(`Creating livestream: ${title} with ID ${streamId}, channel: ${channelName}`);
    
    // Update global stream tracking
    global.activeStreams.set(streamId, {
      channelName,
      title,
      hostName: userName,
      hostAvatar: avatar,
      viewerCount: 1, // Start with 1 viewer (the host)
      startTime: Date.now(),
      lastPing: Date.now(),
      status: 'active'
    });
    
    // Store a mapping from stream ID to channel name
    global.streamIdToChannel.set(streamId, channelName);
    
    // Broadcast the new stream to all connected clients
    broadcastStreamStatus(streamId, 'active');

    // Return the livestream details
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

/**
 * Validate if a stream is active
 */
export function validateStream(req: Request, res: Response): void {
  try {
    const { streamId } = req.params;
    
    if (!streamId) {
      res.status(400).json({ error: 'Stream ID is required' });
      return;
    }
    
    log(`Validating stream ID: ${streamId}`);
    
    // Get the stream data directly
    const streamData = global.activeStreams.get(streamId);
    
    if (!streamData) {
      log(`Stream ID ${streamId} not found`);
      res.status(404).json({ 
        error: "Stream not found",
        isActive: false
      });
      return;
    }
    
    // Return the stream data
    res.json({
      isActive: streamData.status === 'active',
      channelName: streamData.channelName,
      title: streamData.title,
      hostName: streamData.hostName,
      viewerCount: streamData.viewerCount
    });
  } catch (error) {
    console.error("Error validating stream:", error);
    res.status(500).json({ error: "Failed to validate stream" });
  }
}

/**
 * Get details for a specific stream
 */
export function getStreamDetails(req: Request, res: Response): void {
  try {
    const { streamId } = req.params;
    
    if (!streamId) {
      res.status(400).json({ error: 'Stream ID is required' });
      return;
    }
    
    // Get the stream data
    const streamData = global.activeStreams.get(streamId);
    
    if (!streamData) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }
    
    // Update the timestamp to show it was recently accessed
    streamData.lastPing = Date.now();
    global.activeStreams.set(streamId, streamData);
    
    // Return the stream data
    res.json({
      streamId,
      channelName: streamData.channelName,
      title: streamData.title,
      hostName: streamData.hostName,
      hostAvatar: streamData.hostAvatar,
      viewerCount: streamData.viewerCount,
      isActive: streamData.status === 'active',
      timestamp: streamData.lastPing
    });
  } catch (error) {
    console.error("Error getting stream details:", error);
    res.status(500).json({ error: "Failed to get stream details" });
  }
}

/**
 * Join a stream as a viewer
 */
export function joinStream(req: Request, res: Response): void {
  try {
    const { streamId } = req.params;
    const { userName } = req.body;
    
    if (!streamId) {
      res.status(400).json({ error: 'Stream ID is required' });
      return;
    }
    
    // Get the stream data
    const streamData = global.activeStreams.get(streamId);
    
    if (!streamData) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }
    
    // Increment viewer count
    streamData.viewerCount += 1;
    streamData.lastPing = Date.now(); // Update activity time
    global.activeStreams.set(streamId, streamData);
    
    log(`Viewer ${userName || 'anonymous'} joined stream ${streamId}, total viewers: ${streamData.viewerCount}`);
    
    // Broadcast the updated viewer count
    broadcastStreamStatus(streamId, streamData.status);
    
    res.json({
      success: true,
      viewers: streamData.viewerCount,
      channelName: streamData.channelName
    });
  } catch (error) {
    console.error("Error joining stream:", error);
    res.status(500).json({ error: "Failed to join stream" });
  }
}

/**
 * Leave a stream as a viewer
 */
export function leaveStream(req: Request, res: Response): void {
  try {
    const { streamId } = req.params;
    
    if (!streamId) {
      res.status(400).json({ error: 'Stream ID is required' });
      return;
    }
    
    // Get the stream data
    const streamData = global.activeStreams.get(streamId);
    
    if (!streamData) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }
    
    // Decrement viewer count (minimum 1 for the host)
    streamData.viewerCount = Math.max(1, streamData.viewerCount - 1);
    global.activeStreams.set(streamId, streamData);
    
    log(`Viewer left stream ${streamId}, remaining viewers: ${streamData.viewerCount}`);
    
    // Broadcast the updated viewer count
    broadcastStreamStatus(streamId, streamData.status);
    
    res.json({
      success: true,
      viewers: streamData.viewerCount
    });
  } catch (error) {
    console.error("Error leaving stream:", error);
    res.status(500).json({ error: "Failed to leave stream" });
  }
}

/**
 * End a stream (host only)
 */
export function endStream(req: Request, res: Response): void {
  try {
    const { streamId } = req.params;
    
    if (!streamId) {
      res.status(400).json({ error: 'Stream ID is required' });
      return;
    }
    
    // Get the stream data
    const streamData = global.activeStreams.get(streamId);
    
    if (!streamData) {
      res.status(404).json({ error: "Stream not found" });
      return;
    }
    
    // Mark as inactive
    streamData.status = 'inactive';
    global.activeStreams.set(streamId, streamData);
    
    log(`Stream ${streamId} ended by host`);
    
    // Broadcast the stream end
    broadcastStreamStatus(streamId, 'inactive');
    
    res.json({
      success: true,
      message: "Stream ended successfully"
    });
  } catch (error) {
    console.error("Error ending stream:", error);
    res.status(500).json({ error: "Failed to end stream" });
  }
}

/**
 * Get a list of all active streams
 */
export function getActiveStreams(req: Request, res: Response): void {
  try {
    const activeStreamsList = Array.from(global.activeStreams.entries())
      .filter(([_, data]) => data.status === 'active')
      .map(([id, data]) => ({
        id,
        title: data.title,
        hostName: data.hostName,
        hostAvatar: data.hostAvatar,
        viewerCount: data.viewerCount,
        startedAt: data.startTime
      }));
    
    res.json(activeStreamsList);
  } catch (error) {
    console.error("Error fetching active streams:", error);
    res.status(500).json({ error: "Failed to get active streams" });
  }
}

/**
 * Setup websocket heartbeat handler
 */
export function setupStreamHeartbeat(ws: WebSocket, clientId: string): void {
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle heartbeat from streamers
      if (data.type === 'streamerHeartbeat' && data.streamId) {
        const streamData = global.activeStreams.get(data.streamId);
        if (streamData) {
          streamData.lastPing = Date.now();
          
          // If it was inactive, make it active again
          if (streamData.status === 'inactive') {
            streamData.status = 'active';
            broadcastStreamStatus(data.streamId, 'active');
          }
          
          global.activeStreams.set(data.streamId, streamData);
          
          // Acknowledge the heartbeat
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeatAck',
              streamId: data.streamId,
              timestamp: Date.now()
            }));
          }
        }
      }
    } catch (error) {
      log(`Error processing stream heartbeat: ${error}`, 'error');
    }
  });
}

/**
 * Start a background task to monitor stream activity
 */
export function startStreamMonitoring(): void {
  // Check every 10 seconds for inactive streams
  setInterval(() => {
    const now = Date.now();
    const inactivityThreshold = 30000; // 30 seconds without a ping
    
    global.activeStreams.forEach((data, streamId) => {
      if (now - data.lastPing > inactivityThreshold && data.status === 'active') {
        // Mark the stream as inactive
        data.status = 'inactive';
        global.activeStreams.set(streamId, data);
        
        // Broadcast the status change
        broadcastStreamStatus(streamId, 'inactive');
        
        log(`Stream ${streamId} marked inactive due to inactivity`);
      }
    });
  }, 10000);
}