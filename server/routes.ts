import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, getUserFromSession } from "./auth";
import authRoutes from "./authRoutes";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { z } from "zod";
import {
  insertContactSchema,
  insertDealSchema,
  insertActivitySchema,
  insertContractTemplateSchema,
  insertEmailTemplateSchema,
  insertOrganizationSchema,
  updateOrganizationSchema,
  type InsertActivity,
} from "@shared/schema";

// Helper function to get user from request
async function getUserFromRequest(req: any): Promise<any> {
  return await getUserFromSession(req);
}

// Helper function to get effective organization ID
// For super_admin: use currentOrganizationId
// For regular users: use organizationId
function getEffectiveOrgId(user: any): string | undefined {
  if (user?.role === "super_admin") {
    return user.currentOrganizationId || undefined;
  }
  return user?.organizationId;
}

// Helper function to construct sender name for emails
// Handles null values properly and has special case for super admin
function getSenderName(user: any): string {
  // Special handling for super admin
  if (user?.email === "josh.gaddis@roomroute.org" || user?.role === "super_admin") {
    return "Josh Gaddis";
  }
  
  // For other users, construct name from firstName and lastName if available
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else if (user?.email) {
    return user.email;
  }
  
  return "RoomRoute Team";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
  const sessionTtlSeconds = 7 * 24 * 60 * 60; // 1 week in seconds
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL!,
    createTableIfMissing: false,
    ttl: sessionTtlSeconds, // TTL must be in seconds, not milliseconds
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'lax' : 'lax',
      maxAge: sessionTtlMs, // maxAge is in milliseconds
    },
    name: 'connect.sid',
  }));

  // Initialize Passport for Google OAuth only if configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { default: passport, initializeGoogleAuth } = await import("./googleAuth");
    app.use(passport.initialize());
    initializeGoogleAuth();
    console.log("✅ Google OAuth enabled");
  }

  // Mount auth routes
  app.use("/api/auth", authRoutes);

  // Legacy auth route - keep for backward compatibility but will be removed
  app.get("/api/auth/user-old", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Try to get user by ID first, then fall back to email
      // This handles the case where OIDC sub changes but email stays the same
      let user = await storage.getUser(userId);
      if (!user && userEmail) {
        user = await storage.getUserByEmail(userEmail);
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // For super admins, check if their currentOrganizationId points to an archived org
      if (user?.role === "super_admin" && user.currentOrganizationId) {
        const currentOrg = await storage.getOrganization(user.currentOrganizationId);
        
        // If current org is archived or not found, switch to first active org
        if (!currentOrg || currentOrg.active === false) {
          const activeOrgs = await storage.getAllOrganizations();
          if (activeOrgs.length > 0) {
            await storage.updateUserCurrentOrg(user.id, activeOrgs[0].id);
            user = await storage.getUser(user.id);
          }
        }
      }
      
      // Check if user is a member of any ACTIVE organization (for invited users)
      let hasOrganizationMembership = false;
      if (user && user.role !== "super_admin") {
        const memberships = await storage.getUserOrganizations(user.id);
        // Only count active memberships to prevent login loops for deactivated users
        hasOrganizationMembership = memberships.some(m => m.active);
      }
      
      res.json({ 
        ...user, 
        hasOrganizationMembership 
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const { firstName, lastName } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      const updatedUser = await storage.upsertUser({
        id: user.id,
        ...updateData
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Organization onboarding endpoint
  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      if (user?.organizationId) {
        return res.status(400).json({ error: "User already has an organization" });
      }

      const validated = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(validated);
      await storage.updateUserOrganization(user.id, org.id);
      
      // Auto-assign 'admin' role to organization creator
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: org.id,
        role: "admin",
        active: true,
      });
      
      res.status(201).json(org);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ error: "Failed to create organization" });
    }
  });

  // Get organization profile
  app.get("/api/organization/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization profile" });
    }
  });

  // Update organization profile
  app.patch("/api/organization/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      
      console.log("Organization update request body:", JSON.stringify(req.body, null, 2));
      
      // Validate request body with update organization schema
      const validated = updateOrganizationSchema.parse(req.body);
      
      console.log("Validated organization data:", JSON.stringify(validated, null, 2));
      
      const updatedOrg = await storage.updateOrganization(orgId, validated);
      
      if (!updatedOrg) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error: any) {
      console.error("Error updating organization:", error);
      if (error.errors) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      const errorMessage = error.errors?.[0]?.message || error.message || "Failed to update organization profile";
      res.status(400).json({ 
        error: errorMessage,
        details: error.errors || undefined
      });
    }
  });

  // Team Management Routes
  app.get("/api/team", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const teamMembers = await storage.getOrganizationUsers(orgId);
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/team/invite", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const isSuperAdmin = user?.role === "super_admin";
      
      // Validate request body with Zod
      const inviteSchema = z.object({
        email: z.string().email("Valid email address is required"),
        role: z.enum(["user", "admin"]).optional().default("user"),
        organizationId: z.string().optional(),
      });
      
      const validated = inviteSchema.parse(req.body);
      const { email, role, organizationId } = validated;

      // Determine target organization
      let targetOrgId: string | undefined;
      let org: any = null;
      
      if (isSuperAdmin) {
        // Super admin can optionally provide organizationId
        // If provided: invite to existing org (auto-assign on login)
        // If not provided: invite as new user (they'll create their own org)
        targetOrgId = organizationId;
        if (targetOrgId) {
          org = await storage.getOrganization(targetOrgId);
          if (!org) {
            return res.status(404).json({ error: "Organization not found" });
          }
        }
      } else {
        // Regular users: use their effective org (ignore organizationId from request for security)
        targetOrgId = getEffectiveOrgId(user);
        if (!targetOrgId) {
          return res.status(403).json({ error: "No organization" });
        }
        
        // SECURITY: Only organization admins (not regular users) can invite team members
        const userMemberships = await storage.getUserOrganizations(user.id);
        const currentOrgMembership = userMemberships.find(m => m.organizationId === targetOrgId);
        if (!currentOrgMembership || currentOrgMembership.role !== "admin") {
          return res.status(403).json({ error: "Only organization admins can invite team members" });
        }
        
        // Get organization details for the invitation email
        org = await storage.getOrganization(targetOrgId);
        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Construct sender name using helper function
      const senderName = getSenderName(user);
      
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const fromAddress = `${senderName} <${senderEmail}>`;
      const replyToEmail = user.email || undefined;
      
      // Create invitation email content - different for org invites vs general invites
      // Use APP_URL if set (production), otherwise fall back to localhost for development
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const loginUrl = `${baseUrl}/login`;
      
      let subject: string;
      let htmlBody: string;
      
      if (org) {
        // Invite to specific organization
        subject = `You're invited to join ${org.name} on RoomRoute`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to join ${org.name}</h2>
            <p>Hi,</p>
            <p>${senderName} has invited you to join <strong>${org.name}</strong> on RoomRoute as a <strong>${role || 'user'}</strong>.</p>
            <p>RoomRoute is a CRM platform designed for hotels and hospitality businesses to manage contacts, deals, and sales pipelines.</p>
            <p style="margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Log in to RoomRoute
              </a>
            </p>
            <p>If you don't have an account yet, you can sign up using this email address (${email}).</p>
            <p>Once you log in, you'll automatically be added to ${org.name}.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, reply to this email to reach ${senderName}.
            </p>
          </div>
        `;
      } else {
        // General invitation (super admin inviting new user without org)
        subject = `You're invited to RoomRoute`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to RoomRoute</h2>
            <p>Hi,</p>
            <p>${senderName} has invited you to join RoomRoute.</p>
            <p>RoomRoute is a CRM platform designed for hotels and hospitality businesses to manage contacts, deals, and sales pipelines.</p>
            <p style="margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Log in to RoomRoute
              </a>
            </p>
            <p>If you don't have an account yet, you can sign up using this email address (${email}).</p>
            <p>Once you log in, you'll be able to set up your hotel organization and start managing your contacts and deals.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, reply to this email to reach ${senderName}.
            </p>
          </div>
        `;
      }

      if (!process.env.RESEND_API_KEY) {
        console.log("Team invitation email (Resend not configured):", { 
          from: fromAddress,
          to: email,
          subject,
          role: role || 'user',
          organization: org?.name || 'No organization (general invite)'
        });
        
        // Only create invitation record if inviting to specific organization
        if (targetOrgId) {
          await storage.createInvitation({
            email,
            organizationId: targetOrgId,
            role: role || "user",
            invitedBy: user.id,
          });
        }
        
        return res.json({ 
          success: true, 
          message: `Invitation logged for ${email} (Resend not configured)`,
          email,
          role: role || "user" 
        });
      }

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: fromAddress,
        replyTo: replyToEmail,
        to: [email],
        subject: subject,
        html: htmlBody,
      });

      // Only create invitation record if inviting to specific organization
      // General invites (no org) will go through normal onboarding
      if (targetOrgId) {
        await storage.createInvitation({
          email,
          organizationId: targetOrgId,
          role: role || "user",
          invitedBy: user.id,
        });
      }

      const logMessage = targetOrgId 
        ? `✅ Team invitation sent - From: ${fromAddress} | To: ${email} | Org: ${org.name} | Role: ${role || 'user'}`
        : `✅ General invitation sent - From: ${fromAddress} | To: ${email} | (User will create their own organization)`;
      console.log(logMessage);
      
      res.json({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        email,
        role: role || "user" 
      });
    } catch (error: any) {
      console.error("Team invitation error:", error);
      res.status(500).json({ 
        error: "Failed to send invitation",
        details: error.message 
      });
    }
  });

  app.delete("/api/team/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      await storage.removeUserFromOrganization(req.params.userId, orgId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  app.post("/api/team/:userId/reactivate", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      
      const targetUserId = req.params.userId;
      await storage.updateUserOrganizationStatus(targetUserId, orgId, true);
      
      res.json({ success: true, message: "User reactivated successfully" });
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ error: "Failed to reactivate user" });
    }
  });

  // Invitation Management Routes
  app.get("/api/team/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const isSuperAdmin = user?.role === "super_admin";
      
      if (isSuperAdmin) {
        // Super admins can see all invitations across all organizations
        const allInvitations = await storage.getAllInvitations();
        return res.json(allInvitations);
      } else {
        // Regular users see invitations for their organization
        const orgId = getEffectiveOrgId(user);
        if (!orgId) {
          return res.status(403).json({ error: "No organization" });
        }
        const invitations = await storage.getInvitationsByOrganization(orgId);
        return res.json(invitations);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.post("/api/team/invitations/:id/resend", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const invitationId = req.params.id;
      
      // Get the invitation to resend
      const allInvitations = await storage.getAllInvitations();
      const invitation = allInvitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Check permissions
      const isSuperAdmin = user?.role === "super_admin";
      const orgId = getEffectiveOrgId(user);
      
      if (!isSuperAdmin && invitation.organizationId !== orgId) {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      // Get organization details
      const org = await storage.getOrganization(invitation.organizationId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      // Construct sender info using helper function
      const senderName = getSenderName(user);
      
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const fromAddress = `${senderName} <${senderEmail}>`;
      const replyToEmail = user.email || undefined;
      
      // Create email content
      // Use APP_URL if set (production), otherwise fall back to localhost for development
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const loginUrl = `${baseUrl}/login`;
      
      const subject = `You're invited to join ${org.name} on RoomRoute`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${org.name}</h2>
          <p>Hi,</p>
          <p>${senderName} has invited you to join <strong>${org.name}</strong> on RoomRoute as a <strong>${invitation.role}</strong>.</p>
          <p>RoomRoute is a CRM platform designed for hotels and hospitality businesses to manage contacts, deals, and sales pipelines.</p>
          <p style="margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log in to RoomRoute
            </a>
          </p>
          <p>If you don't have an account yet, you can sign up using this email address (${invitation.email}).</p>
          <p>Once you log in, you'll automatically be added to ${org.name}.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, reply to this email to reach ${senderName}.
          </p>
        </div>
      `;
      
      if (!process.env.RESEND_API_KEY) {
        console.log("Resend invitation email (Resend not configured):", { 
          from: fromAddress,
          to: invitation.email,
          subject,
        });
        return res.json({ success: true, message: `Invitation resend logged for ${invitation.email} (Resend not configured)` });
      }
      
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: fromAddress,
        replyTo: replyToEmail,
        to: [invitation.email],
        subject: subject,
        html: htmlBody,
      });
      
      console.log(`✅ Invitation resent - To: ${invitation.email} | Org: ${org.name}`);
      res.json({ success: true, message: `Invitation resent to ${invitation.email}` });
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation", details: error.message });
    }
  });

  app.delete("/api/team/invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const invitationId = req.params.id;
      
      // Get the invitation to check permissions
      const allInvitations = await storage.getAllInvitations();
      const invitation = allInvitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Check permissions
      const isSuperAdmin = user?.role === "super_admin";
      const orgId = getEffectiveOrgId(user);
      
      if (!isSuperAdmin && invitation.organizationId !== orgId) {
        return res.status(403).json({ error: "Permission denied" });
      }
      
      // Cancel the invitation
      await storage.cancelInvitation(invitationId);
      res.json({ success: true, message: "Invitation cancelled" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  });

  // Super Admin Routes
  app.get("/api/admin/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const orgs = await storage.getAllOrganizations();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/admin/switch-org", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { organizationId } = req.body;
      if (!organizationId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      await storage.updateUserCurrentOrg(user.id, organizationId);
      res.json({ message: "Organization context switched", organizationId });
    } catch (error) {
      res.status(500).json({ error: "Failed to switch organization" });
    }
  });

  app.patch("/api/admin/organizations/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "Active status required (boolean)" });
      }

      const org = await storage.updateOrganization(req.params.id, { active });
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json({ message: "Organization status updated", organization: org });
    } catch (error) {
      res.status(500).json({ error: "Failed to update organization status" });
    }
  });

  // NUCLEAR CLEANUP - Super Admin Only - Deletes ALL data except Josh's super admin account
  app.post("/api/admin/nuclear-cleanup", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden - Super admin only" });
      }
      
      // Additional safety check - must provide confirmation key
      if (req.body.confirmationKey !== "DELETE_EVERYTHING_EXCEPT_JOSH") {
        return res.status(400).json({ error: "Confirmation key required" });
      }

      console.log("🚨 NUCLEAR CLEANUP INITIATED by", user.email);
      
      // Execute cleanup via storage method
      const result = await storage.nuclearCleanup();
      
      console.log("✅ NUCLEAR CLEANUP COMPLETED:", result);
      
      res.json({ 
        message: "Nuclear cleanup completed successfully", 
        result 
      });
    } catch (error) {
      console.error("❌ Nuclear cleanup failed:", error);
      res.status(500).json({ error: "Failed to execute nuclear cleanup" });
    }
  });

  // Super Admin Roll-Up Stats
  app.get("/api/admin/rollup-stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get all active organizations
      const organizations = await storage.getAllOrganizations();
      
      // Aggregate deals across all organizations
      const allDealsPromises = organizations.map(org => storage.getAllDeals(org.id));
      const dealsArrays = await Promise.all(allDealsPromises);
      const allDeals = dealsArrays.flat();
      
      // Aggregate contacts across all organizations
      const allContactsPromises = organizations.map(org => storage.getAllContacts(org.id));
      const contactsArrays = await Promise.all(allContactsPromises);
      const allContacts = contactsArrays.flat();
      
      // Aggregate activities across all organizations
      const allActivitiesPromises = organizations.map(org => storage.getAllActivities(org.id));
      const activitiesArrays = await Promise.all(allActivitiesPromises);
      const allActivities = activitiesArrays.flat();
      
      // Calculate pipeline stats
      const pipelineStats = {
        leads: {
          count: allContacts.length,
          value: allContacts.reduce((sum, c) => sum + Number(c.potentialValue || 0), 0)
        },
        qualified: {
          count: allDeals.filter(d => d.stage.toLowerCase() === 'qualified').length,
          value: allDeals.filter(d => d.stage.toLowerCase() === 'qualified').reduce((sum, d) => sum + Number(d.value || 0), 0)
        },
        proposal: {
          count: allDeals.filter(d => d.stage.toLowerCase() === 'proposal').length,
          value: allDeals.filter(d => d.stage.toLowerCase() === 'proposal').reduce((sum, d) => sum + Number(d.value || 0), 0)
        },
        negotiation: {
          count: allDeals.filter(d => d.stage.toLowerCase() === 'negotiation').length,
          value: allDeals.filter(d => d.stage.toLowerCase() === 'negotiation').reduce((sum, d) => sum + Number(d.value || 0), 0)
        },
        closed: {
          count: allDeals.filter(d => d.stage.toLowerCase() === 'closed').length,
          value: allDeals.filter(d => d.stage.toLowerCase() === 'closed').reduce((sum, d) => sum + Number(d.value || 0), 0)
        }
      };
      
      res.json({
        activeHotels: organizations.length,
        totalOutreachAttempts: allActivities.length,
        pipeline: pipelineStats,
      });
    } catch (error) {
      console.error("Error fetching rollup stats:", error);
      res.status(500).json({ error: "Failed to fetch rollup statistics" });
    }
  });

  // Contact routes
  app.get("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const contacts = await storage.getAllContacts(orgId);

      // Enrich with creator information
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          const creatorName = contact.createdBy
            ? await storage.getUser(contact.createdBy).then(u => u ? `${u.firstName} ${u.lastName}` : null)
            : null;
          const updaterName = contact.updatedBy
            ? await storage.getUser(contact.updatedBy).then(u => u ? `${u.firstName} ${u.lastName}` : null)
            : null;

          return {
            ...contact,
            creatorName,
            updaterName,
          };
        })
      );

      res.json(enrichedContacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const contact = await storage.getContact(req.params.id, orgId);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      // Validate request body (organizationId already omitted from insertContactSchema)
      const validated = insertContactSchema.parse(req.body);
      
      // Add server-side organizationId and createdBy (security: prevent client from setting these)
      const contact = await storage.createContact({
        ...validated,
        organizationId: orgId,
        createdBy: user.id,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Contact creation error:", error);
      res.status(400).json({ error: "Invalid contact data" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      // Validate partial updates (organizationId already omitted from insertContactSchema)
      const validated = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, orgId, {
        ...validated,
        updatedBy: user.id,
      });
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      await storage.deleteContact(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.post("/api/contacts/import", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const { contacts } = req.body;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: "Contacts must be an array" });
      }
      
      console.log(`Importing ${contacts.length} contacts`);
      console.log('Sample contact:', JSON.stringify(contacts[0], null, 2));
      
      const validated = contacts.map((c, index) => {
        try {
          const parsed = insertContactSchema.parse(c);
          return {
            ...parsed,
            organizationId: orgId,
          };
        } catch (validationError: any) {
          console.error(`Validation error for contact at index ${index}:`, validationError);
          console.error('Contact data:', c);
          throw new Error(`Row ${index + 1}: ${validationError.message || validationError.errors?.[0]?.message || 'Invalid data'}`);
        }
      });
      
      console.log('Validated contacts (first one):', JSON.stringify(validated[0], null, 2));
      
      const imported = await storage.importContacts(validated);
      res.status(201).json(imported);
    } catch (error: any) {
      console.error('Import error:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ 
        error: error.message || "Invalid contact data",
        details: error.errors || undefined
      });
    }
  });

  // Deal routes
  app.get("/api/deals", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const deals = await storage.getAllDeals(orgId);

      // Enrich with creator information
      const enrichedDeals = await Promise.all(
        deals.map(async (deal) => {
          const creatorName = deal.createdBy
            ? await storage.getUser(deal.createdBy).then(u => u ? `${u.firstName} ${u.lastName}` : null)
            : null;
          const updaterName = deal.updatedBy
            ? await storage.getUser(deal.updatedBy).then(u => u ? `${u.firstName} ${u.lastName}` : null)
            : null;

          return {
            ...deal,
            creatorName,
            updaterName,
          };
        })
      );

      res.json(enrichedDeals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const deal = await storage.getDeal(req.params.id, orgId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  app.get("/api/contacts/:contactId/deals", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const deals = await storage.getDealsByContact(req.params.contactId, orgId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertDealSchema.parse(req.body);
      
      // Convert expectedCloseDate and actionDate strings to Date if present
      const dealData = {
        ...validated,
        organizationId: orgId,
        createdBy: user.id,
        expectedCloseDate: validated.expectedCloseDate
          ? (typeof validated.expectedCloseDate === 'string'
              ? new Date(validated.expectedCloseDate)
              : validated.expectedCloseDate)
          : null,
        actionDate: validated.actionDate
          ? (typeof validated.actionDate === 'string'
              ? new Date(validated.actionDate)
              : validated.actionDate)
          : null,
      };

      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      res.status(400).json({ error: "Invalid deal data" });
    }
  });

  app.patch("/api/deals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      
      // Convert expectedCloseDate and actionDate strings to Date if present
      const updateData = {
        ...req.body,
        updatedBy: user.id,
        expectedCloseDate: req.body.expectedCloseDate !== undefined
          ? (req.body.expectedCloseDate === null
              ? null
              : (typeof req.body.expectedCloseDate === 'string'
                  ? new Date(req.body.expectedCloseDate)
                  : req.body.expectedCloseDate))
          : undefined,
        actionDate: req.body.actionDate !== undefined
          ? (req.body.actionDate === null
              ? null
              : (typeof req.body.actionDate === 'string'
                  ? new Date(req.body.actionDate)
                  : req.body.actionDate))
          : undefined,
      };

      const deal = await storage.updateDeal(req.params.id, orgId, updateData);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      await storage.deleteDeal(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const activities = await storage.getAllActivities(orgId);

      // Enrich with creator information
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          const creatorName = activity.createdBy
            ? await storage.getUser(activity.createdBy).then(u => u ? `${u.firstName} ${u.lastName}` : null)
            : null;

          return {
            ...activity,
            creatorName,
          };
        })
      );

      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/contacts/:contactId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const activities = await storage.getActivitiesByContact(req.params.contactId, orgId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/deals/:dealId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const activities = await storage.getActivitiesByDeal(req.params.dealId, orgId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...validated,
        organizationId: orgId,
        createdBy: user.id,
      } as InsertActivity);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  // Contract template routes
  app.get("/api/contract-templates", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const templates = await storage.getAllContractTemplates(orgId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract templates" });
    }
  });

  app.get("/api/contract-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.getContractTemplate(req.params.id, orgId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.get("/api/contract-templates/type/:type", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const templates = await storage.getContractTemplatesByType(req.params.type, orgId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/contract-templates", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertContractTemplateSchema.parse(req.body);
      const template = await storage.createContractTemplate({
        ...validated,
        organizationId: orgId,
        createdBy: user.id,
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/contract-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.updateContractTemplate(req.params.id, orgId, {
        ...req.body,
        updatedBy: user.id,
      });
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/contract-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      await storage.deleteContractTemplate(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Email template routes
  app.get("/api/email-templates", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const templates = await storage.getAllEmailTemplates(orgId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.get("/api/email-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.getEmailTemplate(req.params.id, orgId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/email-templates", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate({
        ...validated,
        organizationId: orgId,
        createdBy: user.id,
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/email-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.updateEmailTemplate(req.params.id, orgId, {
        ...req.body,
        updatedBy: user.id,
      });
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/email-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      await storage.deleteEmailTemplate(req.params.id, orgId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Seed starter templates (admin only)
  app.post("/api/templates/seed", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }

      // Check if templates already exist for this organization
      const existingContracts = await storage.getAllContractTemplates(orgId);
      const existingEmails = await storage.getAllEmailTemplates(orgId);
      
      if (existingContracts.length > 0 || existingEmails.length > 0) {
        return res.status(400).json({ 
          error: "Templates already exist for this organization",
          existingContracts: existingContracts.length,
          existingEmails: existingEmails.length
        });
      }

      const { SEED_CONTRACT_TEMPLATES, SEED_EMAIL_TEMPLATES } = await import("./seedTemplates");
      
      // Insert contract templates
      const contractPromises = SEED_CONTRACT_TEMPLATES.map(template =>
        storage.createContractTemplate({
          organizationId: orgId,
          name: template.name,
          type: template.type,
          description: template.description,
          content: template.content,
        })
      );
      
      // Insert email templates
      const emailPromises = SEED_EMAIL_TEMPLATES.map(template =>
        storage.createEmailTemplate({
          organizationId: orgId,
          name: template.name,
          subject: template.subject!,
          body: template.content,
        })
      );
      
      await Promise.all([...contractPromises, ...emailPromises]);
      
      res.json({ 
        success: true, 
        message: "Starter templates created successfully",
        contractTemplates: SEED_CONTRACT_TEMPLATES.length,
        emailTemplates: SEED_EMAIL_TEMPLATES.length
      });
    } catch (error) {
      console.error("Template seeding error:", error);
      res.status(500).json({ error: "Failed to seed templates" });
    }
  });

  // Email sending route
  app.post("/api/send-email", isAuthenticated, async (req: any, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Get authenticated user for personalized From name and Reply-To
      const user = await getUserFromRequest(req);
      if (!user || !user.email) {
        return res.status(403).json({ error: "User not found or email not set" });
      }
      
      // Construct sender name using helper function
      const senderName = getSenderName(user);
      const replyToEmail = user.email;
      
      // Use custom domain if configured, otherwise fall back to Resend sandbox domain
      // After verifying RoomRoute.org in Resend, set SENDER_EMAIL env var to something like:
      // sales@roomroute.org or info@roomroute.org
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const fromAddress = `${senderName} <${senderEmail}>`;
      
      if (!process.env.RESEND_API_KEY) {
        console.log("Email send request (no Resend configured):", { 
          from: fromAddress,
          replyTo: replyToEmail,
          to, 
          subject, 
          bodyLength: body.length 
        });
        return res.json({ success: true, message: "Email logged (Resend not configured)" });
      }

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: fromAddress,
        replyTo: replyToEmail,
        to: [to],
        subject: subject,
        html: body.replace(/\n/g, "<br>"),
      });

      console.log(`✅ Email sent - From: ${fromAddress} | Reply-To: ${replyToEmail} | To: ${to}`);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Admin Management Routes (Super Admin Only)
  app.get("/api/admin/all-users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const activeUsers = await storage.getAllActiveUsers();
      res.json(activeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/all-organizations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const orgs = await storage.getAllOrganizationsIncludingArchived();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/admin/deactivated-users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deactivatedUsers = await storage.getDeactivatedUsers();
      res.json(deactivatedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deactivated users" });
    }
  });

  app.patch("/api/admin/organizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // If archiving the organization (setting active=false), deactivate all users first
      if (req.body.active === false) {
        const deactivateResult = await storage.deactivateAllOrganizationUsers(req.params.id);
        console.log(`Deactivated ${deactivateResult.count} users in organization ${req.params.id}`);
      }
      
      const org = await storage.updateOrganization(req.params.id, req.body);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.patch("/api/admin/users/:userId/organizations/:orgId", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      console.log(`[User Update] userId: ${req.params.userId}, orgId: ${req.params.orgId}, active: ${req.body.active}`);
      
      // If reactivating (active=true), check if the organization is active
      if (req.body.active === true) {
        const org = await storage.getOrganization(req.params.orgId);
        console.log(`[User Update] Organization check: org exists=${!!org}, org.active=${org?.active}`);
        if (!org || !org.active) {
          console.log(`[User Update] Blocked: Cannot reactivate user in archived organization`);
          return res.status(400).json({ 
            error: "Cannot reactivate user in an archived organization. Please restore the organization first." 
          });
        }
      }
      
      const result = await storage.updateUserOrganizationStatus(
        req.params.userId,
        req.params.orgId,
        req.body.active
      );
      console.log(`[User Update] Success: updated user status, result:`, result);
      res.json(result);
    } catch (error) {
      console.error(`[User Update] Error:`, error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.post("/api/admin/cleanup-archived-org-users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromRequest(req);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const result = await storage.cleanupArchivedOrgUsers();
      console.log(`Cleanup completed: deactivated ${result.count} users from archived organizations`);
      res.json(result);
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({ error: "Failed to cleanup users" });
    }
  });

  // Object Storage Routes (for contract uploads) - Referenced from blueprint:javascript_object_storage
  const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
  const { ObjectPermission } = await import("./objectAcl");

  // Serve uploaded contracts (authenticated)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for contract
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Save contract URL after upload
  app.put("/api/contracts", isAuthenticated, async (req: any, res) => {
    if (!req.body.contractUrl) {
      return res.status(400).json({ error: "contractUrl is required" });
    }

    const userId = req.user.claims.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.contractUrl,
        {
          owner: userId,
          visibility: "private", // Contracts are private to the organization
        },
      );

      // Defensive validation: ensure the path was properly normalized
      if (!objectPath.startsWith("/objects/")) {
        console.error("Path normalization failed:", { 
          rawPath: req.body.contractUrl, 
          normalizedPath: objectPath 
        });
        return res.status(400).json({ 
          error: "Contract path could not be normalized. Please try uploading again." 
        });
      }

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting contract ACL:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Uploaded contract file not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
