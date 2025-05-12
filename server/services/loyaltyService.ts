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
    // Make sure we have a valid userId
    if (!data.userId && !data.streamerId && !data.audienceId) {
      throw new Error('Missing required user identification field');
    }
    
    // Determine which user ID to use (default to streamerId for consistency)
    const userId = data.userId || data.streamerId;
    
    if (!userId) {
      throw new Error('Missing required user ID');
    }
    
    // Issue the loyalty pass via Verxio Protocol
    const loyaltyPassData = await createUserLoyaltyPass(
      userId,
      data.walletAddress || undefined,
      data.tier as LoyaltyTier,
      0 // Initial XP points
    );
    
    // Insert into database using raw SQL to use the correct column names
    const query = `
      INSERT INTO loyalty_passes 
      (streamer_id, audience_id, wallet_address, tier, xp_points, verxio_id, benefits)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    // Use either streamerId or userId for the streamer_id column
    const streamerId = data.streamerId || data.userId || null;
    // Use audienceId if provided
    const audienceId = data.audienceId || null;
    
    const values = [
      streamerId,
      audienceId,
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
    
    // Use raw SQL with explicit column names
    const query = `
      SELECT 
        id, 
        streamer_id, 
        audience_id, 
        wallet_address, 
        tier, 
        xp_points as "xpPoints", 
        verxio_id as "verxioId", 
        benefits, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM loyalty_passes
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
    
    // Map database fields to our expected model
    const result = {
      id: pass.id,
      userId: pass.streamer_id || pass.audience_id,
      tier: pass.tier,
      xpPoints: pass.xpPoints || 0,
      walletAddress: pass.wallet_address,
      benefits: pass.benefits ? JSON.parse(pass.benefits) : [],
      verxioId: pass.verxioId,
      createdAt: pass.createdAt,
      updatedAt: pass.updatedAt
    };
    
    return result;
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
    // Get the existing pass with raw SQL
    const query = `
      SELECT 
        id, 
        streamer_id as "streamerId", 
        audience_id as "audienceId", 
        wallet_address as "walletAddress", 
        tier, 
        xp_points as "xpPoints", 
        verxio_id as "verxioId", 
        benefits, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM loyalty_passes
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [id]);
    
    if (!rows.length) {
      throw new Error(`Loyalty pass with ID ${id} not found`);
    }
    
    const existingPass = rows[0];
    
    // Determine the user ID (either streamerId or audienceId)
    const userId = existingPass.streamerId || existingPass.audienceId;
    
    if (!userId) {
      throw new Error(`Loyalty pass with ID ${id} has no associated user ID`);
    }
    
    // Check if eligible for upgrade
    const upgradeCheck = await checkAndUpgradeTier(
      userId,
      existingPass.xpPoints || 0,
      existingPass.tier as LoyaltyTier
    );
    
    if (!upgradeCheck.shouldUpgrade) {
      return {
        ...existingPass,
        benefits: existingPass.benefits ? JSON.parse(existingPass.benefits) : null,
        upgraded: false,
        userId // Add for compatibility
      };
    }
    
    const newTier = upgradeCheck.newTier as LoyaltyTier;
    
    // Update the loyalty pass on the blockchain
    if (existingPass.verxioId) {
      await upgradeLoyaltyPassTier(
        existingPass.verxioId, 
        userId,
        existingPass.walletAddress || undefined
      );
    }
    
    // Update in database with raw SQL
    const updateQuery = `
      UPDATE loyalty_passes
      SET 
        tier = $1,
        benefits = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING 
        id, 
        streamer_id as "streamerId", 
        audience_id as "audienceId", 
        wallet_address as "walletAddress", 
        tier, 
        xp_points as "xpPoints", 
        verxio_id as "verxioId", 
        benefits, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    
    const updateValues = [
      newTier,
      JSON.stringify(tierBenefits[newTier]),
      id
    ];
    
    const updateResult = await pool.query(updateQuery, updateValues);
    const updatedPass = updateResult.rows[0];
    
    return {
      ...updatedPass,
      benefits: updatedPass.benefits ? JSON.parse(updatedPass.benefits) : null,
      upgraded: true,
      userId: existingPass.streamerId || existingPass.audienceId, // Add for compatibility
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
    
    // Record the activity using raw SQL
    const insertActivityQuery = `
      INSERT INTO loyalty_activities 
      (user_id, activity_type, points_earned, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const activityValues = [
      userId,
      activityType,
      pointsAwarded,
      description || `Completed ${activityType}`
    ];
    
    const activityResult = await pool.query(insertActivityQuery, activityValues);
    const activity = activityResult.rows[0];
    
    // Update user's XP in their loyalty pass
    const newXpTotal = (userPass.xpPoints || 0) + pointsAwarded;
    
    // Use streamer_id or audience_id as appropriate
    const updatePassQuery = `
      UPDATE loyalty_passes
      SET 
        xp_points = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const updatePassValues = [newXpTotal, userPass.id];
    const updateResult = await pool.query(updatePassQuery, updatePassValues);
    const updatedPass = updateResult.rows[0];
    
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
    // Use raw SQL to check if user has a loyalty pass
    const query = `
      SELECT COUNT(*) as count
      FROM loyalty_passes
      WHERE streamer_id = $1 OR audience_id = $1
    `;
    
    const { rows } = await pool.query(query, [userId]);
    const { count } = rows[0];
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if user has loyalty pass:', error);
    throw error;
  }
}

