import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import connectPg from 'connect-pg-simple';
import multer from 'multer';
import { pool, db } from './db';
import { User as SelectUser, users, streamSessions, InsertStreamSession } from '@shared/schema';
import { eq, SQL } from 'drizzle-orm';
import { log } from './vite';
import { saveCoverImage } from './fileUpload';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for cover images
});

// Extend Express.User interface with our User type
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true,
});

const scryptAsync = promisify(scrypt);

// Password hashing function
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Password comparison function
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Get user by ID
async function getUserById(id: number): Promise<SelectUser | undefined> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error getting user by ID: ${errorMessage}`, 'error');
    return undefined;
  }
}

// Get user by username
async function getUserByUsername(username: string): Promise<SelectUser | undefined> {
  try {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error getting user by username: ${errorMessage}`, 'error');
    return undefined;
  }
}

// Get user by email
async function getUserByEmail(email: string): Promise<SelectUser | undefined> {
  if (!email) return undefined;
  
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error getting user by email: ${errorMessage}`, 'error');
    return undefined;
  }
}

// Interface for user creation data
interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
  role?: string;
  isEmailVerified?: boolean;
}

// Create user record
async function createUser(userData: CreateUserData): Promise<SelectUser> {
  try {
    // Hash the password before storing
    const hashedPassword = await hashPassword(userData.password);
    
    // Prepare user data with required fields
    const userToInsert = {
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as const; // Use const assertion to ensure type safety
    
    // Add optional fields if they exist
    const insertData = {
      ...userToInsert,
      ...(userData.email && { email: userData.email }),
      ...(userData.displayName && { displayName: userData.displayName }),
      ...(userData.isEmailVerified !== undefined && { isEmailVerified: userData.isEmailVerified }),
    };
    
    // Insert the user
    const [user] = await db.insert(users)
      .values(insertData)
      .returning();
    
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error creating user: ${errorMessage}`, 'error');
    throw new Error(`Failed to create user: ${errorMessage}`);
  }
}

// Function to check if a user already has a StreamSession
async function hasStreamSession(userId: number): Promise<boolean> {
  try {
    const sessions = await db.select({ id: streamSessions.id })
      .from(streamSessions)
      .where(eq(streamSessions.userId, userId))
      .limit(1);
    
    return sessions.length > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error checking stream session: ${errorMessage}`, 'error');
    return false;
  }
}

// Function to get user's stream session
async function getUserStreamSession(userId: number) {
  try {
    const sessions = await db.select()
      .from(streamSessions)
      .where(eq(streamSessions.userId, userId))
      .limit(1);
    
    if (sessions.length === 0) {
      return null;
    }
    
    return sessions[0];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error getting stream session: ${errorMessage}`, 'error');
    return null;
  }
}

