import { db } from '../db';
import { loyaltyPasses, LoyaltyTier, tierBenefits, type InsertLoyaltyPass } from '../../shared/loyaltySchema';
import { eq, and } from 'drizzle-orm';
import { issueLoyaltyPassToAudience, upgradeLoyaltyPassTier } from './verxioService';

// Create a new loyalty pass
export async function createLoyaltyPass(data: InsertLoyaltyPass) {
  try {
    // Issue the loyalty pass to the audience member via Verxio Protocol
    const loyaltyPassData = await issueLoyaltyPassToAudience(
      data.streamerId,
      data.audienceId,
      data.walletAddress || undefined,
      data.tier as LoyaltyTier
    );
    
    // Set the verxioId from the response
    const passWithVerxioId = {
      ...data,
      verxioId: loyaltyPassData.verxioId,
      benefits: JSON.stringify(tierBenefits[data.tier as LoyaltyTier])
    };
    
    // Insert into database
    const [loyaltyPass] = await db.insert(loyaltyPasses)
      .values(passWithVerxioId)
      .returning();
    
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

// Get loyalty passes for an audience member
export async function getLoyaltyPassesByAudienceId(audienceId: number) {
  try {
    const passes = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.audienceId, audienceId));
    
    // Parse benefits JSON for each pass
    return passes.map(pass => ({
      ...pass,
      benefits: pass.benefits ? JSON.parse(pass.benefits) : null
    }));
  } catch (error) {
    console.error('Error getting loyalty passes by audience ID:', error);
    throw error;
  }
}

// Get loyalty passes issued by a streamer
export async function getLoyaltyPassesByStreamerId(streamerId: number) {
  try {
    const passes = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.streamerId, streamerId));
    
    // Parse benefits JSON for each pass
    return passes.map(pass => ({
      ...pass,
      benefits: pass.benefits ? JSON.parse(pass.benefits) : null
    }));
  } catch (error) {
    console.error('Error getting loyalty passes by streamer ID:', error);
    throw error;
  }
}

// Update a loyalty pass tier
export async function upgradeLoyaltyPass(id: number, newTier: LoyaltyTier) {
  try {
    // Get the existing pass
    const [existingPass] = await db.select()
      .from(loyaltyPasses)
      .where(eq(loyaltyPasses.id, id));
    
    if (!existingPass) {
      throw new Error(`Loyalty pass with ID ${id} not found`);
    }
    
    // Update the loyalty pass on the blockchain
    if (existingPass.verxioId && existingPass.walletAddress) {
      await upgradeLoyaltyPassTier(
        existingPass.verxioId, 
        existingPass.walletAddress,
        newTier
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
      benefits: updatedPass.benefits ? JSON.parse(updatedPass.benefits) : null
    };
  } catch (error) {
    console.error('Error upgrading loyalty pass:', error);
    throw error;
  }
}

// Check if an audience member has a pass from a specific streamer
export async function hasLoyaltyPass(streamerId: number, audienceId: number) {
  try {
    const [pass] = await db.select()
      .from(loyaltyPasses)
      .where(
        and(
          eq(loyaltyPasses.streamerId, streamerId),
          eq(loyaltyPasses.audienceId, audienceId)
        )
      );
    
    return !!pass;
  } catch (error) {
    console.error('Error checking if audience has loyalty pass:', error);
    throw error;
  }
}

// Get the tier benefits for a specific tier
export function getTierBenefits(tier: LoyaltyTier) {
  return tierBenefits[tier];
}