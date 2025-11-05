import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

// Helper function to get effective organization ID
// For super_admin: use currentOrganizationId
// For regular users: use organizationId
function getEffectiveOrgId(user: any): string | undefined {
  if (user?.role === "super_admin") {
    return user.currentOrganizationId || undefined;
  }
  return user?.organizationId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // For super admins, check if their currentOrganizationId points to an archived org
      if (user?.role === "super_admin" && user.currentOrganizationId) {
        const currentOrg = await storage.getOrganization(user.currentOrganizationId);
        
        // If current org is archived, switch to first active org
        if (currentOrg && currentOrg.active === false) {
          const activeOrgs = await storage.getAllOrganizations();
          if (activeOrgs.length > 0) {
            await storage.updateUserCurrentOrg(userId, activeOrgs[0].id);
            user = await storage.getUser(userId);
          } else {
            // No active orgs available, clear currentOrganizationId
            await storage.updateUserCurrentOrg(userId, '');
            user = await storage.getUser(userId);
          }
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization onboarding endpoint
  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.organizationId) {
        return res.status(400).json({ error: "User already has an organization" });
      }

      const validated = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(validated);
      await storage.updateUserOrganization(userId, org.id);
      
      // Auto-assign 'admin' role to organization creator
      await storage.addUserToOrganization({
        userId,
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      
      // Validate request body with Zod
      const inviteSchema = z.object({
        email: z.string().email("Valid email address is required"),
        role: z.enum(["user", "admin"]).optional().default("user"),
      });
      
      const validated = inviteSchema.parse(req.body);
      const { email, role } = validated;

      // Get organization details for the invitation email
      const org = await storage.getOrganization(orgId);
      if (!org || !user) {
        return res.status(404).json({ error: "Organization or user not found" });
      }

      // Construct sender name from inviting user with fallback
      const firstName = user.firstName?.trim() || "";
      const lastName = user.lastName?.trim() || "";
      const senderName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : (firstName || lastName || user.email || "RoomRoute Team");
      
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const fromAddress = `${senderName} <${senderEmail}>`;
      const replyToEmail = user.email || undefined;
      
      // Create invitation email content
      const subject = `You're invited to join ${org.name} on RoomRoute`;
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
      const loginUrl = `${baseUrl}/login`;
      
      const htmlBody = `
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

      if (!process.env.RESEND_API_KEY) {
        console.log("Team invitation email (Resend not configured):", { 
          from: fromAddress,
          to: email,
          subject,
          role: role || 'user',
          organization: org.name
        });
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

      console.log(`✅ Team invitation sent - From: ${fromAddress} | To: ${email} | Org: ${org.name} | Role: ${role || 'user'}`);
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
      const currentUserId = req.user.claims.sub;
      const user = await storage.getUser(currentUserId);
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

  // Super Admin Routes
  app.get("/api/admin/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { organizationId } = req.body;
      if (!organizationId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      await storage.updateUserCurrentOrg(userId, organizationId);
      res.json({ message: "Organization context switched", organizationId });
    } catch (error) {
      res.status(500).json({ error: "Failed to switch organization" });
    }
  });

  app.patch("/api/admin/organizations/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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

  // Super Admin Roll-Up Stats
  app.get("/api/admin/rollup-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const contacts = await storage.getAllContacts(orgId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      // Validate request body (organizationId already omitted from insertContactSchema)
      const validated = insertContactSchema.parse(req.body);
      
      // Add server-side organizationId (security: prevent client from setting orgId)
      const contact = await storage.createContact({
        ...validated,
        organizationId: orgId,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Contact creation error:", error);
      res.status(400).json({ error: "Invalid contact data" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      // Validate partial updates (organizationId already omitted from insertContactSchema)
      const validated = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, orgId, validated);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const deals = await storage.getAllDeals(orgId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertDealSchema.parse(req.body);
      
      // Convert expectedCloseDate and actionDate strings to Date if present
      const dealData = {
        ...validated,
        organizationId: orgId,
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      
      // Convert expectedCloseDate and actionDate strings to Date if present
      const updateData = {
        ...req.body,
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const activities = await storage.getAllActivities(orgId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/contacts/:contactId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...validated,
        organizationId: orgId,
      } as InsertActivity);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  // Contract template routes
  app.get("/api/contract-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertContractTemplateSchema.parse(req.body);
      const template = await storage.createContractTemplate({
        ...validated,
        organizationId: orgId,
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/contract-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.updateContractTemplate(req.params.id, orgId, req.body);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const validated = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate({
        ...validated,
        organizationId: orgId,
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/email-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const orgId = getEffectiveOrgId(user);
      if (!orgId) {
        return res.status(403).json({ error: "No organization" });
      }
      const template = await storage.updateEmailTemplate(req.params.id, orgId, req.body);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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

  // Email sending route
  app.post("/api/send-email", isAuthenticated, async (req: any, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Get authenticated user for personalized From name and Reply-To
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(403).json({ error: "User not found or email not set" });
      }
      
      // Construct sender name from user's first and last name
      const senderName = `${user.firstName} ${user.lastName}`.trim() || "RoomRoute";
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const org = await storage.updateOrganization(req.params.id, req.body);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.patch("/api/admin/users/:userId/organizations/:orgId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only super admins can access this
      if (user?.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const result = await storage.updateUserOrganizationStatus(
        req.params.userId,
        req.params.orgId,
        req.body.active
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
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
