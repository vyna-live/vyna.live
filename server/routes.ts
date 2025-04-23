import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint to get AI responses
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get AI response from OpenAI
      const aiResponse = await getAIResponse(message);
      
      return res.status(200).json(aiResponse);
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get prompt suggestions
  app.get("/api/prompts", async (_req, res) => {
    try {
      // You could fetch these from a database in a real implementation
      const prompts = [
        {
          id: 1,
          text: "Write a to-do list for a personal project or task",
          icon: "user",
        },
        {
          id: 2,
          text: "Generate an email reply to a job offer",
          icon: "mail",
        },
        {
          id: 3,
          text: "Summarise this article or text for me in one paragraph",
          icon: "file-text",
        },
        {
          id: 4,
          text: "How does AI work in a technical capacity",
          icon: "zap",
        },
      ];
      
      return res.status(200).json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
