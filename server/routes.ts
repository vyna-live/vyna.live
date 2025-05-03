import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse as getOpenAIResponse } from "./openai";
import { getAIResponse as getGeminiResponse } from "./gemini";
import { getAIResponse as getClaudeResponse } from "./anthropic";
import multer from "multer";
import { db } from "./db";
import { saveUploadedFile, getFileById, processUploadedFile, deleteFile } from "./fileUpload";
import { siteConfig, researchSessions, messages, uploadedFiles, users, streamSessions, livestreams, aiChats, aiChatSessions, aiChatMessages, notepads } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { log } from "./vite";
import { getStreamToken, createLivestream, getStreamApiKey } from "./getstream";
import { getAgoraAppId, getHostToken, getAudienceToken, createLivestream as createAgoraLivestream } from "./agora";
import * as agoraAccessToken from 'agora-access-token';
import { setupAuth } from "./auth";
import { debugAuth, debugRequest } from "./debug";

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
  // Add debug middleware for authentication routes
  app.use('/api/login', debugRequest);
  app.use('/api/register', debugRequest);
  app.use('/api/user', debugAuth);
  
  // Setup authentication
  setupAuth(app);
  
  // AI Chat endpoints
  // Get all chat sessions for a specific host
  app.get("/api/ai-chat-sessions/:hostId", async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: "Invalid host ID" });
      }
      
      // Get chat sessions for the specified host
      const sessions = await db.select()
        .from(aiChatSessions)
        .where(and(
          eq(aiChatSessions.hostId, hostId),
          eq(aiChatSessions.isDeleted, false)
        ))
        .orderBy(desc(aiChatSessions.updatedAt));
      
      return res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching AI chat sessions:", error);
      return res.status(500).json({ error: "Failed to fetch AI chat sessions" });
    }
  });
  
  // Get messages for a specific chat session
  app.get("/api/ai-chat-messages/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      
      // Get messages for the specified session
      const messages = await db.select()
        .from(aiChatMessages)
        .where(and(
          eq(aiChatMessages.sessionId, sessionId),
          eq(aiChatMessages.isDeleted, false)
        ))
        .orderBy(aiChatMessages.createdAt);
      
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching AI chat messages:", error);
      return res.status(500).json({ error: "Failed to fetch AI chat messages" });
    }
  });
  
  // For backward compatibility - Get individual AI chats for a specific host
  app.get("/api/ai-chats/:hostId", async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: "Invalid host ID" });
      }
      
      // Get AI chats for the specified host
      const chats = await db.select()
        .from(aiChats)
        .where(and(
          eq(aiChats.hostId, hostId),
          eq(aiChats.isDeleted, false)
        ))
        .orderBy(desc(aiChats.createdAt));
      
      return res.status(200).json(chats);
    } catch (error) {
      console.error("Error fetching AI chats:", error);
      return res.status(500).json({ error: "Failed to fetch AI chats" });
    }
  });
  
  // Create or continue AI chat session
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { hostId, message, sessionId, commentaryStyle } = req.body;
      
      if (!hostId || !message) {
        return res.status(400).json({ error: "Host ID and message are required" });
      }
      
      // Determine which session ID to use (from request or lookup most recent active session)
      let activeSessionId = sessionId;
      
      // Handle explicit requests for a new session
      // This includes when sessionId is 'new' or null from the frontend explicitly requesting a new chat
      const isExplicitNewChat = activeSessionId === 'new' || (activeSessionId === null && req.body.hasOwnProperty('sessionId'));
      
      if (isExplicitNewChat) {
        // Force activeSessionId to null to create a new session
        activeSessionId = null;
        console.log("Creating new chat session as explicitly requested");
      } 
      // If no sessionId provided (undefined), look up the most recent active session
      else if (!activeSessionId) {
        const [mostRecentSession] = await db.select()
          .from(aiChatSessions)
          .where(and(
            eq(aiChatSessions.hostId, hostId),
            eq(aiChatSessions.isDeleted, false)
          ))
          .orderBy(desc(aiChatSessions.updatedAt))
          .limit(1);
          
        // Use the existing session if one exists
        if (mostRecentSession) {
          activeSessionId = mostRecentSession.id;
          console.log(`Using existing session: ${activeSessionId}`);
        }
      }
      
      // Get conversation history for this session if it exists
      let conversationHistory: { role: 'user' | 'assistant', content: string }[] = [];
      
      if (activeSessionId) {
        const previousMessages = await db.select()
          .from(aiChatMessages)
          .where(and(
            eq(aiChatMessages.sessionId, activeSessionId),
            eq(aiChatMessages.isDeleted, false)
          ))
          .orderBy(aiChatMessages.createdAt);
          
        // Convert to the format expected by Claude API
        conversationHistory = previousMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
        
        console.log(`Retrieved ${conversationHistory.length} previous messages for session ${activeSessionId}`);
      }
      
      // Get AI response
      let aiResponse = "";
      let aiResponseObj = null;
      try {
        // Prioritize Claude, then Gemini, then OpenAI as fallback
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            console.log("Using Claude for AI response");
            // Use provided commentaryStyle or detect from message
            const detectedStyle = commentaryStyle || (
              message.toLowerCase().includes('play-by-play') || 
              message.toLowerCase().includes('play by play') ||
              message.toLowerCase().includes('step by step') ? 'play-by-play' : 'color'
            );
            
            console.log(`Using commentary style: ${detectedStyle}`);
            aiResponseObj = await getClaudeResponse(message, detectedStyle, conversationHistory);
            aiResponse = aiResponseObj.text || "Response unavailable";
          } catch (claudeError) {
            console.error("Error using Claude API:", claudeError);
            // Fall back to Gemini or OpenAI
            if (process.env.GEMINI_API_KEY) {
              const geminiResult = await getGeminiResponse(message);
              aiResponse = geminiResult.text || "Response unavailable";
            } else if (process.env.OPENAI_API_KEY) {
              const openaiResult = await getOpenAIResponse(message);
              aiResponse = openaiResult.text || "Response unavailable";
            } else {
              throw claudeError; // No fallback available
            }
          }
        } else if (process.env.GEMINI_API_KEY) {
          const geminiResult = await getGeminiResponse(message);
          aiResponse = geminiResult.text || "Response unavailable";
        } else if (process.env.OPENAI_API_KEY) {
          const openaiResult = await getOpenAIResponse(message);
          aiResponse = openaiResult.text || "Response unavailable";
        } else {
          aiResponse = "No AI service API keys are configured. Please provide an Anthropic Claude, Google Gemini, or OpenAI API key.";
        }
      } catch (aiError) {
        console.error("Error getting AI response:", aiError);
        aiResponse = "Sorry, I couldn't process your request at the moment. Please try again later.";
      }
      
      let isNewSession = false;
      
      // Create a new session if we don't have an active session ID
      // (this happens when either no sessionId was provided, or sessionId was 'new')
      if (!activeSessionId) {
        isNewSession = true;
        // Generate a title from the first message
        const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
        
        // Create a new chat session
        const [newSession] = await db.insert(aiChatSessions)
          .values({
            hostId,
            title,
            isDeleted: false,
          })
          .returning();
        
        activeSessionId = newSession.id;
      } else {
        // Update the session's updatedAt timestamp
        await db.update(aiChatSessions)
          .set({ updatedAt: new Date() })
          .where(eq(aiChatSessions.id, activeSessionId));
      }
      
      // Add user message to the session
      await db.insert(aiChatMessages)
        .values({
          sessionId: activeSessionId,
          role: 'user',
          content: message,
          isDeleted: false,
        });
      
      // Add AI response to the session
      const [aiMsg] = await db.insert(aiChatMessages)
        .values({
          sessionId: activeSessionId,
          role: 'assistant',
          content: aiResponse,
          isDeleted: false,
        })
        .returning();
        
      // For backward compatibility - also insert into the old aiChats table
      const [newChat] = await db.insert(aiChats)
        .values({
          hostId,
          message,
          response: aiResponse,
          isDeleted: false,
        })
        .returning();
      
      // Include any additional metadata from aiResponseObj if available
      const responseMetadata: { commentaryStyle?: 'play-by-play' | 'color' } = {};
      if (aiResponseObj && typeof aiResponseObj === 'object' && 'commentaryStyle' in aiResponseObj) {
        const style = aiResponseObj.commentaryStyle;
        if (style === 'play-by-play' || style === 'color') {
          responseMetadata.commentaryStyle = style;
        }
      }
      
      // Return both the new AI message and session info
      return res.status(201).json({
        ...newChat, // For backward compatibility
        sessionId: activeSessionId,
        isNewSession,
        aiMessage: aiMsg,
        ...responseMetadata
      });
    } catch (error) {
      console.error("Error creating AI chat:", error);
      return res.status(500).json({ error: "Failed to create AI chat" });
    }
  });
  
  // Notepad endpoints
  // Get notepads for a specific host
  app.get("/api/notepads/:hostId", async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: "Invalid host ID" });
      }
      
      // Get notepads for the specified host
      const notes = await db.select()
        .from(notepads)
        .where(and(
          eq(notepads.hostId, hostId),
          eq(notepads.isDeleted, false)
        ))
        .orderBy(desc(notepads.createdAt));
      
      return res.status(200).json(notes);
    } catch (error) {
      console.error("Error fetching notepads:", error);
      return res.status(500).json({ error: "Failed to fetch notepads" });
    }
  });
  
  // Create new notepad
  app.post("/api/notepads", async (req, res) => {
    try {
      const { hostId, title, content } = req.body;
      
      if (!hostId || !content) {
        return res.status(400).json({ error: "Host ID and content are required" });
      }
      
      // Set default title if not provided
      const noteTitle = title || content.substring(0, 50) + (content.length > 50 ? "..." : "");
      
      // Insert the new notepad into the database
      const [newNote] = await db.insert(notepads)
        .values({
          hostId,
          title: noteTitle,
          content,
          isDeleted: false,
        })
        .returning();
      
      return res.status(201).json(newNote);
    } catch (error) {
      console.error("Error creating notepad:", error);
      return res.status(500).json({ error: "Failed to create notepad" });
    }
  });
  
  // Chat endpoint to get AI responses
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Prioritize Claude, then Gemini, then OpenAI as fallback
      let aiResponse;
      
      // Check if we have a Claude API key
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          console.log("Using Claude for AI response");
          // Detect commentary style from the message
          const isPlayByPlay = message.toLowerCase().includes('play-by-play') || 
                              message.toLowerCase().includes('play by play') ||
                              message.toLowerCase().includes('step by step');
          
          const commentaryStyle = isPlayByPlay ? 'play-by-play' : 'color';
          console.log(`Using commentary style: ${commentaryStyle}`);
          
          // If we have a sessionId, retrieve message history for context
          let conversationHistory: { role: 'user' | 'assistant', content: string }[] = [];
          if (sessionId) {
            try {
              // Get previous messages from this session
              const previousMessages = await db.select()
                .from(messages)
                .where(eq(messages.sessionId, sessionId))
                .orderBy(messages.timestamp);
                
              // Convert to the format expected by Claude API
              conversationHistory = previousMessages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              }));
              
              console.log(`Retrieved ${conversationHistory.length} previous messages for session ${sessionId}`);
            } catch (historyError) {
              console.error("Error retrieving message history:", historyError);
              // Continue without history if there's an error
            }
          }
          
          aiResponse = await getClaudeResponse(message, commentaryStyle, conversationHistory);
        } catch (error) {
          console.error("Error using Claude API:", error);
          // If Claude fails, try Gemini as fallback
          if (process.env.GEMINI_API_KEY) {
            console.log("Claude failed, falling back to Gemini");
            aiResponse = await getGeminiResponse(message);
          } 
          // If no Gemini, try OpenAI
          else if (process.env.OPENAI_API_KEY) {
            console.log("Claude failed, no Gemini API key, falling back to OpenAI");
            aiResponse = await getOpenAIResponse(message);
          } else {
            throw error; // No fallback available, propagate the error
          }
        }
      }
      // If no Claude key, try Gemini
      else if (process.env.GEMINI_API_KEY) {
        try {
          console.log("No Claude API key, using Gemini");
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
      // If no Claude or Gemini key, try OpenAI
      else if (process.env.OPENAI_API_KEY) {
        console.log("No Claude or Gemini API key, using OpenAI");
        aiResponse = await getOpenAIResponse(message);
      } 
      // No API keys available
      else {
        return res.status(200).json({
          text: "No AI service API keys are configured. Please provide an Anthropic Claude, Google Gemini, or OpenAI API key.",
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
  
  // AI Chat and Notepad routes for streamers - redirecting to main endpoints
  // Get all chat sessions for a host
  app.get('/api/ai-chat-sessions/:hostId', async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: 'Invalid host ID' });
      }
      
      // Get chat sessions for the specified host
      const sessions = await db.select()
        .from(aiChatSessions)
        .where(and(
          eq(aiChatSessions.hostId, hostId),
          eq(aiChatSessions.isDeleted, false)
        ))
        .orderBy(desc(aiChatSessions.updatedAt));
      
      return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error fetching AI chat sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch AI chat sessions' });
    }
  });
  
  // For backward compatibility
  app.get('/api/ai-chats/:hostId', async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: 'Invalid host ID' });
      }

      // Fetch AI chats for the specified host
      const chats = await db.select()
        .from(aiChats)
        .where(and(
          eq(aiChats.hostId, hostId),
          eq(aiChats.isDeleted, false)
        ))
        .orderBy(desc(aiChats.createdAt))
        .limit(20);

      return res.json(chats);
    } catch (error) {
      console.error('Error fetching AI chats:', error);
      return res.status(500).json({ error: 'Failed to fetch AI chats' });
    }
  });

  // For backward compatibility
  app.post('/api/ai-chats', async (req, res) => {
    try {
      const { message, response, hostId } = req.body;

      if (!message || !response) {
        return res.status(400).json({ error: 'Message and response are required' });
      }

      if (!hostId) {
        return res.status(400).json({ error: 'Host ID is required' });
      }

      // Insert new AI chat
      const [newChat] = await db.insert(aiChats)
        .values({
          hostId,
          message,
          response,
          isDeleted: false,
        })
        .returning();

      return res.status(201).json(newChat);
    } catch (error) {
      console.error('Error creating AI chat:', error);
      return res.status(500).json({ error: 'Failed to create AI chat' });
    }
  });

  // Notepad endpoints
  app.get('/api/notepads/:hostId', async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ error: 'Invalid host ID' });
      }

      // Fetch notepads for the specified host
      const notes = await db.select()
        .from(notepads)
        .where(and(
          eq(notepads.hostId, hostId),
          eq(notepads.isDeleted, false)
        ))
        .orderBy(desc(notepads.updatedAt));

      return res.json(notes);
    } catch (error) {
      console.error('Error fetching notepads:', error);
      return res.status(500).json({ error: 'Failed to fetch notepads' });
    }
  });

  app.post('/api/notepads', async (req, res) => {
    try {
      const { title, content, hostId } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (!hostId) {
        return res.status(400).json({ error: 'Host ID is required' });
      }

      // Insert new notepad
      const [newNotepad] = await db.insert(notepads)
        .values({
          hostId,
          title: title || '',
          content,
          isDeleted: false,
        })
        .returning();

      return res.status(201).json(newNotepad);
    } catch (error) {
      console.error('Error creating notepad:', error);
      return res.status(500).json({ error: 'Failed to create notepad' });
    }
  });

  app.put('/api/notepads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content, hostId } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notepad ID' });
      }

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (!hostId) {
        return res.status(400).json({ error: 'Host ID is required' });
      }

      // Update notepad
      const [updatedNotepad] = await db.update(notepads)
        .set({
          title: title || '',
          content,
          updatedAt: new Date(),
        })
        .where(and(
          eq(notepads.id, id),
          eq(notepads.hostId, hostId)
        ))
        .returning();

      if (!updatedNotepad) {
        return res.status(404).json({ error: 'Notepad not found or you don\'t have permission to update it' });
      }

      return res.json(updatedNotepad);
    } catch (error) {
      console.error('Error updating notepad:', error);
      return res.status(500).json({ error: 'Failed to update notepad' });
    }
  });
  
  // Agora API endpoints for livestreaming
  app.get("/api/agora/app-id", getAgoraAppId);
  
  app.post("/api/agora/host-token", getHostToken);
  
  app.post("/api/agora/audience-token", getAudienceToken);
  
  app.post("/api/agora/livestream", createAgoraLivestream);
  
  // Endpoint to update stream active status
  app.post('/api/stream/active', async (req, res) => {
    try {
      const { channelName, isActive } = req.body;
      
      if (!channelName) {
        return res.status(400).json({ error: 'Channel name is required' });
      }
      
      console.log(`Setting stream ${channelName} active status to: ${isActive}`);
      
      // Update the database
      const result = await db.update(streamSessions)
        .set({ 
          isActive: isActive === true, 
          startedAt: isActive === true ? new Date() : undefined,
          endedAt: isActive === false ? new Date() : undefined
        })
        .where(eq(streamSessions.channelName, channelName))
        .returning({
          id: streamSessions.id,
          isActive: streamSessions.isActive,
          channelName: streamSessions.channelName
        });
        
      if (result.length === 0) {
        console.log(`No stream found with channel name: ${channelName}`);
        return res.status(404).json({ error: 'Stream not found' });
      }
      
      // Also update the global map if it exists
      if (global.streamViewers && global.streamViewers.has(channelName)) {
        const viewerData = global.streamViewers.get(channelName);
        if (viewerData) {
          viewerData.isActive = isActive === true;
          viewerData.lastUpdated = Date.now();
          global.streamViewers.set(channelName, viewerData);
          console.log(`Updated global map for channel: ${channelName}, isActive: ${isActive}`);
        }
      }
      
      return res.status(200).json({
        id: result[0].id,
        isActive: result[0].isActive,
        channelName: result[0].channelName
      });
    } catch (error) {
      console.error('Error updating stream active status:', error);
      return res.status(500).json({ error: 'Failed to update stream status' });
    }
  });
  
  // Get Agora credentials for a specific stream
  app.get("/api/stream/:streamId/join-credentials", async (req, res) => {
    try {
      const { streamId } = req.params;
      const { channel } = req.query; // Get optional channel parameter from query
      
      if (!streamId) {
        return res.status(400).json({ error: 'Stream ID is required' });
      }
      
      console.log(`Join credentials requested for stream ID: ${streamId}, channel: ${channel || 'not specified'}`);
      
      // Get stream info from database
      const parsedId = parseInt(streamId, 10);
      let streamData;
      
      // If channel parameter is provided, prioritize finding by channel name
      if (channel) {
        console.log(`Looking up stream by channel name: ${channel}`);
        // Try to find by channel name using Drizzle ORM
        const result = await db
          .select({
            id: streamSessions.id,
            channelName: streamSessions.channelName,
            isActive: streamSessions.isActive,
            hostName: users.username
          })
          .from(streamSessions)
          .innerJoin(users, eq(streamSessions.hostId, users.id))
          .where(eq(streamSessions.channelName, String(channel)))
          .limit(1);
        
        if (result.length > 0) {
          streamData = result[0];
          console.log(`Found stream by channel name: ${channel}`, streamData);
        }
      } else if (!isNaN(parsedId)) {
        console.log(`Looking up stream by ID: ${parsedId}`);
        // Find by ID using Drizzle ORM
        const result = await db
          .select({
            id: streamSessions.id,
            channelName: streamSessions.channelName,
            isActive: streamSessions.isActive,
            hostName: users.username
          })
          .from(streamSessions)
          .innerJoin(users, eq(streamSessions.hostId, users.id))
          .where(eq(streamSessions.id, parsedId))
          .limit(1);
        
        if (result.length > 0) {
          streamData = result[0];
          console.log(`Found stream by ID: ${parsedId}`, streamData);
        }
      } else {
        console.log(`Looking up stream by string ID: ${streamId}`);
        // Try to find by channel name using Drizzle ORM
        const result = await db
          .select({
            id: streamSessions.id,
            channelName: streamSessions.channelName,
            isActive: streamSessions.isActive,
            hostName: users.username
          })
          .from(streamSessions)
          .innerJoin(users, eq(streamSessions.hostId, users.id))
          .where(eq(streamSessions.channelName, streamId))
          .limit(1);
        
        if (result.length > 0) {
          streamData = result[0];
          console.log(`Found stream by string ID: ${streamId}`, streamData);
        }
      }
      
      if (!streamData) {
        console.log(`No active stream found for ID: ${streamId}, channel: ${channel || 'not specified'}`);
        return res.status(404).json({ error: 'Active stream not found' });
      }
      
      if (!streamData.isActive) {
        console.log(`Stream found but not active. Stream data:`, streamData);
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
      try {
        const livestreamResult = await db
          .select({
            id: livestreams.id,
            title: livestreams.title,
            channelName: livestreams.channelName,
            hostName: users.username,
            userId: livestreams.userId,
            status: livestreams.status,
            startedAt: livestreams.startedAt,
            description: livestreams.description,
            coverImageUrl: livestreams.coverImageUrl
          })
          .from(livestreams)
          .innerJoin(users, eq(livestreams.userId, users.id))
          .where(eq(livestreams.id, parsedId))
          .limit(1);
        
        if (livestreamResult.length > 0) {
          const livestream = livestreamResult[0];
          return res.status(200).json({
            id: livestream.id,
            streamTitle: livestream.title,
            channelName: livestream.channelName,
            hostName: livestream.hostName || 'Unknown',
            hostId: livestream.userId,
            isActive: livestream.status === 'live',
            startedAt: livestream.startedAt,
            description: livestream.description,
            coverImagePath: livestream.coverImageUrl
          });
        }
      } catch (error) {
        // If there's an error, just continue to the 404 response
        console.error('Error checking livestreams table:', error);
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

      const parsedId = parseInt(streamId, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid stream ID' });
      }

      // Update stream session status using Drizzle ORM
      const updateData: any = {
        isActive: isActive || false,
        viewerCount: viewerCount || 0,
        updatedAt: new Date()
      };
      
      // If stream is becoming active, set the start time
      if (isActive === true) {
        updateData.startedAt = new Date();
      }
      
      // If stream is becoming inactive, set the end time
      if (isActive === false) {
        updateData.endedAt = new Date();
      }

      const result = await db.update(streamSessions)
        .set(updateData)
        .where(eq(streamSessions.id, parsedId))
        .returning({
          id: streamSessions.id,
          isActive: streamSessions.isActive,
          startedAt: streamSessions.startedAt,
          endedAt: streamSessions.endedAt
        });

      if (result.length === 0) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      const updatedStream = result[0];
      return res.status(200).json({
        id: updatedStream.id,
        isActive: updatedStream.isActive,
        startedAt: updatedStream.startedAt,
        endedAt: updatedStream.endedAt
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

  // Agora webhook for stream status updates
  app.post("/api/webhook/agora/stream-status", async (req, res) => {
    try {
      const { channelName, eventType, ts, properties } = req.body;
      
      if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
      }
      
      console.log(`Received Agora webhook for channel ${channelName}, event: ${eventType}`);
      
      // Find stream session by channel name
      const [streamSession] = await db
        .select()
        .from(streamSessions)
        .where(eq(streamSessions.channelName, channelName));
        
      if (!streamSession) {
        return res.status(404).json({ error: "Stream session not found" });
      }
      
      // Update the stream status based on the event type
      let isActive = streamSession.isActive;
      
      if (eventType === "stream-started" || eventType === "broadcasting-started") {
        isActive = true;
      } else if (eventType === "stream-ended" || eventType === "broadcasting-ended") {
        isActive = false;
      }
      
      // Update the stream session
      const updateData: any = {
        isActive,
        updatedAt: new Date()
      };
      
      // If stream is becoming active, set the start time
      if (isActive && !streamSession.startedAt) {
        updateData.startedAt = new Date(ts || Date.now());
      }
      
      // If stream is becoming inactive, set the end time
      if (!isActive && streamSession.startedAt && !streamSession.endedAt) {
        updateData.endedAt = new Date(ts || Date.now());
      }
      
      // Update viewer count if provided
      if (properties && properties.audience) {
        updateData.viewerCount = properties.audience;
      }
      
      // Update the stream session
      await db.update(streamSessions)
        .set(updateData)
        .where(eq(streamSessions.id, streamSession.id));
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing Agora webhook:", error);
      return res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  
  // Stream ID validation endpoint
  app.get("/api/livestreams/:hostId/validate", async (req, res) => {
    try {
      const { hostId } = req.params;
      const { channel } = req.query; // Get optional channel parameter from query
      
      if (!hostId) {
        return res.status(400).json({ error: "Host ID is required" });
      }
      
      console.log(`Validating host ID: ${hostId}, channel: ${channel || 'not specified'}`);
      
      // Check if hostId is a valid number or timestamp
      // Since the generated IDs might be timestamps or other large numbers that exceed
      // PostgreSQL's integer limits, we'll handle them as strings for searching in multiple ways
      const parsedHostId = parseInt(hostId, 10);
      let numericId = null;
      
      // Only use the parsed ID if it's a reasonable size for PostgreSQL integer
      if (!isNaN(parsedHostId) && parsedHostId > 0 && parsedHostId < 2147483647) {
        numericId = parsedHostId;
        console.log(`Valid numeric host ID: ${numericId}`);
      } else {
        console.log(`Host ID ${hostId} is not a valid PostgreSQL integer, will search by string comparison`);
      }
      
      // Query the database to check if this host has an active stream
      let streams = [];
      
      try {
        // First try to find streams using the numeric ID if valid
        if (numericId !== null) {
          // Build the query with conditions
          let query = db.select().from(streamSessions);
          
          if (channel) {
            // Filter by both host ID and channel name
            streams = await query.where(and(
              eq(streamSessions.hostId, numericId),
              eq(streamSessions.channelName, String(channel))
            ));
          } else {
            // Filter just by host ID
            streams = await query.where(eq(streamSessions.hostId, numericId));
          }
          
          if (streams.length > 0) {
            console.log(`Found ${streams.length} streams for numeric host ID: ${numericId}`);
          }
        }
        
        // If no streams found with numeric ID or it wasn't valid, try alternate approaches
        if (streams.length === 0) {
          console.log(`No streams found with numeric ID, looking for any match with channel name`);
          
          // Try to find by channel name containing the host ID
          if (channel) {
            streams = await db.select()
              .from(streamSessions)
              .where(eq(streamSessions.channelName, String(channel)));
              
            if (streams.length > 0) {
              console.log(`Found ${streams.length} streams by channel name: ${channel}`);
            }
          } else {
            // As last resort, get all active streams (up to 10)
            streams = await db.select()
              .from(streamSessions)
              .where(eq(streamSessions.isActive, true))
              .limit(10);
              
            if (streams.length > 0) {
              console.log(`Found ${streams.length} active streams as fallback`);
            }
          }
        }
      } catch (queryError) {
        console.error('Error in database query:', queryError);
        // Continue with empty streams array
      }
      
      if (streams.length === 0) {
        console.log(`No streams found for host ID: ${hostId}`);
        return res.status(404).json({ 
          error: "No streams found for this host",
          isActive: false
        });
      }
      
      // Find the active stream if any
      const activeStream = streams.find(stream => stream.isActive);
      
      if (!activeStream) {
        console.log(`Host ${hostId} has streams but none are active`);
        return res.status(200).json({ 
          isActive: false,
          channelName: streams[0].channelName, // Return the first stream's channel name
          message: "Host has streams but none are currently active"
        });
      }
      
      // Stream is active, check if it's in the global map
      if (!streamViewers.has(activeStream.channelName)) {
        // Initialize it in the global map if not present
        streamViewers.set(activeStream.channelName, {
          count: 1,
          title: activeStream.streamTitle || `Live Stream`,
          streamId: activeStream.id.toString(),
          hostName: activeStream.hostName || "Host",
          isActive: true,
          lastUpdated: Date.now()
        });
        
        // Also set up the reverse mapping
        streamIdToChannel.set(activeStream.id.toString(), activeStream.channelName);
      }
      
      // Get viewer data with default values if not found
      const viewerData = streamViewers.get(activeStream.channelName) || {
        count: 1,
        title: activeStream.streamTitle || 'Live Stream',
        streamId: activeStream.id.toString(),
        hostName: activeStream.hostName || "Host",
        isActive: true,
        lastUpdated: Date.now()
      };
      
      console.log(`Host ${hostId} has active stream with channel ${activeStream.channelName}`);
      
      return res.status(200).json({ 
        isActive: true,
        channelName: activeStream.channelName,
        hostId: parsedHostId,
        streamId: activeStream.id,
        streamTitle: activeStream.streamTitle,
        ...viewerData
      });
    } catch (error) {
      console.error("Error validating host ID:", error);
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
