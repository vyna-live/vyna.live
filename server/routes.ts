import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse as getOpenAIResponse } from "./openai";
import { getAIResponse as getGeminiResponse } from "./gemini";
import multer from "multer";
import { db } from "./db";
import { saveUploadedFile, getFileById, processUploadedFile, deleteFile } from "./fileUpload";
import { siteConfig, researchSessions, messages, uploadedFiles, users, streamSessions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { log } from "./vite";
import { getStreamToken, createLivestream, getStreamApiKey } from "./getstream";
import { getAgoraAppId, getHostToken, getAudienceToken, createLivestream as createAgoraLivestream } from "./agora";
import * as agoraAccessToken from 'agora-access-token';
import { setupAuth } from "./auth";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Logo directory
const LOGO_DIR = path.join(process.cwd(), 'uploads', 'logo');
// Ensure logo directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Chat endpoint to get AI responses
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Use Gemini by default, with OpenAI as fallback
      let aiResponse;
      
      // Check if we have a Gemini API key
      if (process.env.GEMINI_API_KEY) {
        try {
          console.log("Using Gemini for AI response");
          aiResponse = await getGeminiResponse(message);
        } catch (error) {
          console.error("Error using Gemini API:", error);
          // If Gemini fails, try OpenAI as fallback if we have a key
          if (process.env.OPENAI_API_KEY) {
            console.log("Gemini failed, falling back to OpenAI");
            aiResponse = await getOpenAIResponse(message);
          } else {
            throw error; // No OpenAI fallback, propagate the error
          }
        }
      } 
      // If no Gemini key, try OpenAI
      else if (process.env.OPENAI_API_KEY) {
        console.log("No Gemini API key, using OpenAI");
        aiResponse = await getOpenAIResponse(message);
      } 
      // No API keys available
      else {
        return res.status(200).json({
          text: "No AI service API keys are configured. Please provide either a Gemini or OpenAI API key.",
          hasInfoGraphic: false,
          error: "NO_API_KEYS"
        });
      }
      
      // If there's an error but we're still returning a response
      if (aiResponse.error) {
        console.log("Returning error message to client:", aiResponse.error);
        return res.status(200).json(aiResponse);
      }
      
      // Save to database if sessionId provided
      if (sessionId) {
        try {
          const userId = 1; // Default for now, replace with actual auth logic later
          
          // Save user message
          await db.insert(messages).values({
            userId,
            sessionId,
            content: message,
            role: "user",
            timestamp: new Date()
          });
          
          // Save AI response
          await db.insert(messages).values({
            userId,
            sessionId,
            content: aiResponse.text,
            role: "assistant",
            hasInfoGraphic: aiResponse.hasInfoGraphic,
            infoGraphicData: aiResponse.hasInfoGraphic ? aiResponse.infoGraphicData : undefined,
            timestamp: new Date()
          });
          
          // Update session last update time
          await db.update(researchSessions)
            .set({ updatedAt: new Date() })
            .where(eq(researchSessions.id, sessionId));
        } catch (dbError) {
          console.error("Error saving messages to database:", dbError);
          // Continue sending the response even if DB save fails
        }
      }
      
      return res.status(200).json(aiResponse);
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      return res.status(500).json({ 
        text: "Sorry, there was an unexpected error processing your request.",
        hasInfoGraphic: false,
        error: "INTERNAL_SERVER_ERROR"
      });
    }
  });

  // Get prompt suggestions
  app.get("/api/prompts", async (_req, res) => {
    try {
      // You could fetch these from a database in a real implementation
      const prompts = [
        {
          id: 1,
          text: "Create a teleprompter script for my gaming livestream",
          icon: "monitor-smartphone",
          category: "streaming"
        },
        {
          id: 2,
          text: "Generate talking points for my tech review stream",
          icon: "list-checks",
          category: "streaming"
        },
        {
          id: 3,
          text: "Write an engaging introduction for my livestream",
          icon: "mic",
          category: "streaming"
        },
        {
          id: 4,
          text: "Research the latest gaming news for my stream",
          icon: "search",
          category: "research"
        },
      ];
      
      return res.status(200).json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Research session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const { title, preview, category, icon } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      const userId = 1; // Default for now, replace with actual auth logic later
      
      const [session] = await db.insert(researchSessions).values({
        userId,
        title,
        preview: preview || title.slice(0, 50),
        category: category || "research",
        icon: icon || "search",
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.json(session);
    } catch (error) {
      log(`Error creating session: ${error}`, "error");
      res.status(500).json({ error: "Failed to create research session" });
    }
  });
  
  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = 1; // Default for now, replace with actual auth logic later
      
      const sessions = await db.select()
        .from(researchSessions)
        .where(eq(researchSessions.userId, userId))
        .orderBy(desc(researchSessions.updatedAt));
      
      res.json(sessions);
    } catch (error) {
      log(`Error getting sessions: ${error}`, "error");
      res.status(500).json({ error: "Failed to get research sessions" });
    }
  });
  
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = 1; // Default for now, replace with actual auth logic later
      
      const [session] = await db.select()
        .from(researchSessions)
        .where(eq(researchSessions.id, sessionId));
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Get messages for this session
      const sessionMessages = await db.select()
        .from(messages)
        .where(eq(messages.sessionId, sessionId))
        .orderBy(messages.timestamp);
      
      res.json({
        ...session,
        messages: sessionMessages
      });
    } catch (error) {
      log(`Error getting session: ${error}`, "error");
      res.status(500).json({ error: "Failed to get research session" });
    }
  });
  
  // File upload routes
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // First check if default user exists, if not create one
      let userId = 1;
      try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
          const [newUser] = await db.insert(users).values({
            username: 'default',
            password: 'default_password',
            displayName: 'Default User'
          }).returning();
          userId = newUser.id;
          log(`Created default user with ID: ${userId}`);
        }
      } catch (err) {
        log(`Error checking default user: ${err}`, "error");
        // Continue with userId = 1 as fallback
      }
      
      const sessionId = req.body.sessionId ? parseInt(req.body.sessionId) : null;
      
      const savedFile = await saveUploadedFile(req.file, userId, sessionId);
      
      // Note: We no longer process the file automatically in the background
      // The client will need to explicitly request processing
      
      res.json({
        success: true,
        file: {
          id: savedFile.id,
          originalName: savedFile.originalName,
          fileType: savedFile.fileType,
          fileSize: savedFile.fileSize
        }
      });
    } catch (error) {
      log(`Error uploading file: ${error}`, "error");
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  
  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      try {
        const file = await getFileById(fileId);
        
        // Set appropriate headers based on file type
        res.setHeader("Content-Type", file.fileType);
        res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
        
        // Send the file
        res.send(file.buffer);
      } catch (err) {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      log(`Error getting file: ${error}`, "error");
      res.status(500).json({ error: "Failed to get file" });
    }
  });
  
  // Endpoint to process a file after user confirmation
  app.post("/api/files/:id/process", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      try {
        // Process the file and get analysis
        const processingResult = await processUploadedFile(fileId);
        
        res.json({
          success: true,
          result: processingResult
        });
      } catch (err) {
        log(`Error processing file: ${err}`, "error");
        res.status(404).json({ error: "File not found or processing failed" });
      }
    } catch (error) {
      log(`Error in file processing endpoint: ${error}`, "error");
      res.status(500).json({ error: "Failed to process file" });
    }
  });
  
  // Logo upload and management
  app.post("/api/logo", upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No logo file uploaded" });
      }
      
      // Only accept image files
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed" });
      }
      
      // Save to logo directory
      const fileExt = path.extname(req.file.originalname);
      const fileName = `logo${fileExt}`;
      const logoPath = path.join(LOGO_DIR, fileName);
      
      // Write file
      fs.writeFileSync(logoPath, req.file.buffer);
      
      // Update in database
      const logoUrl = `/api/logo/image`;
      
      // Check if config exists
      const [existingConfig] = await db.select().from(siteConfig);
      
      if (existingConfig) {
        await db.update(siteConfig)
          .set({ logoUrl, lastUpdated: new Date() })
          .where(eq(siteConfig.id, existingConfig.id));
      } else {
        await db.insert(siteConfig).values({
          logoUrl,
          siteName: "vyna.live",
          lastUpdated: new Date()
        });
      }
      
      res.json({ success: true, logoUrl });
    } catch (error) {
      log(`Error uploading logo: ${error}`, "error");
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });
  
  app.get("/api/logo", async (req, res) => {
    try {
      // Get logo URL from database
      const [config] = await db.select().from(siteConfig);
      
      if (config && config.logoUrl) {
        res.json({ logoUrl: config.logoUrl });
      } else {
        res.json({ logoUrl: null });
      }
    } catch (error) {
      log(`Error getting logo URL: ${error}`, "error");
      res.status(500).json({ error: "Failed to get logo URL" });
    }
  });
  
  app.get("/api/logo/image", (req, res) => {
    try {
      // Find the logo file in the logo directory
      if (fs.existsSync(LOGO_DIR)) {
        const files = fs.readdirSync(LOGO_DIR);
        const logoFile = files.find(file => file.startsWith("logo"));
        
        if (logoFile) {
          const logoPath = path.join(LOGO_DIR, logoFile);
          const fileBuffer = fs.readFileSync(logoPath);
          const mimeType = path.extname(logoFile) === ".png" ? "image/png" : "image/jpeg";
          
          res.setHeader("Content-Type", mimeType);
          res.send(fileBuffer);
          return;
        }
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
  
  // Get GetStream API key for frontend
  app.get("/api/stream/key", getStreamApiKey);
  
  // Agora API endpoints for livestreaming
  app.get("/api/agora/app-id", getAgoraAppId);
  
  app.post("/api/agora/host-token", getHostToken);
  
  app.post("/api/agora/audience-token", getAudienceToken);
  
  app.post("/api/agora/livestream", createAgoraLivestream);
  
  // Get Agora credentials for a specific stream
  app.get("/api/stream/:streamId/join-credentials", async (req, res) => {
    try {
      const { streamId } = req.params;
      
      if (!streamId) {
        return res.status(400).json({ error: 'Stream ID is required' });
      }
      
      // Get stream info from database
      const parsedId = parseInt(streamId, 10);
      let streamData;
      
      if (!isNaN(parsedId)) {
        // Find by ID
        const sql = `
          SELECT ss.*, u.username as host_name
          FROM stream_sessions ss
          JOIN users u ON ss.host_id = u.id
          WHERE ss.id = $1 AND ss.is_active = true
          LIMIT 1
        `;
        
        const result = await db.execute(sql, [parsedId]);
        
        if (result.rows.length > 0) {
          streamData = {
            id: result.rows[0].id,
            channelName: result.rows[0].channel_name,
            isActive: result.rows[0].is_active
          };
        }
      } else {
        // Try to find by channel name
        const sql = `
          SELECT ss.*, u.username as host_name
          FROM stream_sessions ss
          JOIN users u ON ss.host_id = u.id
          WHERE ss.channel_name = $1 AND ss.is_active = true
          LIMIT 1
        `;
        
        const result = await db.execute(sql, [streamId]);
        
        if (result.rows.length > 0) {
          streamData = {
            id: result.rows[0].id,
            channelName: result.rows[0].channel_name,
            isActive: result.rows[0].is_active
          };
        }
      }
      
      if (!streamData) {
        return res.status(404).json({ error: 'Active stream not found' });
      }
      
      if (!streamData.isActive) {
        return res.status(400).json({ error: 'Stream is not currently active' });
      }
      
      // Get Agora app ID
      const appId = process.env.AGORA_APP_ID;
      
      if (!appId) {
        return res.status(500).json({ error: 'Agora app ID not configured' });
      }
      
      // Generate a random UID for this viewer
      const uid = Math.floor(Math.random() * 1000000);
      
      // Generate a token with audience privileges
      const { RtcTokenBuilder } = agoraAccessToken;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
      
      // Calculate privilege expire time (4 hours)
      const currentTime = Math.floor(Date.now() / 1000);
      const privilegeExpireTime = currentTime + 14400;
      
      // Ensure channelName is a string
      const channelName = String(streamData.channelName || '');
      
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        2,  // 2 = SUBSCRIBER_ROLE
        privilegeExpireTime
      );
      
      return res.json({
        token,
        uid,
        appId,
        channelName: streamData.channelName
      });
    } catch (error) {
      console.error('Error generating join credentials:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate credentials',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  // Stream by ID endpoint to get stream info
  app.get("/api/stream/:streamId/info", async (req, res) => {
    try {
      const { streamId } = req.params;
      
      if (!streamId) {
        return res.status(400).json({ error: 'Stream ID is required' });
      }

      const parsedId = parseInt(streamId, 10);
      let streamSession;

      if (isNaN(parsedId)) {
        // Try to find by channel name using Drizzle ORM
        const result = await db
          .select({
            id: streamSessions.id,
            streamTitle: streamSessions.streamTitle,
            channelName: streamSessions.channelName,
            hostName: users.username,
            hostId: streamSessions.hostId,
            isActive: streamSessions.isActive,
            startedAt: streamSessions.startedAt,
            description: streamSessions.description,
            coverImagePath: streamSessions.coverImagePath
          })
          .from(streamSessions)
          .innerJoin(users, eq(streamSessions.hostId, users.id))
          .where(eq(streamSessions.channelName, streamId))
          .limit(1);
        
        if (result.length > 0) {
          streamSession = result[0];
        }
      } else {
        // Find by ID using Drizzle ORM
        const result = await db
          .select({
            id: streamSessions.id,
            streamTitle: streamSessions.streamTitle,
            channelName: streamSessions.channelName,
            hostName: users.username,
            hostId: streamSessions.hostId,
            isActive: streamSessions.isActive,
            startedAt: streamSessions.startedAt,
            description: streamSessions.description,
            coverImagePath: streamSessions.coverImagePath
          })
          .from(streamSessions)
          .innerJoin(users, eq(streamSessions.hostId, users.id))
          .where(eq(streamSessions.id, parsedId))
          .limit(1);
        
        if (result.length > 0) {
          streamSession = result[0];
        }
      }
      
      // Return the stream session if found
      if (streamSession) {
        return res.status(200).json(streamSession);
      }
      
      // Fallback: Check in livestreams table
      const livestreamSql = `
        SELECT l.*, u.username as host_username
        FROM livestreams l
        JOIN users u ON l.user_id = u.id
        WHERE l.id = $1
        LIMIT 1
      `;
      
      const livestreamResult = await db.execute(livestreamSql, [parsedId]);
      
      if (livestreamResult.rows.length > 0) {
        const livestream = livestreamResult.rows[0];
        return res.status(200).json({
          id: livestream.id,
          streamTitle: livestream.title,
          channelName: livestream.channel_name,
          hostName: livestream.host_username || 'Unknown',
          hostId: livestream.user_id,
          isActive: livestream.status === 'live',
          startedAt: livestream.started_at,
          description: livestream.description,
          coverImagePath: livestream.cover_image_url
        });
      }

      // If we get here, the stream was not found
      return res.status(404).json({ error: 'Stream not found' });
    } catch (error) {
      console.error('Error getting stream info:', error);
      return res.status(500).json({ error: 'Failed to get stream info' });
    }
  });

  // Update stream status endpoint (for webhook integration with Agora)
  app.post("/api/stream/:streamId/status", async (req, res) => {
    try {
      const { streamId } = req.params;
      const { isActive, viewerCount } = req.body;
      
      if (!streamId) {
        return res.status(400).json({ error: 'Stream ID is required' });
      }

      // Update stream session status using raw SQL
      const sql = `
        UPDATE stream_sessions
        SET is_active = $1, viewer_count = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, is_active
      `;
      
      const result = await db.execute(sql, [
        isActive || false,
        viewerCount || 0,
        parseInt(streamId, 10)
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      const updatedStream = result.rows[0];
      return res.status(200).json({
        id: updatedStream.id,
        isActive: updatedStream.is_active
      });
    } catch (error) {
      console.error('Error updating stream status:', error);
      return res.status(500).json({ error: 'Failed to update stream status' });
    }
  });

  // Add endpoints to update viewer counts
  app.post("/api/streams/:channelName/join", (req, res) => {
    try {
      const { channelName } = req.params;
      
      if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
      }
      
      // Get current viewer data or initialize new
      let viewerData = streamViewers.get(channelName);
      
      if (!viewerData) {
        viewerData = {
          count: 1, // Start with 1 viewer (the streamer)
          title: channelName.includes('demo') 
            ? "Jaja Games Fighting Championship" 
            : channelName.startsWith("saved") 
              ? "Recorded Stream" 
              : `${channelName} Live Stream`,
          lastUpdated: Date.now()
        };
      } else {
        // Increment viewers
        viewerData.count += 1;
        viewerData.lastUpdated = Date.now();
      }
      
      streamViewers.set(channelName, viewerData);
      
      return res.status(200).json({ 
        success: true, 
        viewerCount: viewerData.count 
      });
    } catch (error) {
      console.error("Error joining stream:", error);
      return res.status(500).json({ error: "Failed to join stream" });
    }
  });
  
  app.post("/api/streams/:channelName/leave", (req, res) => {
    try {
      const { channelName } = req.params;
      
      if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
      }
      
      // Get current viewer data
      const viewerData = streamViewers.get(channelName);
      
      if (viewerData) {
        // Decrement viewers but never below 1 (the host)
        viewerData.count = Math.max(1, viewerData.count - 1);
        viewerData.lastUpdated = Date.now();
        streamViewers.set(channelName, viewerData);
      }
      
      return res.status(200).json({ 
        success: true, 
        viewerCount: viewerData ? viewerData.count : 0 
      });
    } catch (error) {
      console.error("Error leaving stream:", error);
      return res.status(500).json({ error: "Failed to leave stream" });
    }
  });
  
  // Initialize global maps for stream data (in a real app these would be in a database)
  global.streamViewers = global.streamViewers || new Map<string, {
    count: number,
    title: string,
    streamId?: string, // Unique identifier for the stream
    hostName?: string, // Host name
    hostAvatar?: string, // Host avatar URL
    isActive?: boolean, // Whether stream is currently active
    lastUpdated: number
  }>();
  
  global.streamIdToChannel = global.streamIdToChannel || new Map<string, string>();
  
  // Use references to the global maps
  const streamViewers = global.streamViewers;
  const streamIdToChannel = global.streamIdToChannel;

  // Get stream details by channel name
  app.get("/api/streams/:channelName", async (req, res) => {
    try {
      const { channelName } = req.params;
      
      if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
      }
      
      console.log(`Getting stream details for channel: ${channelName}`);
      
      // Check if we have existing viewer data for this channel
      if (!streamViewers.has(channelName)) {
        console.log(`No existing data for channel ${channelName}, initializing with defaults`);
        // Initialize with starting data
        streamViewers.set(channelName, {
          count: 1, // Start with 1 viewer (the streamer)
          title: channelName.includes('demo') 
            ? "Jaja Games Fighting Championship" 
            : channelName.startsWith("saved") 
              ? "Recorded Stream" 
              : `Live Stream`,
          hostName: "Divine Samuel",
          isActive: true,
          lastUpdated: Date.now()
        });
      } else {
        // Update the last activity time
        const viewerData = streamViewers.get(channelName)!;
        viewerData.lastUpdated = Date.now();
        streamViewers.set(channelName, viewerData);
        console.log(`Updated activity time for channel ${channelName}`);
      }
      
      const viewerData = streamViewers.get(channelName)!;
      console.log(`Stream viewer data for ${channelName}:`, viewerData);
      
      // In a production app, you would fetch this from the database
      const streamData = {
        channelName,
        title: viewerData.title || "Live Stream",
        hostName: viewerData.hostName || "Divine Samuel",
        hostAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        viewerCount: viewerData.count,
        status: "live",
        description: "This is a sample stream description."
      };
      
      return res.status(200).json(streamData);
    } catch (error) {
      console.error("Error getting stream details:", error);
      return res.status(500).json({ error: "Failed to get stream details" });
    }
  });

  // Wallet connection endpoints
  app.post("/api/users/wallet", async (req, res) => {
    try {
      const { walletAddress, walletProvider = 'phantom' } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }
      
      const userId = 1; // Default for now, replace with actual auth logic later
      
      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update user's wallet information
      await db.update(users)
        .set({
          walletAddress,
          walletProvider,
          walletConnectedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true, message: "Wallet connected successfully" });
    } catch (error) {
      log(`Error connecting wallet: ${error}`, "error");
      res.status(500).json({ error: "Failed to connect wallet" });
    }
  });
  
  app.delete("/api/users/wallet", async (req, res) => {
    try {
      const userId = 1; // Default for now, replace with actual auth logic later
      
      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove user's wallet information
      await db.update(users)
        .set({
          walletAddress: null,
          walletProvider: null,
          walletConnectedAt: null
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true, message: "Wallet disconnected successfully" });
    } catch (error) {
      log(`Error disconnecting wallet: ${error}`, "error");
      res.status(500).json({ error: "Failed to disconnect wallet" });
    }
  });

  // Stream ID validation endpoint
  app.get("/api/livestreams/:streamId/validate", async (req, res) => {
    try {
      const { streamId } = req.params;
      
      if (!streamId) {
        return res.status(400).json({ error: "Stream ID is required" });
      }
      
      console.log(`Validating stream ID: ${streamId}`);
      // Log current mappings in a more compatible way
      const mappings: string[] = [];
      streamIdToChannel.forEach((channel, id) => {
        mappings.push(`${id} -> ${channel}`);
      });
      console.log(`Current stream mappings:`, mappings);
      
      // First, try looking up the stream ID directly
      let channelName = streamIdToChannel.get(streamId);
      
      // If not found, check if it's a channel name with stream_ prefix
      if (!channelName && streamId.startsWith('stream_')) {
        console.log(`Stream ID appears to be a channel name with stream_ prefix`);
        
        // The streamId is already a channel name, so check if we have viewer data for it
        if (streamViewers.has(streamId)) {
          channelName = streamId;
          // For consistency, also add it to the id->channel mapping 
          const actualId = streamId.replace(/^stream_/, '');
          streamIdToChannel.set(actualId, streamId);
          console.log(`Added reverse mapping ${actualId} -> ${streamId}`);
        }
      }
      
      if (!channelName) {
        console.log(`Stream ID ${streamId} not found in mapping`);
        
        // Check for our standard format
        if (/^[a-zA-Z0-9_-]{6,}$/.test(streamId)) {
          // This is a valid format for a stream ID
          // Store it with a generated channel name
          const newChannelName = `stream_${streamId}`;
          console.log(`Creating new mapping ${streamId} -> ${newChannelName}`);
          
          streamIdToChannel.set(streamId, newChannelName);
          
          // Initialize the viewer data
          if (!streamViewers.has(newChannelName)) {
            console.log(`Initializing viewer data for ${newChannelName}`);
            streamViewers.set(newChannelName, {
              count: 1, // Start with 1 viewer (the streamer)
              title: `Live Stream ${streamId}`,
              streamId: streamId,
              hostName: "Host", // Default name
              isActive: true,
              lastUpdated: Date.now()
            });
          }
          
          return res.status(200).json({ 
            isActive: true,
            channelName: newChannelName
          });
        }
        
        // If not found and not a valid format
        console.log(`Stream ID ${streamId} is not in a valid format`);
        return res.status(404).json({ 
          error: "Stream not found",
          isActive: false
        });
      }
      
      // Check if the stream is active
      const viewerData = streamViewers.get(channelName);
      const isActive = viewerData ? true : false;
      
      console.log(`Stream ID ${streamId} is mapped to channel ${channelName}, active: ${isActive}`);
      if (viewerData) {
        console.log(`Stream data:`, {
          title: viewerData.title,
          hostName: viewerData.hostName,
          count: viewerData.count
        });
      }
      
      return res.status(200).json({ 
        isActive,
        channelName,
        ...viewerData
      });
    } catch (error) {
      console.error("Error validating stream ID:", error);
      return res.status(500).json({ error: "Failed to validate stream" });
    }
  });
  
  // Stream data by ID endpoint
  app.get("/api/livestreams/:streamId", async (req, res) => {
    try {
      const { streamId } = req.params;
      
      if (!streamId) {
        return res.status(400).json({ error: "Stream ID is required" });
      }
      
      // Check if we have this streamId in our mapping
      const channelName = streamIdToChannel.get(streamId);
      
      if (!channelName) {
        return res.status(404).json({ error: "Stream not found" });
      }
      
      // Get the viewer data
      const viewerData = streamViewers.get(channelName);
      
      if (!viewerData) {
        return res.status(404).json({ error: "Stream data not found" });
      }
      
      return res.status(200).json({
        streamId,
        channelName,
        title: viewerData.title,
        hostName: viewerData.hostName || "Host",
        hostAvatar: viewerData.hostAvatar,
        viewerCount: viewerData.count,
        isActive: true,
        timestamp: viewerData.lastUpdated
      });
    } catch (error) {
      console.error("Error getting stream data:", error);
      return res.status(500).json({ error: "Failed to get stream data" });
    }
  });

  // End of stream-related API routes

  const httpServer = createServer(app);

  return httpServer;
}
