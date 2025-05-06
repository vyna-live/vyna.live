import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// CORS headers for all extension routes
router.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Login endpoint for extension
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "Username/email and password are required" });
    }
    
    // Find user by username or email
    const user = await db.select()
      .from(users)
      .where(
        usernameOrEmail.includes('@') 
          ? eq(users.email, usernameOrEmail) 
          : eq(users.username, usernameOrEmail)
      )
      .limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // For simplicity, we're using a direct comparison - in real app, use proper password hashing
    const validPassword = user[0].password === password;
    
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Create a simple session token - in real app, use JWT or other secure method
    const sessionToken = Buffer.from(`${user[0].id}:${Date.now()}`).toString('base64');
    
    res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        displayName: user[0].displayName,
        role: user[0].role
      }
    });
  } catch (error) {
    console.error("Extension login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register endpoint for extension
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    // Check if username or email already exists
    const existingUser = await db.select()
      .from(users)
      .where(
        email 
          ? eq(users.email, email) 
          : eq(users.username, username)
      )
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    
    // Create new user
    const [newUser] = await db.insert(users)
      .values({
        username,
        email: email || null,
        password,
        displayName: displayName || username,
        role: 'user',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Create a simple session token
    const sessionToken = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
    
    res.status(201).json({
      success: true,
      token: sessionToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Extension registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify user endpoint for extension
router.get('/user', async (req: Request, res: Response) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Decode the base64 token
    try {
      const decodedToken = Buffer.from(token, 'base64').toString();
      const [userId, timestamp] = decodedToken.split(':');
      
      // Find user by ID
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      });
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Extension user endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;