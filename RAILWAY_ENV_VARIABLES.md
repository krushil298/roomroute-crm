# Railway Environment Variables Setup

## Copy these variables to Railway Dashboard

### Step 1: Go to Railway Project → Variables Tab

### Step 2: Add these environment variables ONE BY ONE:

```bash
# Session Secret
SESSION_SECRET=ganLaUmkhkvSmYxHzfRF3NMqWB4S+9E9BxcG9yWNA47cDtvoHZ4wUgw/N1Z6GkWhbb6Ukw3gAjNV

# Email Service (Resend)
RESEND_API_KEY=re_H6YBaxAZ_Pb3YMPdUDoCHW8rEX1r9utXr
SENDER_EMAIL=sales@roomroute.org

# Application
NODE_ENV=production
PORT=5000

# Replit Auth (temporary)
ISSUER_URL=https://replit.com/oidc
REPL_ID=[NEED TO GET THIS - see below]
```

### Step 3: Database

**DO NOT add DATABASE_URL manually!**
Railway will automatically create this when you add PostgreSQL database.

The Replit DATABASE_URL points to their Neon instance. We'll use Railway's PostgreSQL instead for:
- Better performance
- Easier management
- No external dependencies

### Step 4: After adding PostgreSQL in Railway

Railway will auto-generate:
```
DATABASE_URL=postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:xxxx/railway
```

### Step 5: Update REPLIT_DOMAINS after deployment

Once Railway gives you a URL like `roomroute-crm-production.up.railway.app`, add:

```bash
REPLIT_DOMAINS=roomroute-crm-production.up.railway.app
```

---

## ⚠️ MISSING: REPL_ID

**How to find REPL_ID:**

1. In Replit, go to your project
2. Click on the project name/settings
3. Look for "Repl ID" or check the URL
4. OR click on the "Publishing" tab - the ID might be there

**Alternative:** If you can't find it, we can temporarily comment out Replit Auth and implement basic auth first.

---

## Object Storage Note

Replit Object Storage won't work on Railway. We have two options:

**Option A (Quick Fix):** Disable file uploads temporarily
**Option B (Better):** Set up alternative storage:
- AWS S3 (free tier available)
- Google Cloud Storage
- Cloudinary (has free tier)
- Railway's volume storage

For now, let's deploy without it and add it later if needed.
