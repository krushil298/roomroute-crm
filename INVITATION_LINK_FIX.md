# Invitation Link Fix - Issue #1

## Problem
User invitation emails contained links that resulted in "can't reach this page" errors when clicked.

## Root Cause
The code was using the `REPLIT_DOMAINS` environment variable to generate invitation links:
```typescript
const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
```

This was from the old Replit hosting setup. After migrating to Railway with custom domain `www.roomroute.org`, the environment variable was either missing or pointing to the old domain.

## Solution

### 1. Code Changes (COMPLETED ✅)
Updated [server/routes.ts](server/routes.ts) in two places:

- Line 319-321: Team invitation emails
- Line 533-535: Resend invitation emails

Changed from:
```typescript
const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
```

To:
```typescript
const baseUrl = process.env.APP_URL || 'http://localhost:5000';
```

### 2. Environment Variable Setup (ACTION REQUIRED ⚠️)

**You need to add the `APP_URL` environment variable to Railway:**

1. Go to: https://railway.app/
2. Click on **roomroute-crm** project
3. Click on your service (Node.js app)
4. Go to **Variables** tab
5. Click **New Variable**
6. Add:
   - **Name:** `APP_URL`
   - **Value:** `https://www.roomroute.org`
7. Click **Add**
8. Railway will automatically redeploy your app (takes 2-3 minutes)

### 3. Testing the Fix

After Railway redeploys with the new environment variable:

1. Log in as Josh (josh.gaddis@roomroute.org / RoomRoute2025!)
2. Go to Team Management
3. Send a test invitation to any email address
4. Check the invitation email - the link should now point to: `https://www.roomroute.org/login`
5. Click the link - it should open the login page successfully

### 4. Additional Improvements

Updated [.env.example](.env.example) to include the new `APP_URL` variable for documentation purposes.

## Files Modified
- `server/routes.ts` - Updated invitation link generation (2 locations)
- `.env.example` - Added APP_URL documentation
- `scripts/setRailwayEnvVar.sh` - Created helper script with instructions

## Timeline
- **Code Fix:** Completed immediately
- **Environment Variable:** Requires manual setup in Railway (2 minutes)
- **Deployment:** Automatic after env var added (2-3 minutes)

## Status
- ✅ Code changes completed
- ⏳ **Waiting for Railway environment variable setup**
- ⏳ Pending deployment & testing

## Next Steps
1. Add `APP_URL` environment variable to Railway
2. Wait for automatic redeploy
3. Test invitation flow
4. Move to next issue (#2: Dashboard changes)
