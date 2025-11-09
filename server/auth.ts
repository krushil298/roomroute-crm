import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Password hashing utilities
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Session user type
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: User;
  }
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Get user from session
export async function getUserFromSession(req: Request): Promise<User | null> {
  if (!req.session?.userId) {
    return null;
  }

  const user = await storage.getUser(req.session.userId);
  return user || null;
}

// Set user session
export function setUserSession(req: Request, user: User) {
  req.session.userId = user.id;
  req.session.user = user;
}

// Clear user session
export function clearUserSession(req: Request) {
  req.session.userId = undefined;
  req.session.user = undefined;
}
