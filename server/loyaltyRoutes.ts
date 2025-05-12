import { Request, Response, NextFunction } from "express";
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

// Initialize Verxio Context at startup with AI Research Rewards program
export async function initializeVerxioContext() {
  try {
    // Initialize the Verxio context with our research rewards configuration
    await initVerxioContext();
    
    // Create or update the loyalty program configuration
    const program = await createLoyaltyProgram();
    
    console.log("Verxio Context initialization called with AI Research Rewards program");
    return program;
  } catch (error) {
    console.error("Failed to initialize Verxio Context:", error);
  }
}

// Create a new AI Research Rewards loyalty pass for the user
export async function createLoyaltyPassHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if user already has a loyalty pass
    const alreadyHasPass = await hasLoyaltyPass(req.user!.id);
    if (alreadyHasPass) {
      return res.status(409).json({ error: "User already has an AI Research Rewards pass" });
    }

    // Create pass data - start with bronze tier
    const passData = {
      userId: req.user!.id,
      tier: LoyaltyTier.BRONZE,
      walletAddress: req.body.walletAddress || null,
    };
    
    // Create the loyalty pass
    const loyaltyPass = await createLoyaltyPass(passData);
    
    // Return success with welcome message and pass details
    res.status(201).json({
      message: "Welcome to the AI Research Rewards program!",
      loyaltyPass,
      nextTier: {
        name: "Silver Researcher",
        pointsNeeded: 500,
        benefits: getTierBenefits(LoyaltyTier.SILVER)
      }
    });
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

// Get the AI Research Rewards pass for a user
export async function getUserLoyaltyPassHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get user ID from query or use authenticated user's ID
    let userId = req.query.userId 
      ? parseInt(req.query.userId as string) 
      : req.user!.id;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // If requesting pass for another user, ensure proper permissions
    if (userId !== req.user!.id) {
      // For now, we'll just disallow it for simplicity
      // In production, we'd check if the user has admin privileges
      return res.status(403).json({ error: "You can only get your own AI Research rewards pass" });
    }
    
    // Get the loyalty pass for this user
    const loyaltyPass = await getLoyaltyPassByUserId(userId);
    
    if (!loyaltyPass) {
      return res.status(404).json({ 
        error: "No loyalty pass found",
        canCreate: true
      });
    }
    
    // Get user's recent activities
    const activities = await getUserLoyaltyActivities(userId);
    
    // Calculate progress to next tier
    const currentTier = loyaltyPass.tier as LoyaltyTier;
    const currentXp = loyaltyPass.xpPoints || 0;
    
    // Determine next tier
    let nextTier: LoyaltyTier | null = null;
    let progress = 0;
    let xpNeeded = 0;
    
    if (currentTier === LoyaltyTier.BRONZE) {
      nextTier = LoyaltyTier.SILVER;
      xpNeeded = 500;
    } else if (currentTier === LoyaltyTier.SILVER) {
      nextTier = LoyaltyTier.GOLD;
      xpNeeded = 1000;
    } else if (currentTier === LoyaltyTier.GOLD) {
      nextTier = LoyaltyTier.PLATINUM;
      xpNeeded = 2000;
    }
    
    if (nextTier) {
      progress = Math.min(100, Math.round((currentXp / xpNeeded) * 100));
    }
    
    res.status(200).json({
      loyaltyPass,
      recentActivities: activities.slice(0, 5),
      nextTier: nextTier ? {
        name: nextTier,
        progress,
        currentXp,
        xpNeeded,
        benefits: getTierBenefits(nextTier)
      } : null
    });
  } catch (error) {
    console.error("Error getting user loyalty pass:", error);
    res.status(500).json({ error: "Failed to get user loyalty pass" });
  }
}

