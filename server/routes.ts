import { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import * as streamingService from './streamingService';
import multer from 'multer';
import { getAIResponse } from './gemini';
import { generateStreamToken, getStreamApiKey, getStreamToken, createLivestream } from './getstream';
import { getFileById, processUploadedFile, saveUploadedFile, deleteFile } from './fileUpload';
import { log } from './vite';

// Constants
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB
const LOGO_DIR = path.join(process.cwd(), 'public', 'logos');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: FILE_SIZE_LIMIT }
});

// Declare global types for our streaming tracking system
declare global {
  var activeStreams: Map<string, {
    channelName: string;
    title: string;
    hostName: string;
    hostAvatar?: string;
    viewerCount: number; 
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for active stream tracking
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = req.headers['sec-websocket-key'] || Math.random().toString(36).substring(2, 15);
    global.connectedClients.set(clientId, ws);
    
    log(`WebSocket client connected: ${clientId}, total clients: ${global.connectedClients.size}`);
    
    // Set up the streaming heartbeat handler for this connection
    streamingService.setupStreamHeartbeat(ws, clientId);
    
    // Send current active streams to the new client
    const activeStreamsData = Array.from(global.activeStreams.entries()).map(([id, data]) => ({
      streamId: id,
      status: data.status,
      title: data.title,
      viewers: data.viewerCount || 0,
      hostName: data.hostName
    }));
    
    ws.send(JSON.stringify({
      type: 'initialStreamData',
      streams: activeStreamsData
    }));
    
    ws.on('close', () => {
      global.connectedClients.delete(clientId);
      log(`WebSocket client disconnected: ${clientId}, remaining clients: ${global.connectedClients.size}`);
    });
  });
  
  // Start stream monitoring background task
  streamingService.startStreamMonitoring();

  // Chat endpoint to get AI responses
  app.post("/api/chat", async (req, res) => {
    try {
      const message = req.body.message;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const response = await getAIResponse(message);
      res.json(response);
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
  
  // Upload file endpoint
  app.post("/api/files/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const savedFile = await saveUploadedFile(req.file);
      
      // Process the file in the background
      processUploadedFile(savedFile.id).catch(err => {
        console.error(`Error processing file ${savedFile.id}:`, err);
      });
      
      res.json(savedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  
  // Get file endpoint
  app.get("/api/files/:fileId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ error: "Invalid file ID" });
      }
      
      const file = await getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      console.error("Error getting file:", error);
      res.status(500).json({ error: "Failed to get file" });
    }
  });
  
  // Delete file endpoint
  app.delete("/api/files/:fileId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ error: "Invalid file ID" });
      }
      
      await deleteFile(fileId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });
  
  // Serve logos
  app.get("/api/logos/:logoName", (req, res) => {
    try {
      const logoName = req.params.logoName;
      const logoFile = `${logoName}.png`;
      
      if (!logoName) {
        return res.status(400).json({ error: "Logo name is required" });
      }
      
      if (fs.existsSync(path.join(LOGO_DIR, logoFile))) {
        const logoPath = path.join(LOGO_DIR, logoFile);
        const fileBuffer = fs.readFileSync(logoPath);
        const mimeType = path.extname(logoFile) === ".png" ? "image/png" : "image/jpeg";
        
        res.setHeader("Content-Type", mimeType);
        res.send(fileBuffer);
        return;
      }
      
      res.status(404).json({ error: "Logo not found" });
    } catch (error) {
      log(`Error serving logo: ${error}`, "error");
      res.status(500).json({ error: "Failed to serve logo" });
    }
  });
  
  // GetStream API endpoints for livestreaming
  app.post("/api/stream/token", getStreamToken);
  app.post("/api/stream/livestream", createLivestream);
  app.get("/api/stream/key", getStreamApiKey);
  
  // Agora API endpoints for livestreaming
  app.get("/api/agora/app-id", streamingService.getAgoraAppId);
  app.post("/api/agora/host-token", streamingService.getHostToken);
  app.post("/api/agora/audience-token", streamingService.getAudienceToken);
  app.post("/api/agora/livestream", streamingService.createLivestream);
  
  // New streaming API endpoints for real-time status
  app.get("/api/streams/active", streamingService.getActiveStreams);
  app.get("/api/streams/:streamId", streamingService.getStreamDetails);
  app.get("/api/streams/:streamId/validate", streamingService.validateStream);
  app.post("/api/streams/:streamId/join", streamingService.joinStream);
  app.post("/api/streams/:streamId/leave", streamingService.leaveStream);
  app.post("/api/streams/:streamId/end", streamingService.endStream);
  
  return httpServer;
}