# Resend Email Service Setup

## Why We Need Resend
Resend is required for:
- User invitation emails
- Password reset emails (Issue #3)
- Outreach emails from CRM
- All transactional emails

Currently emails are not being sent because `RESEND_API_KEY` is not configured in Railway.

## Step-by-Step Setup

### 1. Create Resend Account (5 minutes)

1. Go to: https://resend.com/
2. Click **Sign Up** (free tier: 3,000 emails/month, 100 emails/day)
3. Sign up with your email
4. Verify your email address

### 2. Get API Key (2 minutes)

1. Log in to Resend dashboard: https://resend.com/api-keys
2. Click **Create API Key**
3. Name it: `RoomRoute CRM Production`
4. Select permissions: **Full Access** (Sending access)
5. Click **Create**
6. **COPY THE API KEY** - it starts with `re_...`
7. ⚠️ Save it securely - you won't see it again!

### 3. Add Domain to Resend (10 minutes)

To send emails from `@roomroute.org` instead of the sandbox domain:

1. Go to Resend dashboard: https://resend.com/domains
2. Click **Add Domain**
3. Enter: `roomroute.org`
4. Click **Add**

Resend will provide DNS records to add. You'll need to add these to Cloudflare:

**Required DNS Records:**
```
Type: TXT
Name: @ (or roomroute.org)
Value: [Resend will provide]

Type: CNAME
Name: resend._domainkey
Value: [Resend will provide]

Type: MX
Name: @
Priority: 10
Value: [Resend will provide - usually feedback-smtp.resend.com]
```

### 4. Add DNS Records to Cloudflare (5 minutes)

1. Log in to Cloudflare: https://dash.cloudflare.com/
2. Select **roomroute.org** domain
3. Go to **DNS** tab
4. Click **Add record** for each DNS record from Resend
5. Add all TXT, CNAME, and MX records exactly as provided
6. Click **Save** for each record

⏱️ DNS propagation takes 5-15 minutes

### 5. Verify Domain in Resend (2 minutes)

1. Go back to Resend dashboard
2. Click **Verify** next to roomroute.org
3. Wait for verification (may take a few minutes)
4. Once verified, you'll see a green checkmark ✅

### 6. Configure Railway Environment Variables (3 minutes)

Add these two environment variables to Railway:

**Variable 1:**
- Name: `RESEND_API_KEY`
- Value: `re_...` (the API key you copied earlier)

**Variable 2:**
- Name: `SENDER_EMAIL`
- Value: `noreply@roomroute.org` (or `sales@roomroute.org`)

**Steps:**
1. Go to https://railway.app/
2. Open **roomroute-crm** project
3. Click on your Node.js service
4. Go to **Variables** tab
5. Click **New Variable** twice (once for each variable above)
6. Click **Add**
7. Railway will auto-redeploy (2-3 minutes)

### 7. Test Email Sending (2 minutes)

After Railway redeploys:

1. Log in to CRM as Josh
2. Go to **Team Management**
3. Send a test invitation to your own email
4. Check your inbox - you should receive the invitation email
5. Check Resend dashboard for email logs

## Quick Setup (If Domain Already Verified)

If you've already added roomroute.org to Resend before:

1. Get API key from Resend dashboard
2. Add to Railway:
   - `RESEND_API_KEY` = `re_...`
   - `SENDER_EMAIL` = `noreply@roomroute.org`
3. Wait for Railway to redeploy (2-3 minutes)
4. Test by sending an invitation email

## Troubleshooting

### Emails not sending?
- Check Railway logs: `railway logs` (if using CLI)
- Check Resend dashboard for error logs
- Verify RESEND_API_KEY is set correctly
- Verify domain is verified in Resend

### Emails going to spam?
- Make sure domain is verified in Resend
- Add SPF and DKIM records (provided by Resend)
- Send from verified domain (noreply@roomroute.org, not @resend.dev)

### DNS not verifying?
- Wait 15-30 minutes for DNS propagation
- Use DNS checker: https://dnschecker.org/
- Verify records match exactly (no extra spaces)

## Cost
- **Free tier:** 3,000 emails/month, 100 emails/day
- **Pro tier:** $20/month for 50,000 emails/month (if needed later)

## Status Checklist
- [ ] Create Resend account
- [ ] Get API key
- [ ] Add roomroute.org domain to Resend
- [ ] Add DNS records to Cloudflare
- [ ] Verify domain in Resend
- [ ] Add RESEND_API_KEY to Railway
- [ ] Add SENDER_EMAIL to Railway
- [ ] Test invitation email
- [ ] Test password reset email

## Next Steps After Setup
Once Resend is configured:
1. Fix password reset functionality (Issue #3)
2. Test invitation emails work correctly
3. Verify reply-to headers work properly
