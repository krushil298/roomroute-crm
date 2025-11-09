import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { hashPassword, comparePassword, isAuthenticated, getUserFromSession, setUserSession, clearUserSession } from "./auth";

const router = Router();

// Validation schemas
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  birthday: z.string().optional(), // ISO date string
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await storage.upsertUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      password: hashedPassword,
      authProvider: "email",
      role: "user",
    });

    // Set session
    setUserSession(req, user);

    // Explicitly save session and handle errors
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Signup error:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      message: "Failed to create account",
      error: errorMessage,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set session
    setUserSession(req, user);

    // Explicitly save session and handle errors
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  clearUserSession(req);
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/user
router.get("/user", isAuthenticated, async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // For super admins, check if their currentOrganizationId points to an archived org
    if (user.role === "super_admin" && user.currentOrganizationId) {
      const currentOrg = await storage.getOrganization(user.currentOrganizationId);

      // If current org is archived or not found, switch to first active org
      if (!currentOrg || currentOrg.active === false) {
        const activeOrgs = await storage.getAllOrganizations();
        if (activeOrgs.length > 0) {
          await storage.updateUserCurrentOrg(user.id, activeOrgs[0].id);
          const updatedUser = await storage.getUser(user.id);
          if (updatedUser) {
            const { password: _, ...userWithoutPassword } = updatedUser;
            return res.json({ ...userWithoutPassword, hasOrganizationMembership: true });
          }
        }
      }
    }

    // Check if user is a member of any ACTIVE organization
    let hasOrganizationMembership = false;
    if (user.role !== "super_admin") {
      const memberships = await storage.getUserOrganizations(user.id);
      hasOrganizationMembership = memberships.some(m => m.active);
    }

    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, hasOrganizationMembership });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
