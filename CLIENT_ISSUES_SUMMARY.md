# Client Issues Summary - Priority Order

## CRITICAL - Setup Required First

### ⚠️ Resend Email Service (BLOCKING)
**Status:** Not configured
**Impact:** Blocks password reset, invitation emails, and all transactional emails
**Action Required:** See [RESEND_SETUP.md](RESEND_SETUP.md)

**Quick Steps:**
1. Create Resend account: https://resend.com/
2. Get API key
3. Add `RESEND_API_KEY` to Railway
4. Add `SENDER_EMAIL=noreply@roomroute.org` to Railway
5. Add `APP_URL=https://www.roomroute.org` to Railway

---

## HIGH PRIORITY - User-Reported Issues

### Issue #1: Invitation Email Links Broken ✅ FIXED
**Reporter:** Client
**Status:** Code fixed, waiting for Railway env var
**Problem:** Invitation emails show "can't reach this page"
**Fix:** Updated code to use APP_URL instead of REPLIT_DOMAINS
**Action Required:** Add `APP_URL=https://www.roomroute.org` to Railway

---

### Issue #2: Password Reset Auto-Logs In User 🔴 NOT IMPLEMENTED
**Reporter:** jsudaniel@mac.com (first rollout user)
**Status:** Feature doesn't exist
**Problem:** User clicked "Forgot Password" and was auto-logged in instead of receiving reset link

**Root Cause:** Password reset functionality is not implemented. The UI has a link but:
- No `/forgot-password` frontend page exists
- No backend API endpoint for password reset
- No password reset email templates
- No reset token generation/validation

**Implementation Required:**
1. Create password reset token table in database
2. Add backend routes:
   - POST `/api/auth/forgot-password` - Send reset email
   - POST `/api/auth/reset-password` - Validate token and reset password
3. Create frontend pages:
   - `/forgot-password` - Request reset link
   - `/reset-password/:token` - Set new password
4. Create email template for reset link
5. Add token expiration (15-30 minutes)

**Files to Create:**
- `client/src/pages/forgot-password.tsx`
- `client/src/pages/reset-password.tsx`
- Backend routes in `server/authRoutes.ts`
- Database schema for password_reset_tokens

---

### Issue #3: New Leads Not Showing as "New" in Pipeline 🔴 BUG
**Reporter:** Client
**Status:** Needs investigation
**Problem:** When adding a value to a lead, it should show up in pipeline as "new" stage but doesn't

**Expected Behavior:**
- User creates a contact (lead) with potential value
- Lead should appear in pipeline with stage "new"
- Pipeline should display lead count and value

**Actual Behavior:**
- Leads not appearing in pipeline as "new" stage
- May be skipping directly to another stage or not appearing at all

**Investigation Needed:**
1. Check contact creation logic
2. Check if leads are automatically converted to deals
3. Check pipeline stage logic for new contacts
4. Check if "new" stage exists in deal stages

---

### Issue #4: Extra Dollar Sign on Deals Page 🟡 UI BUG
**Reporter:** Client
**Status:** Needs investigation
**Problem:** "Need to remove the smaller (extra) dollar sign on deals page for revenue potential"

**Expected:** Single dollar sign for revenue display
**Actual:** Two dollar signs (one smaller/extra) showing

**Investigation Needed:**
- Find deals page revenue potential display
- Check if using currency formatter that adds $ automatically
- Check if manually adding $ in addition to formatter

---

### Issue #5: Log Outreach Missing Status Dropdown 🟠 FEATURE REQUEST
**Reporter:** Client
**Status:** Enhancement needed
**Problem:** "Log outreach box needs a dropdown (optional) to change the status should the outreach attempt lead to the next step"

**Requirements:**
- Add optional dropdown to outreach logging form
- Dropdown options:
  - (Leave blank) - No status change
  - Qualified
  - Proposal
  - Closed
- When selected, should update lead/deal stage automatically
- Should track this status change in activity history

**Implementation:**
1. Add status dropdown to log outreach form
2. Update backend to handle status changes
3. Automatically update deal/lead stage when status selected
4. Log status change as separate activity or part of outreach activity

---

## MEDIUM PRIORITY - Previous Client Requirements

### Issue #6: Dashboard - Remove Pipeline Overview
**Status:** Pending
**Request:** Remove the pipeline overview section from bottom of dashboard

### Issue #7: Dashboard - Expand Current Activity to 10 Entries
**Status:** Pending
**Request:** Increase current activity display from current amount to 10 most recent entries

### Issue #8: Contacts Page - Add Pagination
**Status:** Pending
**Requirements:**
- 10 contacts per page
- Sort alphabetically
- Forward/backward navigation buttons

### Issue #9: Add Timestamps and Creator Tracking
**Status:** Pending
**Request:** Add date/timestamp and creator name to all entries (contacts, deals, activities)

### Issue #10: Fix Leads Moving to Deals
**Status:** Pending
**Problem:** Leads not removed from lead count when moved to deals

### Issue #11: Email Reply-To Function
**Status:** Pending
**Request:** Emails sent from CRM should route replies to sender's email (currently sales@roomroute.org)
**Note:** Already implemented in code, just needs Resend setup

### Issue #12: Export Buttons Not Working
**Status:** Pending
**Problem:** Reports feature export buttons do nothing when clicked

### Issue #13: Recent Activity Improvements
**Status:** Pending
**Requirements:**
- Store only 5 items at a time with scroll bar
- Keep activities for 5 days only
- Make company names clickable to navigate to lead

### Issue #14: Verify Permission Levels
**Status:** Pending
**Request:** Test user, admin, and super_admin roles work correctly

### Issue #15: Implement Proper Onboarding Flows
**Status:** Pending
**Requirements:**
- Invited users: Auto-assign to hotel, skip setup wizard
- New signups: Show hotel setup wizard on first login

---

## Implementation Priority

### Phase 1 - Critical (Do First)
1. ✅ Setup Resend account and configure Railway
2. ✅ Add APP_URL environment variable
3. 🔴 Implement password reset functionality (Issue #2)

### Phase 2 - High Priority User Issues
4. 🔴 Fix new leads pipeline display (Issue #3)
5. 🟡 Remove extra dollar sign (Issue #4)
6. 🟠 Add status dropdown to outreach log (Issue #5)

### Phase 3 - Medium Priority Enhancements
7. Dashboard improvements (#6, #7)
8. Contacts pagination (#8)
9. Timestamps and creator tracking (#9)
10. Leads to deals fix (#10)
11. Export buttons fix (#12)

### Phase 4 - Polish & Testing
12. Recent activity improvements (#13)
13. Permission level verification (#14)
14. Onboarding flows (#15)

---

## Testing User
**Email:** jsudaniel@mac.com
**Status:** First rollout user helping with testing
**Note:** His data was preserved from first rollout

---

## Notes
- Reply-to email functionality already implemented, just needs Resend configured
- Invitation email fix already coded, just needs Railway env var
- Most issues require Resend setup to be completed first
