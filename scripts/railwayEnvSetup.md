# Railway Environment Variables - Quick Setup

## Copy these 3 variables to Railway

### Step 1: Get your Resend API Key

**From Replit:**
1. Go to: https://replit.com/
2. Open your old CRM project
3. Click **Secrets** (lock icon)
4. Copy the value of `RESEND_API_KEY`

**OR from Resend Dashboard:**
1. Go to: https://resend.com/api-keys
2. Copy existing key or create new one

---

### Step 2: Add to Railway

Go to: https://railway.app/ → roomroute-crm → Service → Variables tab

**Add these 3 variables:**

```
Variable 1:
Name:  RESEND_API_KEY
Value: re_xxxxxxxxxxxxxxxxxxxxxxxxxx
       (paste your key from Step 1)

Variable 2:
Name:  APP_URL
Value: https://www.roomroute.org

Variable 3:
Name:  SENDER_EMAIL
Value: noreply@roomroute.org
```

Click **Add** after each one.

---

### Step 3: Wait for Deploy

Railway will automatically redeploy (takes 2-3 minutes).

You'll see deployment progress in Railway dashboard.

---

### Step 4: Test

After deployment completes:

1. Go to: https://www.roomroute.org/
2. Log in as Josh (josh.gaddis@roomroute.org / RoomRoute2025!)
3. Go to **Team Management**
4. Click **Invite User**
5. Enter test email address
6. Click **Send Invitation**
7. Check your email inbox
8. Click the invitation link
9. Should open: https://www.roomroute.org/login ✅

---

## Verification Checklist

After adding variables and deployment:
- [ ] Railway shows all 3 variables in Variables tab
- [ ] Deployment completed successfully (green checkmark)
- [ ] Can send invitation email without errors
- [ ] Invitation email arrives in inbox
- [ ] Email link points to www.roomroute.org/login
- [ ] Clicking link opens login page correctly

---

## If You Can't Find Old Resend Key

No problem! Create a new one:

1. Go to: https://resend.com/api-keys
2. Click **Create API Key**
3. Name: `RoomRoute CRM Railway Production`
4. Permissions: **Full Access**
5. Click **Create**
6. Copy the key (starts with `re_...`)
7. Save it somewhere safe!
8. Use this new key for Railway

The old key can stay in Replit (won't hurt anything).

---

## Domain Verification

If roomroute.org is NOT verified in Resend yet:

1. Go to: https://resend.com/domains
2. If you see `roomroute.org` with ✅ - you're good!
3. If not listed or not verified:
   - Add domain in Resend
   - Add DNS records to Cloudflare (see RESEND_MIGRATION.md)
   - Wait 15 minutes
   - Verify in Resend

For now, emails will work from `onboarding@resend.dev` (sandbox) even without domain verification. But for production, you want emails from `noreply@roomroute.org`.

---

## What Happens Next

After you add these variables, I can:
1. ✅ Test invitation emails work
2. ✅ Implement password reset feature for jsudaniel@mac.com
3. ✅ Fix the other UI issues (pipeline, dollar sign, etc.)

---

## Need Help?

If you run into any issues:
- Check Railway deployment logs
- Check Resend logs: https://resend.com/logs
- Share any error messages you see
