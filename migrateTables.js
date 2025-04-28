// Script to apply schema changes to database
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

// Setup WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Applying schema changes...');
  try {
    await db.execute(`
      -- Add wallet columns to users table if they don't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_address') THEN
          ALTER TABLE users ADD COLUMN wallet_address text UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_provider') THEN
          ALTER TABLE users ADD COLUMN wallet_provider varchar(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_connected_at') THEN
          ALTER TABLE users ADD COLUMN wallet_connected_at timestamp;
        END IF;
      END $$;
      
      -- Create livestreams table if it doesn't exist
      CREATE TABLE IF NOT EXISTS livestreams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        channel_name TEXT NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'offline' NOT NULL,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        scheduled_for TIMESTAMP,
        cover_image_url TEXT,
        privacy VARCHAR(20) DEFAULT 'public' NOT NULL,
        view_count INTEGER DEFAULT 0,
        max_concurrent_viewers INTEGER DEFAULT 0,
        recording_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      -- Create livestream_participants table if it doesn't exist
      CREATE TABLE IF NOT EXISTS livestream_participants (
        id SERIAL PRIMARY KEY,
        livestream_id INTEGER NOT NULL REFERENCES livestreams(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role VARCHAR(20) DEFAULT 'viewer' NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
        left_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        agora_uid INTEGER,
        display_name TEXT,
        avatar_url TEXT
      );
      
      -- Create livestream_chat_messages table if it doesn't exist
      CREATE TABLE IF NOT EXISTS livestream_chat_messages (
        id SERIAL PRIMARY KEY,
        livestream_id INTEGER NOT NULL REFERENCES livestreams(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_deleted BOOLEAN DEFAULT FALSE,
        is_highlighted BOOLEAN DEFAULT FALSE,
        reply_to_id INTEGER REFERENCES livestream_chat_messages(id),
        metadata JSONB
      );
      
      -- Create livestream_invitations table if it doesn't exist
      CREATE TABLE IF NOT EXISTS livestream_invitations (
        id SERIAL PRIMARY KEY,
        livestream_id INTEGER NOT NULL REFERENCES livestreams(id),
        inviter_id INTEGER NOT NULL REFERENCES users(id),
        invitee_id INTEGER NOT NULL REFERENCES users(id),
        role VARCHAR(20) DEFAULT 'co-host' NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        invited_at TIMESTAMP DEFAULT NOW() NOT NULL,
        responded_at TIMESTAMP,
        expires_at TIMESTAMP,
        token TEXT NOT NULL UNIQUE
      );
      
      -- Create wallet_transactions table if it doesn't exist
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        signature TEXT UNIQUE NOT NULL,
        amount TEXT NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        livestream_id INTEGER REFERENCES livestreams(id),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        confirmed_at TIMESTAMP
      );
    `);
    
    console.log('Schema changes applied successfully!');
  } catch (error) {
    console.error('Error applying schema changes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);