import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

// Loyalty tiers
export enum LoyaltyTier {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold"
}

// LoyaltyPass table schema
export const loyaltyPasses = pgTable("loyalty_passes", {
  id: serial("id").primaryKey(),
  streamerId: integer("streamer_id").notNull(), // The user ID of the streamer who created the pass
  audienceId: integer("audience_id").notNull(), // The user ID of the audience member who received the pass
  walletAddress: varchar("wallet_address", { length: 255 }), // Optional wallet address for blockchain verification
  tier: varchar("tier", { length: 50 }).notNull().default(LoyaltyTier.BRONZE), // Bronze, Silver, Gold
  verxioId: varchar("verxio_id", { length: 255 }), // ID from Verxio Protocol
  benefits: text("benefits"), // JSON string of benefits
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Type for selecting from the loyalty_passes table
export type LoyaltyPass = typeof loyaltyPasses.$inferSelect;

// Insert schema for validation
export const insertLoyaltyPassSchema = createInsertSchema(loyaltyPasses, {
  tier: z.enum([LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD]),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Type for inserting into the loyalty_passes table
export type InsertLoyaltyPass = z.infer<typeof insertLoyaltyPassSchema>;

// Benefits defined for each tier
export const tierBenefits = {
  [LoyaltyTier.BRONZE]: {
    description: "Bronze Tier Benefits",
    features: [
      "Early access to stream schedules",
      "Access to bronze-only chat room",
      "Limited-time emotes"
    ]
  },
  [LoyaltyTier.SILVER]: {
    description: "Silver Tier Benefits",
    features: [
      "All Bronze benefits",
      "Personalized stream shoutouts",
      "Exclusive Q&A sessions",
      "Discounted merchandise"
    ]
  },
  [LoyaltyTier.GOLD]: {
    description: "Gold Tier Benefits",
    features: [
      "All Silver benefits",
      "Private VIP streams",
      "Monthly virtual meet-and-greet",
      "Loyalty badge next to name",
      "Participation in content planning"
    ]
  }
};