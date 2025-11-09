# RoomRoute CRM - Hotel Management System

## Quick Deploy to Railway

### Step 1: Deploy via Railway Dashboard
1. Visit: https://railway.app
2. Sign in with GitHub account: `krushil298`
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose: `krushil298/roomroute-crm`
6. Railway will auto-detect configuration

### Step 2: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will auto-provision and create `DATABASE_URL`

### Step 3: Configure Environment Variables
Go to your service → Variables tab and add:

```
SESSION_SECRET=<generate-a-random-32-char-string>
RESEND_API_KEY=<your-resend-key>
SENDER_EMAIL=noreply@roomroute.org
NODE_ENV=production
PORT=5000
```

**For Replit Auth (temporary - will be replaced):**
```
REPL_ID=<from-josh-replit>
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=<railway-domain>
```

### Step 4: Deploy
- Railway auto-deploys on push to main branch
- First deployment will take 2-3 minutes
- You'll get a URL like: `roomroute-crm-production.up.railway.app`

### Step 5: Add Custom Domain (roomroute.org)
1. In Railway project → Settings → Domains
2. Click "Add Domain"
3. Enter: `roomroute.org`
4. Railway will provide DNS records to add in IONOS:
   - Add CNAME record pointing to Railway
5. Wait for DNS propagation (5-30 minutes)

### Step 6: Run Database Migrations
After first deployment:
1. Go to Railway service → "New Deployment"
2. Click "Deploy" tab → "Service" → "Open shell"
3. Run: `npm run db:push`

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: PostgreSQL (Neon/Railway)
- Hosting: Railway

## Local Development
```bash
npm install
npm run dev
```

## Environment Variables Required
See `.env.example` for complete list
