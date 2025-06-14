import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Table Definitions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  // Wallet fields
  walletAddress: text("wallet_address").unique(),
  walletProvider: varchar("wallet_provider", { length: 50 }),
  walletConnectedAt: timestamp("wallet_connected_at"),
  // Password reset fields
  resetPasswordToken: text("reset_password_token").unique(),
  resetPasswordExpires: timestamp("reset_password_expires"),
  // Email verification fields
  verificationToken: text("verification_token").unique(),
  verificationExpires: timestamp("verification_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(), // user, admin
  isEmailVerified: boolean("is_email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
});

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

export const promptSuggestions = pgTable("prompt_suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  icon: text("icon").notNull(),
  category: text("category").default("general"),
  isStreaming: boolean("is_streaming").default(false),
});

export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  siteName: text("site_name").default("vyna.live"),
  primaryColor: text("primary_color").default("#40C4D0"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  channelName: text("channel_name").notNull().unique(),
  status: varchar("status", { length: 20 }).default("offline").notNull(), // offline, live, ended
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  scheduledFor: timestamp("scheduled_for"),
  coverImageUrl: text("cover_image_url"),
  streamType: varchar("stream_type", { length: 20 }).default("public").notNull(), // public, private, premium
  privacy: varchar("privacy", { length: 20 }).default("public").notNull(), // public, private, unlisted
  viewCount: integer("view_count").default(0),
  maxConcurrentViewers: integer("max_concurrent_viewers").default(0),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const livestreamParticipants = pgTable("livestream_participants", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default("viewer").notNull(), // host, co-host, guest, viewer
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
  agoraUid: integer("agora_uid"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
});

export const livestreamChatMessages = pgTable("livestream_chat_messages", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false),
  isHighlighted: boolean("is_highlighted").default(false),
  replyToId: integer("reply_to_id"),  // We'll set the reference in the relations
  metadata: jsonb("metadata"), // Can store things like user's color, emoji reactions, etc.
});

