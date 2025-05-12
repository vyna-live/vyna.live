import { db, pool } from '../db';
import { 
  loyaltyPasses, 
  loyaltyActivities, 
  LoyaltyTier, 
  PointActivity, 
  tierBenefits, 
  pointsPerActivity,
  type InsertLoyaltyPass,
  type InsertLoyaltyActivity
} from '../../shared/loyaltySchema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  createUserLoyaltyPass, 
  upgradeLoyaltyPassTier,
  awardPointsForActivity,
  checkAndUpgradeTier
} from './verxioService';

// Create a new loyalty pass for AI Research Rewards
export async function createLoyaltyPass(data: InsertLoyaltyPass) {
  try {
    // Issue the loyalty pass via Verxio Protocol
    const loyaltyPassData = await createUserLoyaltyPass(
      data.userId,
      data.walletAddress || undefined,
      data.tier as LoyaltyTier,
      0 // Initial XP points
    );
    
    // Set the verxioId and benefits from the response
    const passWithVerxioId = {
      ...data,
      verxioId: loyaltyPassData.verxioId,
      benefits: JSON.stringify(tierBenefits[data.tier as LoyaltyTier]),
      xpPoints: 0
    };
    
    // Insert into database using raw SQL to use the correct column names
    const query = `
      INSERT INTO loyalty_passes 
      (streamer_id, wallet_address, tier, xp_points, verxio_id, benefits)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.userId,
      data.walletAddress || null,
      data.tier,
      0, // Initial XP
      loyaltyPassData.verxioId,
      JSON.stringify(tierBenefits[data.tier as LoyaltyTier])
    ];
    
    const { rows } = await pool.query(query, values);
    const loyaltyPass = rows[0];
    
    return loyaltyPass;
  } catch (error) {
    console.error('Error creating loyalty pass:', error);
    throw error;
  }
}

// Get a loyalty pass by ID
export async function getLoyaltyPassById(id: number) {
  try {
    const [loyaltyPass] = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.id, id));
    
    if (loyaltyPass) {
      // Parse benefits JSON
      return {
        ...loyaltyPass,
        benefits: loyaltyPass.benefits ? JSON.parse(loyaltyPass.benefits) : null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting loyalty pass by ID:', error);
    throw error;
  }
}

// Get loyalty pass for a user
export async function getLoyaltyPassByUserId(userId: number) {
  try {
    console.log(`Looking for loyalty pass for user ID: ${userId}`);
    // Check for matching passes - we need to check both streamer_id and audience_id
    // since the database has these columns instead of user_id
    const query = `
      SELECT * FROM loyalty_passes
      WHERE streamer_id = $1 OR audience_id = $1
      LIMIT 1
    `;
    
    const { rows: passes } = await pool.query(query, [userId]);
    
    console.log(`Found ${passes.length} passes for user ID: ${userId}`);
    if (passes.length === 0) {
      return null;
    }
    
    // Parse benefits JSON and return the pass
    const pass = passes[0];
    return {
      ...pass,
      benefits: pass.benefits ? JSON.parse(pass.benefits) : null
    };
  } catch (error) {
    console.error('Error getting loyalty pass by user ID:', error);
    throw error;
  }
}

// Get all user loyalty passes
export async function getAllUserLoyaltyPasses() {
  try {
    const passes = await db.select()
      .from(loyaltyPasses);
    
    // Parse benefits JSON for each pass
    return passes.map(pass => ({
      ...pass,
      benefits: pass.benefits ? JSON.parse(pass.benefits) : null
    }));
  } catch (error) {
    console.error('Error getting all loyalty passes:', error);
    throw error;
  }
}

// Update a loyalty pass tier based on XP
export async function upgradeLoyaltyPass(id: number) {
  try {
    // Get the existing pass
    const [existingPass] = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.id, id));
    
    if (!existingPass) {
      throw new Error(`Loyalty pass with ID ${id} not found`);
    }
    
    // Check if eligible for upgrade
    const upgradeCheck = await checkAndUpgradeTier(
      existingPass.userId,
      existingPass.xpPoints || 0,
      existingPass.tier as LoyaltyTier
    );
    
    if (!upgradeCheck.shouldUpgrade) {
      return {
        ...existingPass,
        benefits: existingPass.benefits ? JSON.parse(existingPass.benefits) : null,
        upgraded: false
      };
    }
    
    const newTier = upgradeCheck.newTier as LoyaltyTier;
    
    // Update the loyalty pass on the blockchain
    if (existingPass.verxioId) {
      await upgradeLoyaltyPassTier(
        existingPass.verxioId, 
        existingPass.userId,
        existingPass.walletAddress || undefined
      );
    }
    
    // Update in database
    const [updatedPass] = await db.update(loyaltyPasses)
      .set({ 
        tier: newTier,
        benefits: JSON.stringify(tierBenefits[newTier]),
        updatedAt: new Date()
      })
      .where(eq(loyaltyPasses.id, id))
      .returning();
    
    return {
      ...updatedPass,
      benefits: updatedPass.benefits ? JSON.parse(updatedPass.benefits) : null,
      upgraded: true,
      newTier
    };
  } catch (error) {
    console.error('Error upgrading loyalty pass:', error);
    throw error;
  }
}

// Award points for an activity and update user's XP
export async function awardPointsToUser(userId: number, activityType: PointActivity, description?: string) {
  try {
    // Get the loyalty pass
    const userPass = await getLoyaltyPassByUserId(userId);
    
    if (!userPass) {
      throw new Error(`User ${userId} does not have a loyalty pass`);
    }
    
    // Award points via Verxio
    const awardResult = await awardPointsForActivity(userId, activityType, description);
    
    if (!awardResult.success) {
      throw new Error(awardResult.error || 'Failed to award points');
    }
    
    // Get points for this activity
    const pointsAwarded = pointsPerActivity[activityType];
    
    // Record the activity
    const [activity] = await db.insert(loyaltyActivities)
      .values({
        userId,
        activityType,
        pointsEarned: pointsAwarded,
        description: description || `Completed ${activityType}`
      })
      .returning();
    
    // Update user's XP in their loyalty pass
    const newXpTotal = (userPass.xpPoints || 0) + pointsAwarded;
    
    const [updatedPass] = await db.update(loyaltyPasses)
      .set({ 
        xpPoints: newXpTotal,
        updatedAt: new Date()
      })
      .where(eq(loyaltyPasses.id, userPass.id))
      .returning();
    
    // Check if user should be upgraded to next tier
    const upgradeCheck = await checkAndUpgradeTier(
      userId,
      newXpTotal,
      userPass.tier as LoyaltyTier
    );
    
    return {
      activity,
      pointsAwarded,
      newXpTotal,
      shouldUpgrade: upgradeCheck.shouldUpgrade,
      nextTier: upgradeCheck.shouldUpgrade ? upgradeCheck.newTier : null
    };
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
}

// Check if a user has a loyalty pass
export async function hasLoyaltyPass(userId: number) {
  try {
    const [pass] = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.userId, userId));
    
    return !!pass;
  } catch (error) {
    console.error('Error checking if user has loyalty pass:', error);
    throw error;
  }
}

// Get user loyalty activity history
export async function getUserLoyaltyActivities(userId: number) {
  try {
    const activities = await db.select()
      .from(loyaltyActivities)
      .where(eq(loyaltyActivities.userId, userId))
      .orderBy(desc(loyaltyActivities.createdAt));
    
    return activities;
  } catch (error) {
    console.error('Error getting user loyalty activities:', error);
    throw error;
  }
}

// Get the tier benefits for a specific tier
export function getTierBenefits(tier: LoyaltyTier) {
  return tierBenefits[tier];
}