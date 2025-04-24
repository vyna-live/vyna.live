import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse as getOpenAIResponse } from "./openai";
import { getAIResponse as getGeminiResponse } from "./gemini";
import multer from "multer";
import { db } from "./db";
import { saveUploadedFile, getFileById, processUploadedFile, deleteFile } from "./fileUpload";
import { siteConfig, researchSessions, messages, uploadedFiles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { log } from "./vite";
import { getStreamToken, createLivestream, getStreamApiKey } from "./getstream";

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
      
      const userId = 1; // Default for now, replace with actual auth logic later
      const sessionId = req.body.sessionId ? parseInt(req.body.sessionId) : null;
      
      const savedFile = await saveUploadedFile(req.file, userId, sessionId);
      
      // Process the file in the background
      processUploadedFile(savedFile.id).catch(err => {
        log(`Error processing file ${savedFile.id}: ${err}`, "error");
      });
      
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

  const httpServer = createServer(app);

  return httpServer;
}
