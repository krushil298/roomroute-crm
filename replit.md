# RoomRoute - Multi-Tenant Hotel CRM

## Overview
**RoomRoute** is a comprehensive multi-tenant CRM built specifically for hotels and hospitality businesses. Built with Node.js, React, and PostgreSQL, the application features complete data isolation between organizations, Replit Auth authentication, contact management, deal tracking, activity logging, sales pipeline management, contract templates, email templates, and lead import functionality.

**Domain**: RoomRoute.org (purchased, pending DNS configuration)

## Multi-Tenancy Architecture
**Complete data isolation between organizations** - Each hotel/organization has separate login credentials and can only access their own data. All data tables include organizationId foreign keys with server-side enforcement.

### Authentication
- **Replit Auth (OIDC)**: Integrated authentication supporting Google, GitHub, and email/password
- **Landing Page**: Shown to unauthenticated users
- **Onboarding Flow**: New users create an organization on first login
- **Session Management**: PostgreSQL-backed sessions for reliability
- **Security**: organizationId always set server-side from authenticated session, preventing data isolation breaches

## Project Architecture

### Frontend (React + Vite)
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS + Shadcn UI components
- **Design System**: Linear/Notion-inspired clean, functional aesthetic

### Backend (Node.js + Express)
- **Server**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **API**: RESTful JSON API

### Database Schema
- **organizations**: Each hotel is an organization with complete data isolation
- **users**: id (OIDC sub), email, first_name, last_name, profile_image_url, organization_id (FK)
- **sessions**: PostgreSQL-backed session storage
- **contacts**: Customer contact information (includes organization_id FK)
- **deals**: Sales opportunities with value and stage tracking (includes organization_id FK)
- **activities**: Activity log for contacts and deals (includes organization_id FK)
- **contract_templates**: Reusable contract templates (includes organization_id FK)
- **email_templates**: Email templates with subject and body (includes organization_id FK)

## Key Features

### 1. Contact Management
- Add, edit, view, and delete contacts
- Search and filter contacts
- Contact cards with avatars, status badges
- Click email address to open email composer

### 2. Deal Pipeline
- Track deals through sales stages (Lead → Qualified → Proposal → Negotiation → Closed)
- Deal values and probability tracking
- Visual pipeline overview on dashboard
- Associate deals with contacts

### 3. Lead Import
- **File Upload**: Drag-and-drop or browse for CSV files
- **Copy-Paste**: Paste CSV data directly
- Bulk import contacts with validation
- CSV format: Name, Email, Phone, Company, Status

### 4. Contract Templates
- **LNR Templates**: Long-term rental agreements
- **Group Templates**: Group booking contracts
- Create, edit, preview, and use templates
- Templates organized by type in tabs

### 5. Email Templates
- Pre-built email templates (Introduction, Follow-up, Proposal)
- Template selection in email composer
- Automatic recipient name replacement
- Email composer accessible by clicking contact email addresses

### 6. Revenue Calculator
- Formula: rooms × nights/week × weeks × price/night = revenue
- Interactive calculator for potential value estimation

### 7. Dashboard
- KPI metrics (Total Contacts, Active Deals, Pipeline Value, Weekly Activity)
- Recent activity feed
- Pipeline overview with deals by stage
- Quick actions panel

## Email Integration
**Resend integration is active** - The application uses Resend to send real emails. The RESEND_API_KEY secret is configured.
- Email sending is handled via the `/api/send-email` endpoint
- Uses "onboarding@resend.dev" as the sender (this is a Resend sandbox domain for testing)
- For production, you'll want to verify your own domain in Resend

To change the sender email, update the `from` field in `server/routes.ts`.

## Development

### Running the Application
```bash
npm run dev
```
This starts both the Express backend and Vite frontend on port 5000.

### Database Migrations
```bash
npm run db:push
```
Syncs the Drizzle schema with the PostgreSQL database.

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, Wouter
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## API Endpoints

