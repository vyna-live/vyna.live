import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import connectPg from 'connect-pg-simple';
import { pool, db } from './db';
import { User as SelectUser, users } from '@shared/schema';
import { eq, SQL } from 'drizzle-orm';
import { log } from './vite';

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

// Auth middleware to check if user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Setup auth for Express app
export function setupAuth(app: Express) {
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

  passport.deserializeUser(async (id: number, done: Function) => {
    try {
      const user = await getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
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
      
      req.login(user, (err: Error | null) => {
        if (err) {
          log(`Login session error: ${err.message}`, 'error');
          return res.status(500).json({ error: 'Login failed' });
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

  // Current user info route
  app.get('/api/user', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });
}
