import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

// Loyalty tiers for AI Research Rewards
export enum LoyaltyTier {
  BRONZE = "bronze",     // Maps to "Researcher" in the UI
  SILVER = "silver",     // Maps to "Scholar" in the UI
  GOLD = "gold",         // Maps to "Expert" in the UI
  PLATINUM = "platinum"  // Maps to "Luminary" in the UI
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
  [PointActivity.COMPLETE_RESEARCH]: 5, // 5XP for research (after 15 activities)
  [PointActivity.SHARE_INSIGHT]: 5,     // 5XP for sharing insight
  [PointActivity.PROVIDE_FEEDBACK]: 3,  // 3XP for providing feedback
  [PointActivity.DAILY_LOGIN]: 5        // 5XP for daily login
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
  streamerId: integer("streamer_id"), // The streamer ID (can be null)
  audienceId: integer("audience_id"), // The audience ID (can be null)
  walletAddress: varchar("wallet_address", { length: 255 }), // Optional wallet address for blockchain verification
  tier: varchar("tier", { length: 50 }).notNull().default(LoyaltyTier.BRONZE),
  xpPoints: integer("xp_points").default(0), // Current XP points
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
}).omit({ id: true, createdAt: true, updatedAt: true, xpPoints: true })
  .extend({
    // Add userId field for backward compatibility
    userId: z.number().optional(),
  });

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
    description: "Researcher Benefits",
    features: [
      "Access to basic AI research tools",
      "Track your research progress",
      "Basic visualization tools",
      "Earn 5XP for every 15 research queries"
    ]
  },
  [LoyaltyTier.SILVER]: {
    description: "Scholar Benefits",
    features: [
      "Everything in Researcher tier",
      "Advanced AI model access",
      "Priority processing for research queries",
      "Enhanced visualization tools",
      "Detailed analytics dashboard"
    ]
  },
  [LoyaltyTier.GOLD]: {
    description: "Expert Benefits",
    features: [
      "Everything in Scholar tier",
      "Unlimited research queries",
      "Custom AI model fine-tuning",
      "Dedicated support channel",
      "Advanced export and sharing tools",
      "Early access to new features"
    ]
  },
  [LoyaltyTier.PLATINUM]: {
    description: "Luminary Benefits",
    features: [
      "Everything in Expert tier",
      "Personalized AI research assistant",
      "White-glove support with dedicated account manager",
      "Exclusive webinars and workshops",
      "Advanced data integration capabilities",
      "Custom research templates and workflows"
    ]
  }
};