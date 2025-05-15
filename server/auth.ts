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
// Define bronze tier benefits directly to avoid import issues
const BRONZE_BENEFITS = {
  description: "Researcher Benefits",
  features: [
    "Access to basic AI research tools",
    "Track your research progress", 
    "Basic visualization tools",
    "Earn 5XP for every 15 research queries"
  ]
};

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
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
      ...(userData.verificationToken && { verificationToken: userData.verificationToken }),
      ...(userData.verificationExpires && { verificationExpires: userData.verificationExpires }),
      ...(userData.resetPasswordToken && { resetPasswordToken: userData.resetPasswordToken }),
      ...(userData.resetPasswordExpires && { resetPasswordExpires: userData.resetPasswordExpires }),
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
    
    // Create a minimal stream session with required fields
    // Generate a default channel name based on the user ID
    const defaultChannelName = `channel_${user.id}_${Date.now()}`;
    
    // Insert with required fields, the rest will be filled when user sets up stream
    const streamSessionData = {
      userId: user.id,
      hostId: user.id, // same as host for creator
      channelName: defaultChannelName, // Required field
      hostName: user.username || 'Host', // Required field
      streamTitle: `${user.username || 'Host'}'s Stream`, // Required field
      isActive: false,
      viewerCount: 0
    };
    
    await db.insert(streamSessions).values(streamSessionData);
    
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
      
      // Create loyalty pass for the new user directly using SQL
      try {
        // Insert a loyalty pass directly using SQL
        // For new users, we use the same ID for both streamer_id and audience_id
        const query = `
          INSERT INTO loyalty_passes 
          (streamer_id, audience_id, tier, xp_points, benefits)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const values = [
          user.id,
          user.id,  // Same ID for audience_id to satisfy NOT NULL constraint
          'bronze', // Bronze tier (Researcher level)
          5, // Award 5XP for initial signup
          JSON.stringify(BRONZE_BENEFITS)
        ];
        
        const { rows } = await pool.query(query, values);
        
        // Record the initial login activity
        const activityQuery = `
          INSERT INTO loyalty_activities 
          (user_id, activity_type, points_earned, description)
          VALUES ($1, $2, $3, $4)
        `;
        
        const activityValues = [
          user.id,
          'dailyLogin', // PointActivity.DAILY_LOGIN
          5,
          'Initial account creation'
        ];
        
        await pool.query(activityQuery, activityValues);
        
        log(`Created loyalty pass for new user ${user.id}`, 'info');
      } catch (loyaltyError) {
        // Don't fail registration if loyalty pass creation fails
        log(`Failed to create loyalty pass for new user: ${loyaltyError}`, 'error');
      }
      
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
        
        // Check if user is eligible for daily login reward
        try {
          const { hasLoyaltyPass, checkDailyLoginEligibility, awardPointsToUser } = require('./services/loyaltyService');
          const { PointActivity } = require('../shared/loyaltySchema');
          
          const userId = user.id;
          const hasPass = await hasLoyaltyPass(userId);
          
          if (hasPass) {
            // Check if eligible for daily login reward (24 hours have passed)
            const isEligible = await checkDailyLoginEligibility(userId);
            
            if (isEligible) {
              // Award points for daily login
              await awardPointsToUser(userId, PointActivity.DAILY_LOGIN, "Daily login reward");
              log(`Awarded daily login points to user ${userId}`, 'info');
            }
          }
        } catch (loyaltyError) {
          // Don't fail login if loyalty reward fails
          log(`Failed to process loyalty rewards: ${loyaltyError}`, 'error');
        }
        
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
  
  // Forgot password route - request password reset
  app.post('/api/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Find the user by email
      const user = await getUserByEmail(email);
      
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        // We'll still return a success message to prevent email enumeration attacks
        return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }
      
      // Generate a secure random token
      const token = randomBytes(32).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour
      
      // Store the token and expiry in the database
      await db.update(users)
        .set({
          resetPasswordToken: token,
          resetPasswordExpires: expiry,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      
      // Generate reset URL and send email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      
      // Import at the top level might cause circular dependencies
      const { sendPasswordResetEmail } = await import('./emailService');
      const emailSent = await sendPasswordResetEmail(email, resetUrl);
      
      if (!emailSent) {
        log(`Failed to send password reset email to ${email}`, 'error');
      }
      
      // Don't return token in production for security
      res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Forgot password error: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });
  
  // Verify reset token route - check if token is valid
  app.get('/api/verify-reset-token/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      // Find user with this token and check if it's expired
      const [user] = await db.select()
        .from(users)
        .where(eq(users.resetPasswordToken, token));
      
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ error: 'Invalid or expired password reset token' });
      }
      
      const now = new Date();
      if (now > user.resetPasswordExpires) {
        return res.status(400).json({ error: 'Password reset token has expired' });
      }
      
      // Token is valid
      res.status(200).json({ message: 'Token is valid', userId: user.id });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Verify reset token error: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to verify reset token' });
    }
  });
  
  // Reset password route - set new password
  app.post('/api/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      
      // Find user with this token and check if it's expired
      const [user] = await db.select()
        .from(users)
        .where(eq(users.resetPasswordToken, token));
      
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ error: 'Invalid or expired password reset token' });
      }
      
      const now = new Date();
      if (now > user.resetPasswordExpires) {
        return res.status(400).json({ error: 'Password reset token has expired' });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update the user's password and clear the reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      
      res.status(200).json({ message: 'Password has been reset successfully' });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Reset password error: ${errorMessage}`, 'error');
      res.status(500).json({ error: 'Failed to reset password' });
    }
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
