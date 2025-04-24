import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Research sessions for organizing chats
export const researchSessions = pgTable("research_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  preview: text("preview"),
  category: text("category").default("research"),
  icon: text("icon").default("search"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResearchSessionSchema = createInsertSchema(researchSessions).pick({
  userId: true,
  title: true,
  preview: true,
  category: true,
  icon: true,
});

export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchSession = typeof researchSessions.$inferSelect;

export const researchSessionsRelations = relations(researchSessions, ({ many }) => ({
  messages: many(messages),
  uploads: many(uploadedFiles)
}));

// Message schema for chat interactions
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => researchSessions.id),
  content: text("content").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  hasInfoGraphic: boolean("has_info_graphic").default(false),
  infoGraphicData: jsonb("info_graphic_data"),
  title: text("title"),
  category: text("category"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  sessionId: true,
  content: true,
  role: true,
  hasInfoGraphic: true,
  infoGraphicData: true,
  title: true,
  category: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  session: one(researchSessions, {
    fields: [messages.sessionId],
    references: [researchSessions.id],
  }),
}));

// InfoGraphic schema
export const infoGraphicSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
});

export type InfoGraphic = z.infer<typeof infoGraphicSchema>;

// Uploaded files
export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => researchSessions.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isProcessed: boolean("is_processed").default(false),
  processingResult: jsonb("processing_result"),
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).pick({
  userId: true,
  sessionId: true,
  filename: true,
  originalName: true,
  fileType: true,
  fileSize: true,
  path: true,
  isProcessed: true,
  processingResult: true,
});

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  user: one(users, {
    fields: [uploadedFiles.userId],
    references: [users.id],
  }),
  session: one(researchSessions, {
    fields: [uploadedFiles.sessionId],
    references: [researchSessions.id],
  }),
}));

// Prompt suggestion schema
export const promptSuggestions = pgTable("prompt_suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  icon: text("icon").notNull(),
  category: text("category").default("general"),
  isStreaming: boolean("is_streaming").default(false),
});

export const insertPromptSuggestionSchema = createInsertSchema(promptSuggestions);

export type InsertPromptSuggestion = z.infer<typeof insertPromptSuggestionSchema>;
export type PromptSuggestion = typeof promptSuggestions.$inferSelect;

// Site configuration
export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  siteName: text("site_name").default("vyna.live"),
  primaryColor: text("primary_color").default("#40C4D0"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertSiteConfigSchema = createInsertSchema(siteConfig).pick({
  logoUrl: true,
  siteName: true,
  primaryColor: true,
});

export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;
