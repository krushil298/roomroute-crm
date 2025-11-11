# Resend Migration - From Replit to Railway

## Good News!
Since Resend was already configured with Replit, we just need to:
1. Get the existing API key
2. Add it to Railway
3. Update the sender domain (if needed)

## Quick Migration Steps

### Step 1: Get Existing Resend API Key (2 minutes)

**Option A: From Replit Environment Variables**
1. Go to your Replit project: https://replit.com/
2. Open the old CRM project
3. Click **Secrets** (lock icon) in left sidebar
4. Find `RESEND_API_KEY`
5. Copy the value (starts with `re_...`)

**Option B: From Resend Dashboard**
If you can't access Replit, create a new key:
1. Log in to Resend: https://resend.com/api-keys
2. Your existing keys should be listed
3. Either copy an existing key (if saved) or create a new one
4. Name it: `RoomRoute CRM Railway`

### Step 2: Check Domain Status (1 minute)

1. Go to Resend Domains: https://resend.com/domains
2. Check if `roomroute.org` is already added and verified
3. If verified ✅ - Great! Nothing to do here
4. If not added - See Domain Setup section below

### Step 3: Add to Railway (3 minutes)

Add these environment variables to Railway:

**Required Variables:**
```
RESEND_API_KEY=re_... (your existing key)
APP_URL=https://www.roomroute.org
SENDER_EMAIL=noreply@roomroute.org
```

**Steps:**
1. Go to https://railway.app/
2. Open **roomroute-crm** project
3. Click on your service (Node.js app)
4. Go to **Variables** tab
5. Click **New Variable** for each:
   - `RESEND_API_KEY` = `re_...` (paste your key)
   - `APP_URL` = `https://www.roomroute.org`
   - `SENDER_EMAIL` = `noreply@roomroute.org` (or `sales@roomroute.org`)
6. Click **Add** after each
7. Railway will auto-redeploy (2-3 minutes)

### Step 4: Test Email Sending (2 minutes)

After Railway redeploys:
1. Log in to CRM as Josh
2. Go to **Team Management**
3. Send a test invitation to your email
4. Check your inbox - should receive the email
5. Click the link - should work now!

---

## Domain Setup (Only if NOT already in Resend)

If `roomroute.org` is not in your Resend dashboard:

### Add Domain to Resend
1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `roomroute.org`
4. Resend will provide DNS records

### Add DNS Records to Cloudflare

You'll need to add these to Cloudflare (Resend will provide exact values):

```
Type: TXT
Name: @ (or roomroute.org)
Value: [from Resend - verification record]

Type: CNAME
Name: resend._domainkey
Value: [from Resend - DKIM record]

Type: MX (Optional - for receiving bounces)
Name: @
Priority: 10
Value: feedback-smtp.resend.com
```

**Add to Cloudflare:**
1. Log in to Cloudflare: https://dash.cloudflare.com/
2. Select **roomroute.org** domain
3. Go to **DNS** tab
4. Click **Add record** for each DNS record above
5. Set **Proxy status** to **DNS only** (grey cloud)
6. Click **Save**

Wait 5-15 minutes for DNS propagation, then verify in Resend dashboard.

---

## Quick Checklist

- [ ] Get RESEND_API_KEY from Replit or Resend dashboard
- [ ] Check if roomroute.org is verified in Resend
- [ ] Add RESEND_API_KEY to Railway
- [ ] Add APP_URL to Railway
- [ ] Add SENDER_EMAIL to Railway
- [ ] Wait for Railway to redeploy (2-3 min)
- [ ] Test invitation email
- [ ] Confirm link works (www.roomroute.org/login)

---

## What Changes After Migration

**Before (Replit):**
- Emails sent from `onboarding@resend.dev` (sandbox)
- Invitation links pointed to Replit domain
- Limited to 100 emails/day on sandbox

**After (Railway + Custom Domain):**
- Emails sent from `noreply@roomroute.org` (professional)
- Invitation links point to `www.roomroute.org`
- Full email capabilities (3,000/month on free tier)

---

## Troubleshooting

### Can't find Resend API key in Replit?
- Create a new one in Resend dashboard: https://resend.com/api-keys
- Name it: `RoomRoute CRM Railway`
- Use **Full Access** permissions

### Emails still not sending after Railway deploy?
- Check Railway logs for errors
- Verify RESEND_API_KEY is correct (starts with `re_`)
- Check Resend dashboard for API errors: https://resend.com/logs

### Domain not verified in Resend?
- Check DNS records in Cloudflare match exactly
- Wait 15-30 minutes for DNS propagation
- Use DNS checker: https://dnschecker.org/

### Emails going to spam?
- Make sure domain is verified in Resend
- Send from verified domain (not @resend.dev)
- DKIM and SPF records must be added to Cloudflare

---

## Next Steps After Setup

Once Resend is configured in Railway:
1. ✅ Test invitation emails work
2. ✅ Implement password reset functionality
3. ✅ Fix other client issues (pipeline, dollar sign, etc.)

---

## Support

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** https://resend.com/support
- **Railway Docs:** https://docs.railway.app/