export const livestreamInvitations = pgTable("livestream_invitations", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  inviterId: integer("inviter_id").references(() => users.id).notNull(),
  inviteeId: integer("invitee_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default("co-host").notNull(), // co-host, guest
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, accepted, declined, expired
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
  token: text("token").notNull().unique(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  signature: text("signature").unique().notNull(),
  amount: text("amount").notNull(), // Using text for precision with large numbers
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // tip, subscription, etc.
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, confirmed, failed
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  livestreamId: integer("livestream_id").references(() => livestreams.id),
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

// For tracking pending QR code payments
export const pendingPayments = pgTable("pending_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tierId: varchar("tier_id", { length: 50 }).notNull(),
  expectedAmount: text("expected_amount").notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, confirmed, expired, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tierId: varchar("tier_id", { length: 50 }).notNull(), // free, pro, max
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, cancelled, expired, grace_period
  paymentMethod: varchar("payment_method", { length: 10 }).default("usdc"), // Only usdc supported
  amount: text("amount"), // Amount paid in USDC (6 decimal precision)
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  renewalEnabled: boolean("renewal_enabled").default(false),
  lastRenewalReminderSent: timestamp("last_renewal_reminder_sent"),
  gracePeriodEnds: timestamp("grace_period_ends"),
  transactionSignature: text("transaction_signature"), // Blockchain transaction signature
  featureAccess: jsonb("feature_access"), // Specific feature access controls
  usageMetrics: jsonb("usage_metrics"), // Track usage of limited features
  paymentDetails: jsonb("payment_details"), // Payment-specific details with USDC precision
  metadata: jsonb("metadata"), // Additional subscription data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stream Sessions model - for active and historical stream data
export const streamSessions = pgTable("stream_sessions", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").references(() => users.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  channelName: text("channel_name").notNull(),
  hostName: text("host_name").notNull(),
  streamTitle: text("stream_title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  tokenHost: text("token_host"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  viewerCount: integer("viewer_count").default(0),
  hostRole: varchar("host_role", { length: 20 }).default("host"),
  coverImagePath: text("cover_image_path"),
  streamType: varchar("stream_type", { length: 20 }).default("public"), // public, private, premium
  thumbnailUrl: text("thumbnail_url"),
  recordingUrl: text("recording_url"),
  audienceTokens: jsonb("audience_tokens").default([]),
  destination: text("destination").array(),  // List of destinations where stream is published
  coverImage: text("cover_image"),  // URL or base64 string of the cover image
  privacy: varchar("privacy", { length: 20 }).default("public"),  // public, unlisted, private
  scheduled: boolean("scheduled").default(false),  // If the stream is scheduled for later
  streamDate: timestamp("stream_date"),  // The date and time when the stream is scheduled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  avatarUrl: true,
  googleId: true,
  // Wallet fields
  walletAddress: true,
  walletProvider: true,
  role: true,
  isEmailVerified: true,
});

export const insertResearchSessionSchema = createInsertSchema(researchSessions).pick({
  userId: true,
  title: true,
  preview: true,
  category: true,
  icon: true,
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

export const insertPromptSuggestionSchema = createInsertSchema(promptSuggestions);

export const insertSiteConfigSchema = createInsertSchema(siteConfig).pick({
  logoUrl: true,
  siteName: true,
  primaryColor: true,
});

export const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  userId: true,
  title: true,
  description: true,
  channelName: true,
  status: true,
  scheduledFor: true,
  coverImageUrl: true,
  streamType: true,
  privacy: true,
});

export const insertLivestreamParticipantSchema = createInsertSchema(livestreamParticipants).pick({
  livestreamId: true,
  userId: true,
  role: true,
  agoraUid: true,
  displayName: true,
  avatarUrl: true,
});

export const insertLivestreamChatMessageSchema = createInsertSchema(livestreamChatMessages).pick({
  livestreamId: true,
  userId: true,
  content: true,
  isHighlighted: true,
  replyToId: true,
  metadata: true,
});

export const insertLivestreamInvitationSchema = createInsertSchema(livestreamInvitations).pick({
  livestreamId: true,
  inviterId: true,
  inviteeId: true,
  role: true,
  status: true,
  expiresAt: true,
  token: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).pick({
  userId: true,
  signature: true,
  amount: true,
  transactionType: true,
  status: true,
  fromAddress: true,
  toAddress: true,
  livestreamId: true,
  metadata: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions);

export const insertStreamSessionSchema = createInsertSchema(streamSessions).pick({
  userId: true,
  hostId: true,
  channelName: true,
  hostName: true,
  streamTitle: true,
  description: true,
  isActive: true,
  tokenHost: true,
  startedAt: true,
  endedAt: true,
  viewerCount: true,
  hostRole: true,
  coverImagePath: true,
  streamType: true,
  thumbnailUrl: true,
  recordingUrl: true,
  audienceTokens: true,
  destination: true,
  coverImage: true,
  privacy: true,
  scheduled: true,
  streamDate: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchSession = typeof researchSessions.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const infoGraphicSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
});
export type InfoGraphic = z.infer<typeof infoGraphicSchema>;

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

export type InsertPromptSuggestion = z.infer<typeof insertPromptSuggestionSchema>;
export type PromptSuggestion = typeof promptSuggestions.$inferSelect;

export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;

export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;
export type Livestream = typeof livestreams.$inferSelect;

export type InsertLivestreamParticipant = z.infer<typeof insertLivestreamParticipantSchema>;
export type LivestreamParticipant = typeof livestreamParticipants.$inferSelect;

export type InsertLivestreamChatMessage = z.infer<typeof insertLivestreamChatMessageSchema>;
export type LivestreamChatMessage = typeof livestreamChatMessages.$inferSelect;

export type InsertLivestreamInvitation = z.infer<typeof insertLivestreamInvitationSchema>;
export type LivestreamInvitation = typeof livestreamInvitations.$inferSelect;

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  researchSessions: many(researchSessions),
  messages: many(messages),
  uploads: many(uploadedFiles),
  livestreams: many(livestreams),
  participations: many(livestreamParticipants),
  chatMessages: many(livestreamChatMessages),
  sentInvitations: many(livestreamInvitations, { relationName: "inviter" }),
  receivedInvitations: many(livestreamInvitations, { relationName: "invitee" }),
  walletTransactions: many(walletTransactions),
  streamSessions: many(streamSessions),
  subscriptions: many(subscriptions),
  aiChats: many(aiChats),
  notepads: many(notepads),
}));

export const researchSessionsRelations = relations(researchSessions, ({ many }) => ({
  messages: many(messages),
  uploads: many(uploadedFiles)
}));

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

export const livestreamsRelations = relations(livestreams, ({ one, many }) => ({
  host: one(users, {
    fields: [livestreams.userId],
    references: [users.id],
  }),
  participants: many(livestreamParticipants),
  chatMessages: many(livestreamChatMessages),
  transactions: many(walletTransactions),
}));

export const livestreamParticipantsRelations = relations(livestreamParticipants, ({ one }) => ({
  livestream: one(livestreams, {
    fields: [livestreamParticipants.livestreamId],
    references: [livestreams.id],
  }),
  user: one(users, {
    fields: [livestreamParticipants.userId],
    references: [users.id],
  }),
}));

export const livestreamChatMessagesRelations = relations(livestreamChatMessages, ({ one }) => ({
  livestream: one(livestreams, {
    fields: [livestreamChatMessages.livestreamId],
    references: [livestreams.id],
  }),
  user: one(users, {
    fields: [livestreamChatMessages.userId],
    references: [users.id],
  }),
  replyTo: one(livestreamChatMessages, {
    fields: [livestreamChatMessages.replyToId],
    references: [livestreamChatMessages.id],
  }),
}));

export const livestreamInvitationsRelations = relations(livestreamInvitations, ({ one }) => ({
  livestream: one(livestreams, {
    fields: [livestreamInvitations.livestreamId],
    references: [livestreams.id],
  }),
  inviter: one(users, {
    fields: [livestreamInvitations.inviterId],
    references: [users.id],
  }),
  invitee: one(users, {
    fields: [livestreamInvitations.inviteeId],
    references: [users.id],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
  livestream: one(livestreams, {
    fields: [walletTransactions.livestreamId],
    references: [livestreams.id],
  }),
}));

export const streamSessionsRelations = relations(streamSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [streamSessions.userId],
    references: [users.id],
  }),
  host: one(users, {
    fields: [streamSessions.hostId],
    references: [users.id],
  }),
  participants: many(livestreamParticipants),
}));

// AI Chat Sessions table for storing host's chat sessions
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).default(""),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chat Messages table for storing messages within a chat session
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => aiChatSessions.id),
  role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legacy AI Chats table for backward compatibility
