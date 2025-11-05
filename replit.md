# RoomRoute - Multi-Tenant Hotel CRM

## Overview
RoomRoute is a comprehensive multi-tenant CRM designed for hotels and hospitality businesses. It provides complete data isolation between organizations, manages contacts and deals, tracks activities, and offers sales pipeline management. Key capabilities include contract and email templating, lead import functionality, and robust revenue tracking with potential value calculations. The project aims to streamline CRM processes for the hospitality sector.

## Recent Updates (November 2025)
- **Bug Fixes**: Fixed 6 critical bugs including outreach save with empty notes, super admin onboarding bypass, dashboard month-over-month metrics, pipeline overview showing leads correctly, and removed debug validation button from settings
- **Potential Value Field**: Added potentialValue field to contact creation/editing with automatic number-to-decimal conversion, enabling accurate pipeline value calculations
- **Schema Improvements**: Enhanced insertContactSchema to accept numeric potential values from frontend and convert to decimal strings for database storage
- **Branding**: Added RoomRoute logo to login page (large, centered) and dashboard header (small, upper right corner)

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
- **Deal Pipeline**: Tracks sales opportunities through stages (Lead → Qualified → Proposal → Negotiation → Closed) with value and probability tracking. Visual pipeline overview on the dashboard.
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
- `deals`, `activities`, `contract_templates`, `email_templates`: All include `organization_id` for data isolation.

## External Dependencies
- **Replit Auth (OIDC)**: For user authentication.
- **PostgreSQL (Neon)**: Main database for persistent data storage.
- **Resend**: Email sending service for transactional and templated emails.
- **xlsx**: JavaScript library for parsing Excel (.xlsx) files for lead import.
- **Lucide React**: Icon library.
- **date-fns**: For date formatting utilities.