// Get user loyalty activity history
export async function getUserLoyaltyActivities(userId: number) {
  try {
    // Use raw SQL to get activities with correct column names
    const query = `
      SELECT 
        id,
        user_id as "userId",
        activity_type as "activityType",
        points_earned as "pointsEarned",
        description,
        created_at as "createdAt"
      FROM loyalty_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const { rows: activities } = await pool.query(query, [userId]);
    
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

// Check if user is eligible for daily login reward
export async function checkDailyLoginEligibility(userId: number): Promise<boolean> {
  try {
    // Get the latest login activity for this user
    const query = `
      SELECT created_at as "createdAt"
      FROM loyalty_activities
      WHERE user_id = $1 AND activity_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const { rows } = await pool.query(query, [userId, PointActivity.DAILY_LOGIN]);
    
    // If no previous login activity, they are eligible
    if (rows.length === 0) {
      return true;
    }
    
    // Check if the last login was more than 24 hours ago
    const lastLoginTime = new Date(rows[0].createdAt).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (now - lastLoginTime) >= oneDayMs;
  } catch (error) {
    console.error('Error checking daily login eligibility:', error);
    return false; // Default to not eligible on error
  }
}

// Check and track research activity count for a user within the current chat session
// Returns true if the user should be awarded points (reached threshold)
export async function checkAndTrackResearchActivity(userId: number): Promise<boolean> {
  try {
    // Count is tracked in database to persist between server restarts
    const countQuery = `
      SELECT COUNT(*) as count
      FROM loyalty_activities 
      WHERE user_id = $1 
      AND activity_type = $2
      AND created_at > (NOW() - INTERVAL '1 hour')
    `;
    
    const { rows } = await pool.query(countQuery, [userId, 'researchTracker']);
    const currentCount = parseInt(rows[0].count, 10);
    
    // Record this activity regardless of whether points will be awarded
    const trackQuery = `
      INSERT INTO loyalty_activities
      (user_id, activity_type, points_earned, description)
      VALUES ($1, $2, $3, $4)
    `;
    
    await pool.query(trackQuery, [
      userId, 
      'researchTracker', 
      0, // No points for tracking
      `Research activity tracker: ${currentCount + 1}/15`
    ]);
    
    // Return true if this is the 15th activity (reached threshold)
    return (currentCount + 1) >= 15;
  } catch (error) {
    console.error('Error tracking research activity:', error);
    return false;
  }
}