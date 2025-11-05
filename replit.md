# RoomRoute - Multi-Tenant Hotel CRM

## Overview
RoomRoute is a comprehensive multi-tenant CRM designed for hotels and hospitality businesses. It provides complete data isolation between organizations, manages contacts and deals, tracks activities, and offers sales pipeline management. Key capabilities include contract and email templating, lead import functionality, and robust revenue tracking with potential value calculations. The project aims to streamline CRM processes for the hospitality sector.

## Recent Updates (November 2025) - Ready for Production

### Latest Features (November 5, 2025)
**Replit Object Storage Integration for Contract Uploads**:
1. **Secure File Upload**: Integrated Replit Object Storage for actual contract file uploads (PDF, Word, etc.) with protected access and ACL policies
2. **ObjectUploader Component**: Created reusable file upload component using Uppy library with drag-and-drop interface and upload progress tracking
3. **Protected File Serving**: Uploaded contracts are stored in private object storage directory with authenticated access only
4. **Server Infrastructure**: 
   - `server/objectStorage.ts`: Handles presigned URL generation, file uploads, and ACL policy management
   - `server/objectAcl.ts`: Implements access control policies for private objects
   - New endpoints: POST /api/objects/upload (get upload URL), PUT /api/contracts (set ACL policy), GET /objects/:objectPath (serve protected files)
5. **Active Accounts Page**: Updated to use ObjectUploader component for file uploads instead of URL-only input
6. **Environment Variables**: Object storage configured with DEFAULT_OBJECT_STORAGE_BUCKET_ID, PUBLIC_OBJECT_SEARCH_PATHS, and PRIVATE_OBJECT_DIR

**Deal Editing and Active Accounts Management**:
1. **Deal Editing**: Deals in the pipeline are now clickable, opening an edit dialog to update deal details (title, value, stage, contact, close date)
2. **Active Accounts Page**: New dedicated page for managing closed deals (won business). When a deal stage is set to "closed", it automatically moves from the pipeline to Active Accounts
3. **Contract Upload**: Closed deals in Active Accounts can upload actual contract files (PDF, Word, etc.) stored securely in Replit Object Storage with protected access
4. **Deal Lifecycle Management**: 
   - Closed deals appear only in Active Accounts (removed from pipeline)
   - Reopen action moves deals back to "Qualified" stage in pipeline
   - Edit, Upload Contract, and Reopen actions available for each active account
5. **Schema Update**: Added `contractUrl` field to deals table to store contract file paths

### Bug Fixes (November 5, 2025)
Fixed 9 critical bugs:
1. **Deal Creation Validation**: Removed probability field completely from deals schema, forms (deals.tsx, pipeline.tsx), and all related validation
2. **Date Picker Timezone Issue**: Fixed off-by-one day bug caused by timezone conversion. Now stores dates as raw yyyy-MM-dd strings and converts to Date objects only for ORM insertion
3. **Team Invite Visibility**: Fixed invite button not showing for organization admins. Updated role check to include user.role === "admin" for org creators
4. **Lead Pipeline Metric Mismatch**: Removed .slice(0,10) limit from dashboard calculation so Pipeline Overview shows total from ALL contacts, not just first 10
5. **Outreach Activities Display**: Added comprehensive outreach history section in contact view details dialog with chronological timeline, timestamps, and descriptions
6. **This Month KPI Clickability**: Changed onClick from undefined to navigate to /reports page when clicked
7. **Object Storage Path Normalization**: Fixed critical bug in `normalizeObjectEntityPath` where leading slashes weren't stripped from URL pathname and PRIVATE_OBJECT_DIR, causing contract upload path normalization to fail. Added defensive validation in PUT /api/contracts to ensure only properly normalized /objects/... paths are persisted
8. **Three-Dot Menu Functionality**: Fixed all pages (Dashboard, /pipeline, /deals) to have fully functional three-dot dropdown menus with Edit/Delete deal functionality. Rebuilt /deals page to replace static DealCard component with dynamic cards featuring working dropdown menus. Added conditional rendering to PipelineStage to only show dropdown when handlers are provided (prevents errors on Leads column which contains contacts, not deals)
9. **Archived Organization Visibility**: Fixed organization switcher dropdown to filter out archived organizations. Added frontend filter in OrganizationSwitcher component to only display organizations where active !== false, preventing archived hotels from appearing in super admin's organization selection dropdown

### Previous Updates
- **Bug Fixes**: Fixed outreach save with empty notes, super admin onboarding bypass, dashboard month-over-month metrics, pipeline overview showing leads correctly, and removed debug validation button from settings
- **Potential Value Field**: Added potentialValue field to contact creation/editing with automatic number-to-decimal conversion, enabling accurate pipeline value calculations
- **Schema Improvements**: Enhanced insertContactSchema to accept numeric potential values from frontend and convert to decimal strings for database storage
- **Branding**: Added RoomRoute logo to login page (large, centered) and dashboard header (small, upper right corner)
- **Organization Archiving**: Super admin can now archive/restore organizations from Settings page. Archived organizations are blocked from user access via authentication middleware and hidden from organization switcher
- **Quality Assurance**: Comprehensive end-to-end testing completed - all features working correctly

