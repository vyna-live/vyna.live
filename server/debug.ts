// Debugging utilities for Vyna.live

import { Request, Response, NextFunction } from 'express';
import { log } from './vite';

// Debug middleware to log all auth-related information
export function debugAuth(req: Request, res: Response, next: NextFunction) {
  // Log all cookies
  log(`REQUEST COOKIES: ${JSON.stringify(req.cookies)}`, 'auth-debug');
  
  // Log auth status
  log(`AUTHENTICATED: ${req.isAuthenticated()}`, 'auth-debug');
  
  // Log session
  if (req.session) {
    log(`SESSION ID: ${req.session.id}`, 'auth-debug');
    log(`SESSION DATA: ${JSON.stringify(req.session)}`, 'auth-debug');
  }
  
  // Log user if authenticated
  if (req.isAuthenticated() && req.user) {
    log(`USER: ${JSON.stringify(req.user)}`, 'auth-debug');
  }
  
  next();
}

// Debug middleware to log request information
export function debugRequest(req: Request, res: Response, next: NextFunction) {
  log(`${req.method} ${req.url}`, 'request-debug');
  log(`HEADERS: ${JSON.stringify(req.headers)}`, 'request-debug');
  
  if (req.method !== 'GET') {
    log(`BODY: ${JSON.stringify(req.body)}`, 'request-debug');
  }
  
  next();
}