**All endpoints require authentication** via Replit Auth session. Data is automatically filtered by the authenticated user's organizationId.

### Authentication
- `GET /api/login` - Initiate Replit Auth login flow
- `GET /api/callback` - OAuth callback handler
- `GET /api/logout` - Logout and end session
- `GET /api/auth/user` - Get current authenticated user

### Organizations
- `POST /api/organizations` - Create organization (for onboarding)

### Contacts
- `GET /api/contacts` - List contacts (filtered by organizationId)
- `GET /api/contacts/:id` - Get single contact (validated against organizationId)
- `POST /api/contacts` - Create contact (organizationId auto-set from session)
- `PATCH /api/contacts/:id` - Update contact (organizationId cannot be changed)
- `DELETE /api/contacts/:id` - Delete contact (validated against organizationId)
- `POST /api/contacts/import` - Bulk import contacts (organizationId auto-set)

### Deals
- `GET /api/deals` - List all deals
- `GET /api/deals/:id` - Get single deal
- `GET /api/contacts/:contactId/deals` - Get deals for contact
- `POST /api/deals` - Create deal
- `PATCH /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Activities
- `GET /api/activities` - List all activities
- `GET /api/contacts/:contactId/activities` - Get activities for contact
- `GET /api/deals/:dealId/activities` - Get activities for deal
- `POST /api/activities` - Create activity

### Contract Templates
- `GET /api/contract-templates` - List all contract templates
- `GET /api/contract-templates/:id` - Get single template
- `GET /api/contract-templates/type/:type` - Get templates by type (lnr/group)
- `POST /api/contract-templates` - Create template
- `PATCH /api/contract-templates/:id` - Update template
- `DELETE /api/contract-templates/:id` - Delete template

### Email Templates
- `GET /api/email-templates` - List all email templates
- `GET /api/email-templates/:id` - Get single template
- `POST /api/email-templates` - Create template
- `PATCH /api/email-templates/:id` - Update template
- `DELETE /api/email-templates/:id` - Delete template

### Email
- `POST /api/send-email` - Send email (currently logs to console)

## User Preferences
- Clean, minimal design inspired by Linear and Notion
- Speed and functionality prioritized over decorative elements
- One-click navigation from main dashboard
- All key information visible on the dashboard

## Recent Changes (Nov 4, 2025)

### Multi-Tenant Authentication (Latest)
- Integrated Replit Auth (OIDC) for authentication with Google, GitHub, email/password support
- Implemented multi-tenancy with complete data isolation between organizations
- Added organizations and sessions tables to database
- Updated all data tables (contacts, deals, activities, templates) with organizationId foreign keys
- Implemented authentication middleware (isAuthenticated) on all API routes
- Created landing page for unauthenticated users
- Built onboarding flow for organization creation on first login
- Updated App.tsx with authentication-aware routing logic
- Added useAuth hook for frontend authentication state management
- Fixed security: organizationId always set server-side, preventing client tampering
- Tested end-to-end with two organizations confirming complete data isolation

### Branding Updates (Nov 4, 2025)
- Updated application branding from generic "CRM" to "RoomRoute"
- Updated landing page hero, sidebar label, onboarding page, and HTML title
- Prepared email system for custom domain support via SENDER_EMAIL environment variable
- Application now ready for RoomRoute.org domain configuration

### Previous Changes
- Implemented complete database schema with all CRM entities
- Built full CRUD API for contacts, deals, activities, and templates
- Connected all frontend pages to backend APIs
- Implemented lead import with CSV file upload and copy-paste
- Integrated email composer with template selection
- Populated database with sample email and contract templates
- Dashboard now shows real data from the database
- Integrated Resend for real email sending
- Added sample contact, deal, and activity data for testing
- Fixed email composer state management for proper recipient handling

---

## 🌐 RoomRoute.org Domain Setup

### Part 1: Add Custom Domain to Replit Deployment

This connects RoomRoute.org to your published Replit app.

#### Steps:

1. **Publish Your App** (if not already published)
   - Click the **Publish** button in Replit
   - Choose **Autoscale Deployment**
   - Wait for deployment to complete

2. **Open Deployment Settings**
   - Go to your deployed app's page
   - Click on **Deployments** tab
   - Click **Settings** or **Custom Domain**

3. **Get DNS Records from Replit**
   - Click **Add Custom Domain**
   - Enter: `roomroute.org`
   - Replit will provide DNS records (typically an `A` record and a `TXT` record)
   - **Keep this page open** - you'll need these values

4. **Configure DNS at Your Domain Registrar**
   - Log in to where you purchased RoomRoute.org
   - Navigate to DNS settings
   - Add the records provided by Replit:
     - **A Record**: Point `@` (root domain) to Replit's IP address
     - **TXT Record**: Add the verification TXT record
   - *Optional*: Add a `CNAME` record for `www` pointing to your main domain

5. **Verify Domain in Replit**
   - Return to Replit deployment settings
   - Click **Verify DNS Records**
   - Status will change from "Pending" to "Verified" (may take 5-48 hours for DNS propagation)

6. **SSL/TLS Certificate**
   - Replit automatically provisions SSL certificates for verified domains
   - Your app will be accessible via `https://roomroute.org`