## User Preferences
- Clean, minimal design inspired by Linear and Notion
- Speed and functionality prioritized over decorative elements
- One-click navigation from main dashboard
- All key information visible on the dashboard

## System Architecture

### Multi-Tenancy and Authentication
- **Complete data isolation**: Each organization has separate login credentials and data access. All data tables include `organizationId` foreign keys with server-side enforcement.
- **Authentication**: Replit Auth (OIDC) supporting Google, GitHub, and email/password. Features a landing page for unauthenticated users and an onboarding flow for new users to create an organization on first login. Session management is PostgreSQL-backed.
- **Security**: `organizationId` is always set server-side via `getEffectiveOrgId()` helper to prevent data isolation breaches.
- **Super Admin**: Master account (josh.gaddis@roomroute.org) with `role='super_admin'` can switch between all organizations using dropdown in header. Super admin has NULL organizationId and uses `currentOrganizationId` for context switching.
- **Multi-User Support**: Each organization can have multiple users with role-based permissions (admin/user). Organization creator is auto-assigned as admin.
- **Active Status Check**: Deactivated users (active=false in user_organizations) are blocked from all authenticated requests.
- **Organization Archiving**: Organizations have an `active` boolean field (default true). Archived organizations (active=false) are blocked at authentication middleware level, preventing user access. Only super admin can archive/restore via Settings page "Danger Zone". Archived organizations are hidden from organization switcher dropdown.

### Frontend (React + Vite)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + Shadcn UI components
- **Design System**: Linear/Notion-inspired aesthetic.

### Backend (Node.js + Express)
- **Server**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **API**: RESTful JSON API

### Core Features
- **Contact Management**: CRUD operations for contacts, with search and filter capabilities. Contact cards display relevant information. Clickable contact names open outreach tracking dialog.
- **Deal Pipeline**: Tracks sales opportunities through stages (Lead → Qualified → Proposal → Negotiation) with value tracking. Visual pipeline overview on the dashboard. Deals are clickable to edit details. Closed deals automatically move to Active Accounts.
- **Active Accounts**: Dedicated page for managing closed/won deals. Features include editing account details, uploading signed contract URLs, and reopening deals back to pipeline if needed. Shows total value of all active accounts.
- **Lead Import**: Supports bulk import via CSV and Excel (.xlsx) files or copy-paste. Features intelligent column mapping and validation for hospitality-specific fields like `lead_or_project`, `segment`, and `est_room_nights`.
- **Template Management**:
    - **Contract Templates**: Create, edit, and use LNR (Long-term rental) and Group contract templates.
    - **Email Templates**: Pre-built templates (Introduction, Follow-up, Proposal) with automatic recipient replacement, accessible via an email composer.
- **Revenue Calculator**: Interactive tool for estimating potential revenue based on rooms, nights, weeks, and price.
- **Outreach Tracking**: Click contact names to log outreach attempts with date, contact method (Call, Email, Text, In-Person, LinkedIn, Other), and notes. Supports multiple attempts plus additional notes. All outreach saves to activities table with proper activity type mapping.
- **Reports & Analytics**: Comprehensive reporting system with date range filtering and multi-format export (CSV, Excel, PDF):
    - **Lead Activity Report**: All activities, new leads, and closed deals for selected date range
    - **Lead Pipeline Potential Report**: Sum of all contact potential values with lead details
    - **Deal Pipeline Report**: Closed deals and total revenue by date range
    - **Lapsed Contacts Report**: Shows days since last contact for each lead, highlighting leads lapsed 30+ and 60+ days
- **Dashboard**: Displays KPI metrics (Total Contacts, Active Deals, Pipeline Value, Weekly Activity), recent activity feed, pipeline overview, and quick actions.
- **Team Management**: Admin users can invite team members via email, assign roles (user/admin), and deactivate users. Features soft delete (sets active=false) to preserve data while revoking access. Team page shows all members with their role, status, and activity.

### Database Schema Highlights
- `organizations`: Root entity for multi-tenancy.
- `users`: Stores user details with `organizationId` (primary org) and `currentOrganizationId` (for super_admin switching). Includes `role` field (user/admin/super_admin).
- `user_organizations`: Junction table for multi-user support. Fields: userId, organizationId, role (user/admin), active (boolean for soft delete).
- `contacts`: Stores lead/customer data including `lead_or_project`, `segment`, `company`, `primary_contact`, `email`, `phone`, `est_room_nights`, and `organization_id`.
- `deals`: Tracks sales opportunities with fields: `title`, `value`, `stage`, `expectedCloseDate`, `contactUrl` (for signed contracts), and `organization_id` for data isolation.
- `activities`, `contract_templates`, `email_templates`: All include `organization_id` for data isolation.

## External Dependencies
- **Replit Auth (OIDC)**: For user authentication.
- **PostgreSQL (Neon)**: Main database for persistent data storage.
- **Resend**: Email sending service for transactional and templated emails.
- **xlsx**: JavaScript library for parsing Excel (.xlsx) files for lead import.
- **Lucide React**: Icon library.
- **date-fns**: For date formatting utilities.