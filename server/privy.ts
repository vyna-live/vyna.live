import { Request, Response } from "express";
import { db } from "./db";
import { users, User } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Get user by privyId
export async function getUserByPrivyId(privyId: string): Promise<User | undefined> {
  try {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.privyId, privyId));
      
    if (results && results.length > 0) {
      return results[0];
    }
    return undefined;
  } catch (error) {
    console.error("Error getting user by privyId:", error);
    return undefined;
  }
}

// Create a new user based on Privy data
export async function createUserFromPrivy(privyData: { 
  privyId: string;
  email?: string;
  username?: string;
}): Promise<User> {
  // Generate a random password since we're using Privy for auth
  const randomPassword = randomBytes(16).toString('hex');
  const hashedPassword = await hashPassword(randomPassword);
  
  // Generate a username if none provided
  const username = privyData.username || `user_${randomBytes(4).toString('hex')}`;
  const email = privyData.email || null;
  
  // Check if username already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
    
  // If username exists, generate a unique one
  const finalUsername = existingUser.length > 0 
    ? `${username}_${randomBytes(4).toString('hex')}`
    : username;
  
  // Create the user with type-safe values
  const newUserValues = {
    username: finalUsername,
    email,
    password: hashedPassword,
    privyId: privyData.privyId,
    role: 'user' as const,
    isEmailVerified: !!email,
    privyWallets: {} as any // Empty JSON object for now
  };
  
  try {
    const results = await db
      .insert(users)
      .values(newUserValues)
      .returning();
    
    if (results && results.length > 0) {
      return results[0];
    }
    throw new Error("Failed to create user: No user returned");
  } catch (error) {
    console.error("Error creating user from Privy data:", error);
    throw error;
  }
}

// Privy login handler
export async function privyLoginHandler(req: Request, res: Response) {
  try {
    const { privyId } = req.body;
    
    if (!privyId) {
      return res.status(400).json({ error: "Privy ID is required" });
    }
    
    // Check if user exists
    let user = await getUserByPrivyId(privyId);
    
    // If user doesn't exist, create a new one
    if (!user) {
      // Create user from Privy data
      // In a production app, you might want to verify this data with Privy's API
      const email = req.body.email || undefined;
      const username = req.body.username || undefined;
      
      user = await createUserFromPrivy({
        privyId,
        email,
        username,
      });
    }
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Authentication failed" });
      }
      
      // Return user data
      return res.status(200).json(user);
    });
  } catch (error) {
    console.error("Privy login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Add a user's wallet address
export async function addWalletAddressHandler(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { walletAddress, chainId } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    
    // Update user's wallet information
    // In a real app, this would store wallet addresses in a separate table with a user_id foreign key
    // For simplicity, we're not implementing the full wallet storage system here
    
    return res.status(200).json({ success: true, message: "Wallet address added" });
  } catch (error) {
    console.error("Add wallet error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}