---

### Part 2: Add Custom Domain to Resend for Email Sending

This allows you to send emails from addresses like `sales@roomroute.org`.

#### Steps:

1. **Log in to Resend Dashboard**
   - Go to https://resend.com/
   - Sign in with your account

2. **Add Domain**
   - Navigate to **Domains** in the left sidebar
   - Click **Add Domain** button
   - Enter: `roomroute.org`
   - Choose a region (select closest to your customers)
   - **Recommendation**: Use a subdomain like `mail.roomroute.org` if you want to keep email separate

3. **Get DNS Records from Resend**
   - Resend will generate three types of DNS records:
     - **SPF (TXT record)**: Specifies which servers can send email for your domain
     - **DKIM (TXT record)**: Email authentication to prevent spoofing
     - **MX record**: Allows bounce/complaint feedback (Priority: 10)
   - **Keep this page open** - you'll need these values

4. **Add DNS Records at Your Domain Registrar**
   - Go back to your domain registrar's DNS settings
   - Add all three records exactly as shown in Resend:
   
   **Example Records** (your actual values will differ):
   ```
   Type: TXT
   Name: resend._domainkey
   Value: p=MIGfMA0GCSqG... (long DKIM key from Resend)
   
   Type: TXT  
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   (Note: If you already have an SPF record, merge them - you can only have ONE SPF record)
   
   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   ```

5. **Verify DNS Records in Resend**
   - Return to Resend dashboard
   - Click **Verify DNS Records**
   - Wait 12-15 minutes for DKIM to verify
   - All three records should show "Verified" (green checkmark)
   - Status may take up to 72 hours but usually verifies within 30 minutes

6. **Create API Key for Custom Domain** (if needed)
   - Go to **API Keys** in Resend dashboard
   - Click **Create API Key**
   - Name: "RoomRoute Production"
   - Permission: "Sending Access"
   - Domain: Select `roomroute.org`
   - **Save the key** - you won't be able to see it again

7. **Update Environment Variable in Replit**
   - Go to your Replit project
   - Open **Secrets** (in Tools pane)
   - Add a new secret:
     - Name: `SENDER_EMAIL`
     - Value: `sales@roomroute.org` (or `info@roomroute.org`, etc.)
   - **Republish** your deployment for changes to take effect

---

### Email Configuration Summary

**Current Setup** (Testing with Resend sandbox):
- From: `User Name <onboarding@resend.dev>`
- Reply-To: `user@actual-email.com`

**After RoomRoute.org Verification**:
- From: `User Name <sales@roomroute.org>` (or whatever you set in SENDER_EMAIL)
- Reply-To: `user@actual-email.com`

The code is already prepared to use the custom domain - just set the `SENDER_EMAIL` environment variable!
