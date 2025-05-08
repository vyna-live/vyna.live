CREATE TABLE "ai_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"title" varchar(255) DEFAULT '',
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"message" text NOT NULL,
	"response" text NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "livestream_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"livestream_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"is_highlighted" boolean DEFAULT false,
	"reply_to_id" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "livestream_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"livestream_id" integer NOT NULL,
	"inviter_id" integer NOT NULL,
	"invitee_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'co-host' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"expires_at" timestamp,
	"token" text NOT NULL,
	CONSTRAINT "livestream_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "livestream_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"livestream_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"is_active" boolean DEFAULT true,
	"agora_uid" integer,
	"display_name" text,
	"avatar_url" text
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"channel_name" text NOT NULL,
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"scheduled_for" timestamp,
	"cover_image_url" text,
	"stream_type" varchar(20) DEFAULT 'public' NOT NULL,
	"privacy" varchar(20) DEFAULT 'public' NOT NULL,
	"view_count" integer DEFAULT 0,
	"max_concurrent_viewers" integer DEFAULT 0,
	"recording_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "livestreams_channel_name_unique" UNIQUE("channel_name")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" integer,
	"content" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"has_info_graphic" boolean DEFAULT false,
	"info_graphic_data" jsonb,
	"title" text,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "notepads" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"content" text NOT NULL,
	"title" varchar(255) DEFAULT '',
	"is_deleted" boolean DEFAULT false,
	"visualizations" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"icon" text NOT NULL,
	"category" text DEFAULT 'general',
	"is_streaming" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "research_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"preview" text,
	"category" text DEFAULT 'research',
	"icon" text DEFAULT 'search',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"logo_url" text,
	"site_name" text DEFAULT 'vyna.live',
	"primary_color" text DEFAULT '#40C4D0',
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"channel_name" text NOT NULL,
	"host_name" text NOT NULL,
	"stream_title" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false,
	"token_host" text,
	"started_at" timestamp,
	"ended_at" timestamp,
	"viewer_count" integer DEFAULT 0,
	"host_role" varchar(20) DEFAULT 'host',
	"cover_image_path" text,
	"stream_type" varchar(20) DEFAULT 'public',
	"thumbnail_url" text,
	"recording_url" text,
	"audience_tokens" jsonb DEFAULT '[]'::jsonb,
	"destination" text[],
	"cover_image" text,
	"privacy" varchar(20) DEFAULT 'public',
	"scheduled" boolean DEFAULT false,
	"stream_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" integer,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"is_processed" boolean DEFAULT false,
	"processing_result" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"google_id" text,
	"wallet_address" text,
	"wallet_provider" varchar(50),
	"wallet_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_email_verified" boolean DEFAULT false,
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"signature" text NOT NULL,
	"amount" text NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"livestream_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "wallet_transactions_signature_unique" UNIQUE("signature")
);
--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_ai_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_chat_messages" ADD CONSTRAINT "livestream_chat_messages_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_chat_messages" ADD CONSTRAINT "livestream_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_invitations" ADD CONSTRAINT "livestream_invitations_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_invitations" ADD CONSTRAINT "livestream_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_invitations" ADD CONSTRAINT "livestream_invitations_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_participants" ADD CONSTRAINT "livestream_participants_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_participants" ADD CONSTRAINT "livestream_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_research_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notepads" ADD CONSTRAINT "notepads_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_session_id_research_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE no action ON UPDATE no action;