export const aiChats = pgTable("ai_chats", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notepads table for storing host's notes
export const notepads = pgTable("notepads", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  title: varchar("title", { length: 255 }).default(""),
  isDeleted: boolean("is_deleted").default(false),
  visualizations: jsonb("visualizations").default([]), // For storing charts, graphs, and other rich content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for new tables
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).pick({
  hostId: true,
  title: true,
  isDeleted: true,
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).pick({
  sessionId: true,
  role: true,
  content: true,
  isDeleted: true,
});

export const insertAiChatSchema = createInsertSchema(aiChats).pick({
  hostId: true,
  message: true,
  response: true,
  isDeleted: true,
});

export const insertNotepadSchema = createInsertSchema(notepads).pick({
  hostId: true,
  content: true,
  title: true,
  isDeleted: true,
  visualizations: true,
});

// Create types for new tables
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatSession = typeof aiChatSessions.$inferSelect;

export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;

export type InsertAiChat = z.infer<typeof insertAiChatSchema>;
export type AiChat = typeof aiChats.$inferSelect;

export type InsertNotepad = z.infer<typeof insertNotepadSchema>;
export type Notepad = typeof notepads.$inferSelect;

// Set up relations for AI chat sessions and messages
export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [aiChatSessions.hostId],
    references: [users.id],
  }),
  messages: many(aiChatMessages),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));

// Legacy relations
export const aiChatsRelations = relations(aiChats, ({ one }) => ({
  host: one(users, {
    fields: [aiChats.hostId],
    references: [users.id],
  }),
}));

export const notepadsRelations = relations(notepads, ({ one }) => ({
  host: one(users, {
    fields: [notepads.hostId],
    references: [users.id],
  }),
}));
