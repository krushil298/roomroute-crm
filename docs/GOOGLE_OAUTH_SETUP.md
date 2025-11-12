# Google OAuth Setup Guide

## Overview

This document explains how to set up Google OAuth 2.0 authentication for RoomRoute CRM.

---

## Prerequisites

1. Google Cloud Console account
2. Access to Railway environment variables
3. Production domain: `https://www.roomroute.org`

---

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (if needed)

1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: `RoomRoute CRM`
4. Click "Create"

### 1.2 Enable Google+ API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 1.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure consent screen first (see Step 1.4)
4. Application type: **Web application**
5. Name: `RoomRoute CRM Production`

**Authorized JavaScript origins:**
```
https://www.roomroute.org
```

**Authorized redirect URIs:**
```
https://www.roomroute.org/api/auth/google/callback
```

6. Click "Create"
7. **Copy the Client ID and Client Secret** (you'll need these)

### 1.4 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. User Type: **External**
3. Click "Create"

**App Information:**
- App name: `RoomRoute CRM`
- User support email: `josh.gaddis@roomroute.org`
- App logo: (optional)

**App domain:**
- Application home page: `https://www.roomroute.org`
- Privacy policy: `https://www.roomroute.org/privacy` (create if needed)
- Terms of service: `https://www.roomroute.org/terms` (create if needed)

**Developer contact:** `josh.gaddis@roomroute.org`

**Scopes:**
Add these scopes:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

**Test users (for testing before publishing):**
- Add your email: `josh.gaddis@roomroute.org`
- Add any test accounts

4. Click "Save and Continue"

### 1.5 Publishing Status

**For Testing:**
- Status: "Testing"
- Only test users can sign in
- No verification needed

**For Production:**
- Status: "In Production"
- Anyone with a Google account can sign in
- Requires verification (submit for review)

---

## Step 2: Environment Variables

Add these to Railway:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://www.roomroute.org/api/auth/google/callback
```

---

## Step 3: How It Works

### User Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirects to Google login page
   ↓
3. User logs in with Google (or already logged in)
   ↓
4. Google asks: "Allow RoomRoute to access your email and name?"
   ↓
5. User clicks "Allow"
   ↓
6. Google redirects to: /api/auth/google/callback
   ↓
7. Backend receives: { email, firstName, lastName, googleId }
   ↓
8. Backend checks: Does user exist with this email?
   ├─ YES → Log them in
   └─ NO → Create new user account
   ↓
9. Set session cookie
   ↓
10. Redirect to dashboard
```

### Security Features

- ✅ OAuth 2.0 standard protocol
- ✅ Google handles password security
- ✅ Short-lived access tokens
- ✅ Same session management as email/password
- ✅ No password stored in our database

### User Account Linking

**Scenario 1: New User**
```javascript
User clicks "Sign in with Google"
→ No existing account with google@example.com
→ Create new user:
   {
     email: "google@example.com",
     firstName: "John",
     lastName: "Doe",
     authProvider: "google",
     googleId: "123456789",
     password: null  // No password needed
   }
→ Check for pending invitations
→ Auto-assign to organization if invited
→ Log in
```

**Scenario 2: Existing User (Email/Password)**
```javascript
User already exists with email/password
→ Tries to use "Sign in with Google" with same email
→ Option A: Link accounts (update authProvider to "google")
→ Option B: Reject (email already registered)

Recommendation: Option A (allow linking)
```

**Scenario 3: Existing Google User**
```javascript
User already signed in with Google before
→ Has googleId stored
→ Just log them in (no account creation)
```

---

## Step 4: Backend Implementation

### 4.1 Dependencies

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0"
}
```

### 4.2 OAuth Strategy

```typescript
// server/googleAuth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const googleId = profile.id;

        // Find or create user
        let user = await storage.getUserByEmail(email);

        if (!user) {
          // Create new user
          user = await storage.upsertUser({
            email,
            firstName,
            lastName,
            authProvider: "google",
            googleId,
            role: "user",
          });

          // Check for pending invitations
          const invitations = await storage.getInvitationsByEmail(email);
          const pendingInvite = invitations.find(inv => inv.status === "pending");

          if (pendingInvite) {
            // Auto-assign to organization
            await storage.addUserToOrganization({
              userId: user.id,
              organizationId: pendingInvite.organizationId,
              role: pendingInvite.role,
              active: true,
            });
            await storage.updateInvitationStatus(pendingInvite.id, "accepted", new Date());
          }
        }

        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);
```

### 4.3 Routes

```typescript
// server/authRoutes.ts

// Initiate Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

// Google OAuth callback
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    // Set session
    setUserSession(req, req.user);

    // Save session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("/login?error=session");
      }
      res.redirect("/");
    });
  }
);
```

---

## Step 5: Frontend Implementation

### 5.1 Google Sign-In Button

```tsx
// client/src/pages/login.tsx

<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={() => window.location.href = "/api/auth/google"}
>
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    {/* Google logo SVG */}
  </svg>
  Sign in with Google
</Button>
```

---

## Step 6: Testing Checklist

### Test Cases

- [ ] New user signs in with Google → Account created
- [ ] Existing email/password user signs in with Google → Account linked
- [ ] Invited user signs in with Google → Auto-assigned to org
- [ ] User signs out and signs in again → Works seamlessly
- [ ] User denies Google permission → Redirects to login with error
- [ ] Multiple Google accounts → Can choose which one

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** Google callback URL doesn't match configured URL

**Solution:**
1. Check Railway environment: `GOOGLE_CALLBACK_URL`
2. Must exactly match URL in Google Cloud Console
3. Must use `https://` in production
4. No trailing slash

### Error: "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not configured or missing scopes

**Solution:**
1. Complete consent screen setup
2. Add required scopes (email, profile)
3. Add yourself as test user if in "Testing" mode

### Error: User can't sign in

**Problem:** App is in "Testing" mode and user is not a test user

**Solution:**
1. Go to OAuth consent screen
2. Add user email to "Test users"
3. OR publish app to production

---

## Security Considerations

1. **Never commit credentials**
   - Client ID and Secret must be in Railway only
   - Use environment variables

2. **HTTPS required**
   - Google OAuth requires HTTPS in production
   - Railway provides this automatically

3. **Validate redirect URLs**
   - Only allow whitelisted callback URLs
   - Prevents OAuth hijacking

4. **Session security**
   - Same secure session handling as email/password
   - 7-day expiry
   - HttpOnly cookies

---

## Cost

**Free Tier:**
- Up to 10,000 requests per day
- More than enough for hotel CRM

**No credit card required for basic OAuth**

---

## Next Steps After Setup

1. Test with your Google account
2. Add 2-3 test users
3. Test invitation flow with Google OAuth
4. Publish consent screen to production (when ready)
5. Monitor OAuth usage in Google Cloud Console

---

**Need Help?**
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Passport.js Docs: http://www.passportjs.org/
