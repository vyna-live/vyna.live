import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse as getOpenAIResponse } from "./openai";
import { getAIResponse as getGeminiResponse } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint to get AI responses
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
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
