import { Request, Response } from "express";
import { z } from "zod";
import { insertLoyaltyPassSchema, LoyaltyTier, PointActivity } from "../shared/loyaltySchema";
import { 
  createLoyaltyPass, 
  getLoyaltyPassById, 
  getLoyaltyPassByUserId,
  getAllUserLoyaltyPasses, 
  upgradeLoyaltyPass, 
  hasLoyaltyPass, 
  getTierBenefits,
  awardPointsToUser,
  getUserLoyaltyActivities
} from "./services/loyaltyService";
import { initVerxioContext, createLoyaltyProgram } from "./services/verxioService";
import { ensureAuthenticated } from "./auth";

// Initialize Verxio Context at startup
export async function initializeVerxioContext() {
  try {
    // This function is a simplified initialization for demonstration purposes
    // In a production environment, we would initialize with proper config
    console.log("Verxio Context initialization called");
    return {};
  } catch (error) {
    console.error("Failed to initialize Verxio Context:", error);
  }
}

// Create a new loyalty pass (streamer gives a pass to audience member)
export async function createLoyaltyPassHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated and is a streamer
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate request body
    const validationResult = insertLoyaltyPassSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid request data", details: validationResult.error });
    }
    
    // Get validated data
    const passData = validationResult.data;
    
    // Ensure the streamer ID matches the authenticated user
    if (passData.streamerId !== req.user!.id) {
      return res.status(403).json({ error: "You can only create loyalty passes for yourself as a streamer" });
    }
    
    // Check if the audience member already has a pass from this streamer
    const alreadyHasPass = await hasLoyaltyPass(passData.streamerId, passData.audienceId);
    if (alreadyHasPass) {
      return res.status(409).json({ error: "Audience member already has a loyalty pass from this streamer" });
    }
    
    // Create the loyalty pass
    const loyaltyPass = await createLoyaltyPass(passData);
    
    res.status(201).json(loyaltyPass);
  } catch (error) {
    console.error("Error creating loyalty pass:", error);
    res.status(500).json({ error: "Failed to create loyalty pass" });
  }
}

// Get a loyalty pass by ID
export async function getLoyaltyPassByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const loyaltyPass = await getLoyaltyPassById(id);
    if (!loyaltyPass) {
      return res.status(404).json({ error: "Loyalty pass not found" });
    }
    
    res.status(200).json(loyaltyPass);
  } catch (error) {
    console.error("Error getting loyalty pass:", error);
    res.status(500).json({ error: "Failed to get loyalty pass" });
  }
}

// Get all loyalty passes for an audience member
export async function getAudienceLoyaltyPassesHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get audience ID from query or use authenticated user's ID
    let audienceId = req.query.audienceId 
      ? parseInt(req.query.audienceId as string) 
      : req.user!.id;
    
    if (isNaN(audienceId)) {
      return res.status(400).json({ error: "Invalid audience ID format" });
    }
    
    // If requesting passes for another user, ensure the requester is a streamer
    if (audienceId !== req.user!.id) {
      // Here you would check if the authenticated user is a streamer
      // For now, we'll just disallow it for simplicity
      return res.status(403).json({ error: "You can only get your own loyalty passes" });
    }
    
    const loyaltyPasses = await getLoyaltyPassesByAudienceId(audienceId);
    res.status(200).json(loyaltyPasses);
  } catch (error) {
    console.error("Error getting audience loyalty passes:", error);
    res.status(500).json({ error: "Failed to get audience loyalty passes" });
  }
}

// Get all loyalty passes issued by a streamer
export async function getStreamerLoyaltyPassesHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get streamer ID from query or use authenticated user's ID
    let streamerId = req.query.streamerId 
      ? parseInt(req.query.streamerId as string) 
      : req.user!.id;
    
    if (isNaN(streamerId)) {
      return res.status(400).json({ error: "Invalid streamer ID format" });
    }
    
    // If requesting passes for another streamer, ensure the requester is authorized
    if (streamerId !== req.user!.id) {
      // Here you would check if the authenticated user is an admin or has special permissions
      // For now, we'll just disallow it for simplicity
      return res.status(403).json({ error: "You can only get loyalty passes you've issued" });
    }
    
    const loyaltyPasses = await getLoyaltyPassesByStreamerId(streamerId);
    res.status(200).json(loyaltyPasses);
  } catch (error) {
    console.error("Error getting streamer loyalty passes:", error);
    res.status(500).json({ error: "Failed to get streamer loyalty passes" });
  }
}

// Upgrade a loyalty pass to a higher tier
export async function upgradeLoyaltyPassHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Validate request parameters
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    // Validate request body
    const tierSchema = z.object({
      tier: z.enum([LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD])
    });
    
    const validationResult = tierSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid tier", details: validationResult.error });
    }
    
    // Get the existing pass to check permissions
    const existingPass = await getLoyaltyPassById(id);
    if (!existingPass) {
      return res.status(404).json({ error: "Loyalty pass not found" });
    }
    
    // Ensure the streamer ID matches the authenticated user
    if (existingPass.streamerId !== req.user!.id) {
      return res.status(403).json({ error: "You can only upgrade loyalty passes you've issued" });
    }
    
    // Upgrade the loyalty pass
    const upgradedPass = await upgradeLoyaltyPass(id, validationResult.data.tier);
    
    res.status(200).json(upgradedPass);
  } catch (error) {
    console.error("Error upgrading loyalty pass:", error);
    res.status(500).json({ error: "Failed to upgrade loyalty pass" });
  }
}

// Get tier benefits
export async function getTierBenefitsHandler(req: Request, res: Response) {
  try {
    // Validate tier parameter
    const tierSchema = z.enum([LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD]);
    const validationResult = tierSchema.safeParse(req.params.tier);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid tier", details: validationResult.error });
    }
    
    const tier = validationResult.data;
    const benefits = getTierBenefits(tier);
    
    res.status(200).json(benefits);
  } catch (error) {
    console.error("Error getting tier benefits:", error);
    res.status(500).json({ error: "Failed to get tier benefits" });
  }
}

// Register all loyalty routes
export function registerLoyaltyRoutes(app: any) {
  // Initialize Verxio Context
  initializeVerxioContext();
  
  // Create a new loyalty pass
  app.post('/api/loyalty/passes', ensureAuthenticated, createLoyaltyPassHandler);
  
  // Get a loyalty pass by ID
  app.get('/api/loyalty/passes/:id', getLoyaltyPassByIdHandler);
  
  // Get all loyalty passes for an audience member
  app.get('/api/loyalty/audience/passes', ensureAuthenticated, getAudienceLoyaltyPassesHandler);
  
  // Get all loyalty passes issued by a streamer
  app.get('/api/loyalty/streamer/passes', ensureAuthenticated, getStreamerLoyaltyPassesHandler);
  
  // Upgrade a loyalty pass to a higher tier
  app.put('/api/loyalty/passes/:id/upgrade', ensureAuthenticated, upgradeLoyaltyPassHandler);
  
  // Get tier benefits
  app.get('/api/loyalty/benefits/:tier', getTierBenefitsHandler);
}