import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Only initialize if Google OAuth is configured
export function initializeGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("⚠️  Google OAuth not configured - skipping initialization");
    return false;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const googleId = profile.id;

          console.log(`[Google OAuth] Processing user: ${email}`);

          // Check if user exists
          let user = await storage.getUserByEmail(email);

          if (!user) {
            // Create new user
            console.log(`[Google OAuth] Creating new user for ${email}`);

            user = await storage.upsertUser({
              email,
              firstName,
              lastName,
              authProvider: "google",
              googleId,
              role: "user",
              password: undefined, // No password for OAuth users
            });

            // Check for pending invitations
            const invitations = await storage.getInvitationsByEmail(email);
            const pendingInvite = invitations.find(inv => inv.status === "pending");

            if (pendingInvite) {
              console.log(`[Google OAuth] Found pending invitation for ${email}`);

              // Auto-assign to organization
              await storage.addUserToOrganization({
                userId: user.id,
                organizationId: pendingInvite.organizationId,
                role: pendingInvite.role,
                active: true,
              });

              // Update user's current organization
              await storage.updateUserCurrentOrg(user.id, pendingInvite.organizationId);
              user.currentOrganizationId = pendingInvite.organizationId;

              // Mark invitation as accepted
              await storage.updateInvitationStatus(pendingInvite.id, "accepted", new Date());

              console.log(`[Google OAuth] Auto-assigned to organization ${pendingInvite.organizationId}`);
            }
          } else {
            // Existing user - update Google ID if not set
            if (!user.googleId && user.authProvider === "email") {
              console.log(`[Google OAuth] Linking existing email account to Google for ${email}`);

              // Update to link Google account
              await storage.upsertUser({
                id: user.id,
                email: user.email,
                googleId,
                authProvider: "google",
              });

              user.googleId = googleId;
              user.authProvider = "google";
            }

            console.log(`[Google OAuth] Logging in existing user: ${email}`);
          }

          done(null, user);
        } catch (error) {
          console.error("[Google OAuth] Error:", error);
          done(error as Error, undefined);
        }
      }
    )
  );

  console.log("✅ Google OAuth strategy initialized");
  return true;
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
