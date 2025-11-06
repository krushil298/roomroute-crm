import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const email = claims["email"];
  const oidcSub = claims["sub"];
  const isSuperAdmin = email === "josh.gaddis@roomroute.org";
  
  // Upsert the user and get the actual database user object
  const dbUser = await storage.upsertUser({
    id: oidcSub,
    email,
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: isSuperAdmin ? "super_admin" : "user",
    organizationId: isSuperAdmin ? null : undefined,
  });

  // Use the actual database user ID for all subsequent operations
  const userId = dbUser.id;

  // Process any pending invitations for this email
  if (email && !isSuperAdmin) {
    const invitations = await storage.getInvitationsByEmail(email);
    
    for (const invitation of invitations) {
      // Only process pending invitations
      if (invitation.status !== "pending") {
        continue;
      }
      
      // Check if user already has a membership (active or inactive) for this organization
      const existingMemberships = await storage.getUserOrganizations(userId);
      const existingMembership = existingMemberships.find(
        m => m.organizationId === invitation.organizationId
      );
      
      if (existingMembership) {
        // User was previously a member - reactivate them if needed
        if (!existingMembership.active) {
          await storage.updateUserOrganizationStatus(userId, invitation.organizationId, true);
        }
        // Update role to match the new invitation if it changed
        // (In case they were previously a user but now invited as admin, or vice versa)
        if (existingMembership.role !== invitation.role) {
          await storage.updateUserOrganizationRole(userId, invitation.organizationId, invitation.role);
        }
      } else {
        // Add user to the organization with the invited role
        await storage.addUserToOrganization({
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          active: true,
        });
      }
      
      // Set this as their primary organization if they don't have one
      const user = await storage.getUser(userId);
      if (!user?.organizationId) {
        await storage.updateUserOrganization(userId, invitation.organizationId);
      }
      
      // Mark invitation as accepted with timestamp (keep for audit trail)
      await storage.updateInvitationStatus(invitation.id, "accepted", new Date());
      
      console.log(`✅ Auto-accepted invitation for ${email} to join organization ${invitation.organizationId}`);
    }
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "select_account",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const user = req.user as any;
    const idToken = user?.access_token; // Use access token as hint
    
    const logoutParams: any = {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
    };
    
    // Include id_token_hint if available to ensure proper OIDC logout
    if (idToken) {
      logoutParams.id_token_hint = idToken;
    }
    
    const logoutUrl = client.buildEndSessionUrl(config, logoutParams).href;

    req.logout((logoutErr) => {
      if (logoutErr) {
        console.error("Error during passport logout:", logoutErr);
      }
      
      // Destroy the session in the database
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Error destroying session:", destroyErr);
        }
        
        // Clear the session cookie from the browser
        res.clearCookie("connect.sid", {
          httpOnly: true,
          secure: true,
        });
        
        // Redirect to OIDC logout endpoint
        res.redirect(logoutUrl);
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Check if user is active in their organization (skip for super_admin)
    const userId = user.claims?.sub;
    if (userId) {
      const dbUser = await storage.getUser(userId);
      
      // Super admins don't need organization membership
      if (dbUser?.role !== "super_admin") {
        // For regular users, check if they're active in their organization
        const orgId = dbUser?.currentOrganizationId || dbUser?.organizationId;
        if (orgId) {
          const userOrgs = await storage.getOrganizationUsers(orgId);
          const membership = userOrgs.find(uo => uo.userId === userId);
          
          if (membership && !membership.active) {
            return res.status(403).json({ message: "Account deactivated" });
          }

          // Check if organization is archived
          const org = await storage.getOrganization(orgId);
          if (org && !org.active) {
            return res.status(403).json({ message: "Organization is archived" });
          }
        }
      }
    }
    
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