// Function to create a StreamSession for a user
async function createStreamSession(user: SelectUser): Promise<void> {
  try {
    // Check if user already has a stream session
    const hasSession = await hasStreamSession(user.id);
    if (hasSession) {
      log(`User ${user.id} already has a stream session, skipping creation`, 'info');
      return;
    }
    
    // Just create a minimal stream session - the actual settings will be filled
    // when the user sets up their stream on the homepage
    await db.insert(streamSessions).values({
      hostId: user.id,
      userId: user.id, // same as host for creator
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    log(`Created stream session for user ${user.id}`, 'info');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error creating stream session: ${errorMessage}`, 'error');
    // We don't throw here to avoid disrupting the authentication flow
  }
}

// Auth middleware to check if user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Setup auth for Express app
export function setupAuth(app: Express) {
  // Add Google OAuth strategy if Firebase API key is available
  if (process.env.VITE_FIREBASE_API_KEY) {
    // We'll implement Google auth integration here
    // For now, we'll just have a mock endpoint for the frontend to work with
    app.get('/api/auth/google', (req, res) => {
      // In a real implementation, we would redirect to Google
      // For now, we'll simulate the flow by redirecting back with a success flag
      res.redirect('/?google_auth_success=true');
    });
  }
  // Session setup
  const sessionSettings: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'keyboard cat', // Use a proper secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    },
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'usernameOrEmail' },
      async (usernameOrEmail: string, password: string, done: Function) => {
        try {
          // Try to find by username first
          let user = await getUserByUsername(usernameOrEmail);
          
          // If not found, try by email
          if (!user) {
            user = await getUserByEmail(usernameOrEmail);
          }
          
          // User not found
          if (!user) {
            return done(null, false, { message: 'Incorrect username or email' });
          }
          
          // Check password
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Incorrect password' });
          }
          
          // Update last login time
          await db.update(users)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, user.id));
          
          // All good, return user
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // User serialization/deserialization for sessions
  passport.serializeUser((user: Express.User, done: Function) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: unknown, done: Function) => {
    try {
      // Handle potential issues with id type conversion
      let userId = typeof id === 'string' ? parseInt(id) : id as number;
      
      if (isNaN(userId)) {
        // If ID is invalid, clear the session instead of returning an error
        console.log(`Invalid user ID: ${id}, clearing session`);
        return done(null, false);
      }
      
      const user = await getUserById(userId);
      
      if (!user) {
        // If user not found, clear the session instead of returning an error
        console.log(`User not found for ID: ${userId}, clearing session`);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error('User deserialization error:', error);
      // Don't break the app, just clear the session
      done(null, false);
    }
  });

  // Auth routes
  
  // Register route
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, displayName } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
      }
      
      // Check if username or email already exists
      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      
      const existingEmail = await getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      
      // Create new user
      const user = await createUser({
        username,
        email,
        password,
        displayName: displayName || username,
        role: 'user',
        isEmailVerified: false,
      });
      
      // Create stream session for the new user
      await createStreamSession(user);
      
      // Log the user in automatically
      req.login(user, (err: Error | null) => {
        if (err) {
          log(`Error logging in after registration: ${err.message}`, 'error');
          return res.status(500).json({ error: 'Registration successful but failed to log in' });
        }
        res.status(201).json(user);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Registration error: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login route
  app.post('/api/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) {
        log(`Login error: ${err.message}`, 'error');
        return res.status(500).json({ error: 'Login failed' });
      }
      
      if (!user) {
        return res.status(401).json({ error: info.message || 'Invalid credentials' });
      }
      
      req.login(user, async (err: Error | null) => {
        if (err) {
          log(`Login session error: ${err.message}`, 'error');
          return res.status(500).json({ error: 'Login failed' });
        }
        
        // Create stream session if it doesn't exist
        await createStreamSession(user);
        
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/logout', (req: Request, res: Response) => {
    req.logout((err: Error | null) => {
      if (err) {
        log(`Logout error: ${err.message}`, 'error');
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Current user info route
  app.get('/api/user', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });
  
  // Check if user has a stream session
  app.get('/api/user/stream-session', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const hasSession = await hasStreamSession(req.user!.id);
      
      if (!hasSession) {
        // Create a stream session if one doesn't exist
        await createStreamSession(req.user!);
        return res.json({ hasStreamSession: true, newlyCreated: true });
      }
      
      return res.json({ hasStreamSession: true, newlyCreated: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error checking stream session: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to check stream session status' });
    }
  });
  
  // Get user's stream session data
  app.get('/api/user/stream-session/data', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get the user's stream session
      const session = await getUserStreamSession(req.user!.id);
      
      if (!session) {
        // Create a new session if one doesn't exist
        await createStreamSession(req.user!);
        // Fetch the newly created session
        const newSession = await getUserStreamSession(req.user!.id);
        return res.json(newSession);
      }
      
      return res.json(session);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error getting stream session data: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to get stream session data' });
    }
  });

  // Upload cover image for stream
  app.post('/api/user/stream-session/upload-cover', ensureAuthenticated, upload.single('coverImage'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No cover image provided' });
      }
      
      const userId = req.user!.id;
      
      // Save the cover image
      const coverImagePath = await saveCoverImage(req.file, userId);
      
      // Get the user's stream session
      const session = await getUserStreamSession(userId);
      
      if (!session) {
        return res.status(404).json({ error: 'Stream session not found' });
      }
      
      // Update the session with the new cover image using Drizzle ORM
      await db.update(streamSessions)
        .set({
          coverImage: coverImagePath,
          coverImagePath: coverImagePath,
          updatedAt: new Date()
        })
        .where(eq(streamSessions.id, session.id));
      
      // Return the updated cover image path
      return res.json({ coverImage: coverImagePath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error uploading cover image: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to upload cover image' });
    }
  });
  
  // Update stream session settings
  app.post('/api/user/stream-session/update', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        streamTitle,
        description,
        channelName,
        destination,
        coverImage,
        privacy,
        scheduled,
        streamDate
      } = req.body;
      
      // Get the user's stream session
      const session = await getUserStreamSession(userId);
      
      if (!session) {
        return res.status(404).json({ error: 'Stream session not found' });
      }
      
      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Add fields if they are provided
      if (streamTitle) updateData.streamTitle = streamTitle;
      if (description) updateData.description = description;
      if (channelName) updateData.channelName = channelName;
      if (destination) updateData.destination = destination;
      if (coverImage) updateData.coverImage = coverImage;
      if (privacy) updateData.privacy = privacy;
      if (scheduled !== undefined) updateData.scheduled = scheduled;
      if (streamDate) updateData.streamDate = new Date(streamDate);
      
      // Mark the host information
      updateData.hostId = userId;
      updateData.hostName = req.user!.username;
      
      // Update using Drizzle ORM
      await db.update(streamSessions)
        .set(updateData)
        .where(eq(streamSessions.id, session.id));
      
      // Get the updated session
      const updatedSession = await getUserStreamSession(userId);
      
      return res.json(updatedSession);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error updating stream session: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to update stream session' });
    }
  });
  
  // Update host token in stream session
  app.post('/api/user/stream-session/update-token', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { tokenHost } = req.body;
      
      if (!tokenHost) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      // Get the user's stream session
      const session = await getUserStreamSession(userId);
      
      if (!session) {
        return res.status(404).json({ error: 'Stream session not found' });
      }
      
      // Update the token using Drizzle ORM
      await db.update(streamSessions)
        .set({
          tokenHost: tokenHost,
          updatedAt: new Date()
        })
        .where(eq(streamSessions.id, session.id));
      
      return res.json({ success: true, message: 'Host token updated successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error updating host token: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to update host token' });
    }
  });
}