// Get all loyalty passes (admin function)
export async function getAllLoyaltyPassesHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // In a production app, we would check if the user is an admin
    // For now, we'll just return all passes
    const loyaltyPasses = await getAllUserLoyaltyPasses();
    res.status(200).json(loyaltyPasses);
  } catch (error) {
    console.error("Error getting all loyalty passes:", error);
    res.status(500).json({ error: "Failed to get all loyalty passes" });
  }
}

// Award points to a user for research activity
export async function awardPointsHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Validate request body
    const pointsSchema = z.object({
      activityType: z.enum([
        PointActivity.COMPLETE_RESEARCH,
        PointActivity.SHARE_INSIGHT,
        PointActivity.PROVIDE_FEEDBACK,
        PointActivity.DAILY_LOGIN
      ]),
      description: z.string().optional()
    });
    
    const validationResult = pointsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid request data", details: validationResult.error });
    }
    
    const { activityType, description } = validationResult.data;
    
    // Award points
    const result = await awardPointsToUser(req.user!.id, activityType, description);
    
    res.status(200).json({
      success: true,
      pointsAwarded: result.pointsAwarded,
      newTotal: result.newXpTotal,
      shouldUpgrade: result.shouldUpgrade,
      nextTier: result.nextTier
    });
  } catch (error) {
    console.error("Error awarding points:", error);
    res.status(500).json({ error: "Failed to award points" });
  }
}

// Upgrade a loyalty pass to a higher tier based on XP
export async function upgradeLoyaltyPassHandler(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get the loyalty pass
    const userPass = await getLoyaltyPassByUserId(req.user!.id);
    if (!userPass) {
      return res.status(404).json({ 
        error: "No loyalty pass found",
        canCreate: true
      });
    }
    
    // Check if pass is eligible for upgrade
    const upgradedPass = await upgradeLoyaltyPass(userPass.id);
    
    if (!upgradedPass.upgraded) {
      return res.status(400).json({ 
        error: "Not eligible for upgrade yet",
        currentXp: userPass.xpPoints || 0,
        tier: userPass.tier,
        message: "Complete more research activities to earn XP and upgrade your tier"
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Congratulations! You've been upgraded to ${upgradedPass.newTier}!`,
      loyaltyPass: upgradedPass
    });
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

// Register all AI Research Rewards routes
export function registerLoyaltyRoutes(app: any) {
  // Initialize Verxio Context with AI Research Rewards program
  initializeVerxioContext();
  
  // Create a new AI Research Rewards loyalty pass
  app.post('/api/research/rewards/enroll', ensureAuthenticated, createLoyaltyPassHandler);
  
  // Get a loyalty pass by ID (mainly for admin use)
  app.get('/api/research/rewards/passes/:id', getLoyaltyPassByIdHandler);
  
  // Get the user's research rewards pass with progress info
  app.get('/api/research/rewards/user', ensureAuthenticated, getUserLoyaltyPassHandler);
  
  // Get all loyalty passes (admin route)
  app.get('/api/research/rewards/all', ensureAuthenticated, getAllLoyaltyPassesHandler);
  
  // Award points for research activities
  app.post('/api/research/rewards/points', ensureAuthenticated, awardPointsHandler);
  
  // Request an upgrade check
  app.post('/api/research/rewards/upgrade', ensureAuthenticated, upgradeLoyaltyPassHandler);
  
  // Get tier benefits
  app.get('/api/research/rewards/benefits/:tier', getTierBenefitsHandler);
  
  // Add loyalty check to all research activities
  app.use('/api/ai/research', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Award points for completing research
      if (req.method === 'POST') {
        const userId = req.user!.id;
        // Check if user has a loyalty pass
        const hasPass = await hasLoyaltyPass(userId);
        
        if (hasPass) {
          // Award points asynchronously, don't wait for result
          awardPointsToUser(userId, PointActivity.COMPLETE_RESEARCH, "Completed AI research query")
            .catch(err => console.error("Error awarding research points:", err));
        }
      }
      next();
    } catch (error) {
      next();
    }
  });
}