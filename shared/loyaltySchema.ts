import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

// Loyalty tiers for AI Research Rewards
export enum LoyaltyTier {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum"
}

// Activity types for point rewards
export enum PointActivity {
  COMPLETE_RESEARCH = "completeResearch",
  SHARE_INSIGHT = "shareInsight",
  PROVIDE_FEEDBACK = "provideFeedback",
  DAILY_LOGIN = "dailyLogin"
}

// Points awarded per activity
export const pointsPerActivity = {
  [PointActivity.COMPLETE_RESEARCH]: 100,
  [PointActivity.SHARE_INSIGHT]: 50,
  [PointActivity.PROVIDE_FEEDBACK]: 25,
  [PointActivity.DAILY_LOGIN]: 5
};

// XP requirements for each tier
export const tierXpRequirements = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 500,
  [LoyaltyTier.GOLD]: 1500,
  [LoyaltyTier.PLATINUM]: 5000
};

// LoyaltyPass table schema
export const loyaltyPasses = pgTable("loyalty_passes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The user ID of the pass owner
  walletAddress: varchar("wallet_address", { length: 255 }), // Optional wallet address for blockchain verification
  tier: varchar("tier", { length: 50 }).notNull().default(LoyaltyTier.BRONZE),
  xpPoints: integer("xp_points").notNull().default(0), // Current XP points
  verxioId: varchar("verxio_id", { length: 255 }), // ID from Verxio Protocol
  benefits: text("benefits"), // JSON string of benefits
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Activity log for tracking point-earning activities
export const loyaltyActivities = pgTable("loyalty_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The user who performed the activity
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  pointsEarned: integer("points_earned").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Type for selecting from the loyalty_passes table
export type LoyaltyPass = typeof loyaltyPasses.$inferSelect;

// Type for selecting from the loyalty_activities table
export type LoyaltyActivity = typeof loyaltyActivities.$inferSelect;

// Insert schema for validation
export const insertLoyaltyPassSchema = createInsertSchema(loyaltyPasses, {
  tier: z.enum([LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM]),
}).omit({ id: true, createdAt: true, updatedAt: true, xpPoints: true });

// Insert schema for loyalty activities
export const insertLoyaltyActivitySchema = createInsertSchema(loyaltyActivities, {
  activityType: z.enum([
    PointActivity.COMPLETE_RESEARCH,
    PointActivity.SHARE_INSIGHT,
    PointActivity.PROVIDE_FEEDBACK,
    PointActivity.DAILY_LOGIN
  ])
}).omit({ id: true, createdAt: true });

// Type for inserting into the loyalty_passes table
export type InsertLoyaltyPass = z.infer<typeof insertLoyaltyPassSchema>;

// Type for inserting into the loyalty_activities table
export type InsertLoyaltyActivity = z.infer<typeof insertLoyaltyActivitySchema>;

// Benefits defined for each tier based on AI Research Rewards program
export const tierBenefits = {
  [LoyaltyTier.BRONZE]: {
    description: "Bronze Researcher Benefits",
    features: [
      "Basic AI research templates",
      "Standard research tools",
      "Community forum access"
    ]
  },
  [LoyaltyTier.SILVER]: {
    description: "Silver Researcher Benefits",
    features: [
      "Advanced research tools",
      "Priority support",
      "Enhanced AI response quality",
      "Access to specialized templates"
    ]
  },
  [LoyaltyTier.GOLD]: {
    description: "Gold Researcher Benefits",
    features: [
      "Exclusive research databases",
      "Extended API access",
      "Early feature access",
      "Dedicated support channel",
      "Advanced visualization tools"
    ]
  },
  [LoyaltyTier.PLATINUM]: {
    description: "Platinum Expert Benefits",
    features: [
      "Unlimited research sessions",
      "Custom AI model fine-tuning",
      "Dedicated support",
      "Premium analytics tools",
      "Custom export options",
      "Exclusive workshops and webinars"
    ]
  }
};