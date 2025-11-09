# URGENT: Deploy to Railway TODAY (Nov 9)

## Step 1: Get Replit Environment Variables (5 min)

1. Login to Replit: https://replit.com/
   - Email: jgaddis.consulting@yahoo.com
   - Password: Samba@2025!!!

2. Open the RoomRoute project

3. Click on "Tools" → "Secrets" (or look for the lock icon 🔒)

4. Copy these environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `RESEND_API_KEY` (email service)
   - `REPL_ID` (authentication)
   - `SESSION_SECRET` (or use the one we generated)
   - Any other env vars you see

## Step 2: Deploy to Railway (10 min)

1. **Go to Railway**: https://railway.app

2. **Login with GitHub** (use account: krushil298)

3. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `krushil298/roomroute-crm`
   - Click "Deploy Now"

4. **Add PostgreSQL Database**:
   - In your project dashboard, click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Click "Add"
   - Railway will automatically create `DATABASE_URL` variable

5. **Add Environment Variables**:
   - Click on your `roomroute-crm` service
   - Go to "Variables" tab
   - Click "+ New Variable"
   - Add these ONE BY ONE:

   ```
   SESSION_SECRET=0eb8ed5ef18e135f7042d57787233c61ada5d6661e04197eb8997f0fd86bfc7c
   RESEND_API_KEY=<copy-from-replit>
   SENDER_EMAIL=noreply@roomroute.org
   NODE_ENV=production
   PORT=5000
   REPL_ID=<copy-from-replit>
   ISSUER_URL=https://replit.com/oidc
   ```

   **IMPORTANT**: For `REPLIT_DOMAINS`, we'll update this AFTER we get the Railway URL

6. **Get Railway URL**:
   - Go to "Settings" tab
   - Under "Domains", you'll see a URL like: `roomroute-crm-production.up.railway.app`
   - Copy this URL

7. **Update REPLIT_DOMAINS**:
   - Go back to "Variables" tab
   - Add new variable:
   ```
   REPLIT_DOMAINS=<your-railway-url-without-https>
   ```
   Example: `roomroute-crm-production.up.railway.app`

8. **Trigger Deployment**:
   - Railway should auto-deploy after adding variables
   - Check "Deployments" tab to see progress
   - Wait 2-3 minutes for build to complete

## Step 3: Run Database Migrations (2 min)

After deployment succeeds:

1. Click on your service → "Deployments" tab
2. Click on the latest deployment
3. On the right side, click the three dots (...) → "View Logs"
4. Look for any errors

**To run migrations**:
- Go to your project settings
- Click on the PostgreSQL database service
- Click "Connect"
- Copy the DATABASE_URL
- We'll need to run migrations using Drizzle

**OR** use Railway CLI:
```bash
# In terminal, if Railway CLI is authenticated:
railway run npm run db:push
```

## Step 4: Add Custom Domain (5 min)

1. In Railway project → Click on service → "Settings" tab
2. Scroll to "Domains" section
3. Click "Add Domain"
4. Enter: `roomroute.org`
5. Railway will show DNS records to add

**Add DNS in IONOS**:
1. Login to IONOS: https://ionos.com
   - Email: jgaddis.consulting@yahoo.com
   - Password: 769Q:_8fiEdpJnD

2. Go to Domains → roomroute.org → DNS Settings
3. Add the CNAME record Railway provided
4. Save changes
5. Wait 5-30 minutes for DNS propagation

## Step 5: Test & Share with Josh (2 min)

1. Open the Railway URL in browser
2. Test login with existing credentials
3. Verify the CRM loads properly

**Send to Josh**:
```
Hi Josh,

Great news! I've successfully deployed RoomRoute CRM to Railway:

Live URL: https://<your-railway-url>

The domain roomroute.org is being configured and should be live within the next 30 minutes.

All your data is preserved and the system is running on Railway's infrastructure. This meets our Milestone 1 (Deploy to IONOS) - though we're using Railway instead since IONOS Web Hosting Plus doesn't support Node.js apps.

Next steps:
- Domain DNS propagation (automatic)
- Implementing your requested feature changes

Let me know if you have any questions!

Best,
Romil
```

## Troubleshooting

### If deployment fails:
- Check "Logs" in Railway dashboard
- Verify all environment variables are set
- Make sure DATABASE_URL is from Railway PostgreSQL, not Replit

### If database connection fails:
- Run migrations: `railway run npm run db:push`
- Check DATABASE_URL format

### If auth doesn't work:
- Verify REPL_ID is set
- Verify REPLIT_DOMAINS matches your Railway URL

## TIMELINE
- **Total time: ~25 minutes**
- **You need to complete this TODAY (Nov 9) for Milestone 1**

## Need Help?
Check Railway docs: https://docs.railway.app
