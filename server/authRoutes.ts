import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { hashPassword, comparePassword, isAuthenticated, getUserFromSession, setUserSession, clearUserSession } from "./auth";
import crypto from "crypto";

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

    // Check for pending invitations
    const pendingInvitations = await storage.getInvitationsByEmail(data.email);
    const pendingInvite = pendingInvitations.find(inv => inv.status === "pending");

    // Create user - we need organization info for the user record
    let user = await storage.upsertUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      password: hashedPassword,
      authProvider: "email",
      role: pendingInvite ? pendingInvite.role : "user",
      organizationId: pendingInvite ? pendingInvite.organizationId : undefined,
      currentOrganizationId: pendingInvite ? pendingInvite.organizationId : undefined,
    });

    // If there's a pending invitation, auto-accept it and add user to organization
    if (pendingInvite) {
      console.log(`[SIGNUP] Processing invitation for ${user.email} to organization ${pendingInvite.organizationId}`);

      // Add user to organization via userOrganizations junction table
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: pendingInvite.organizationId,
        role: pendingInvite.role,
        active: true,
      });

      // Mark invitation as accepted
      await storage.updateInvitationStatus(pendingInvite.id, "accepted", new Date());

      console.log(`[SIGNUP] User ${user.email} auto-assigned to organization ${pendingInvite.organizationId}`);

      // Reload user to ensure session has latest data
      user = await storage.getUser(user.id) || user;
    }

    // Set session
    setUserSession(req, user);
    console.log('[SIGNUP] Session before save:', { sessionID: req.sessionID, userId: req.session.userId });

    // Explicitly save session and handle errors
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[SIGNUP] Session save error:', err);
          reject(err);
        } else {
          console.log('[SIGNUP] Session saved successfully, ID:', req.sessionID);
          resolve();
        }
      });
    });

    console.log('[SIGNUP] Session after save:', { sessionID: req.sessionID, userId: req.session.userId });

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

    // Check for pending invitations and auto-accept on login
    const pendingInvitations = await storage.getInvitationsByEmail(data.email);
    const pendingInvite = pendingInvitations.find(inv => inv.status === "pending");

    if (pendingInvite) {
      console.log(`[LOGIN] Processing invitation for ${user.email} to organization ${pendingInvite.organizationId}`);

      // Check if user is not already in this organization
      const userOrgs = await storage.getUserOrganizations(user.id);
      const alreadyMember = userOrgs.some(org => org.organizationId === pendingInvite.organizationId);

      if (!alreadyMember) {
        // Add user to organization
        await storage.addUserToOrganization({
          userId: user.id,
          organizationId: pendingInvite.organizationId,
          role: pendingInvite.role,
          active: true,
        });

        // Update user's organization fields if not set
        if (!user.organizationId) {
          await storage.upsertUser({
            id: user.id,
            email: user.email,
            organizationId: pendingInvite.organizationId,
            currentOrganizationId: pendingInvite.organizationId,
          });
          user.organizationId = pendingInvite.organizationId;
          user.currentOrganizationId = pendingInvite.organizationId;
        } else if (!user.currentOrganizationId) {
          await storage.updateUserCurrentOrg(user.id, pendingInvite.organizationId);
          user.currentOrganizationId = pendingInvite.organizationId;
        }

        // Mark invitation as accepted
        await storage.updateInvitationStatus(pendingInvite.id, "accepted", new Date());

        console.log(`[LOGIN] User ${user.email} auto-assigned to organization ${pendingInvite.organizationId}`);
      } else {
        console.log(`[LOGIN] User ${user.email} already member of organization ${pendingInvite.organizationId}`);
      }
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

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const { email } = schema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Save token to database
    await storage.createPasswordResetToken({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Send password reset email
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetUrl = `${appUrl}/reset-password/${token}`;

    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const fromAddress = `RoomRoute <${senderEmail}>`;

    const subject = "Reset Your Password - RoomRoute";
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hi ${user.firstName || 'there'},</p>
        <p>We received a request to reset your password for your RoomRoute account.</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
        <p style="margin-top: 30px;">This link will expire in 30 minutes.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated email from RoomRoute. Please do not reply to this email.
        </p>
      </div>
    `;

    if (!process.env.RESEND_API_KEY) {
      console.log("Password reset email (Resend not configured):", {
        to: email,
        resetUrl,
        expiresAt,
      });
    } else {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject,
        html: htmlBody,
      });

      console.log(`✅ Password reset email sent to ${email}`);
    }

    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(1, "Token is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const { token, password } = schema.parse(req.body);

    // Get reset token from database
    const resetToken = await storage.getPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Get user
    const user = await storage.getUser(resetToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await storage.upsertUser({
      id: user.id,
      email: user.email,
      password: hashedPassword,
    });

    // Mark token as used
    await storage.markPasswordResetTokenAsUsed(token);

    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

export default router;
