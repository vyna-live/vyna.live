import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Message schema for chat interactions
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  role: text("role").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  hasInfoGraphic: boolean("has_info_graphic").default(false),
  infoGraphicData: jsonb("info_graphic_data"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  content: true,
  role: true,
  hasInfoGraphic: true,
  infoGraphicData: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// InfoGraphic schema
export const infoGraphicSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
});

export type InfoGraphic = z.infer<typeof infoGraphicSchema>;

// Prompt suggestion schema
export const promptSuggestions = pgTable("prompt_suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  icon: text("icon").notNull(),
});

export const insertPromptSuggestionSchema = createInsertSchema(promptSuggestions);

export type InsertPromptSuggestion = z.infer<typeof insertPromptSuggestionSchema>;
export type PromptSuggestion = typeof promptSuggestions.$inferSelect;
