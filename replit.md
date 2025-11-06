# RoomRoute - Multi-Tenant Hotel CRM

## Overview
RoomRoute is a comprehensive multi-tenant CRM designed for hotels and hospitality businesses. It provides complete data isolation between organizations, manages contacts and deals, tracks activities, and offers sales pipeline management. Key capabilities include contract and email templating, lead import functionality, and robust revenue tracking with potential value calculations. The project aims to streamline CRM processes for the hospitality sector, offering a robust solution for managing client relationships and sales pipelines in the hospitality industry.

## User Preferences
- Clean, minimal design inspired by Linear and Notion
- Speed and functionality prioritized over decorative elements
- One-click navigation from main dashboard
- All key information visible on the dashboard

## System Architecture

### Multi-Tenancy and Authentication
The system enforces complete data isolation with `organizationId` foreign keys on all data tables, enforced server-side. Authentication is handled via Replit Auth (OIDC) supporting Google, GitHub, and email/password, with PostgreSQL-backed session management. New users undergo an onboarding flow to create an organization. A Super Admin role (`role='super_admin'`) allows switching between all organizations. Each organization supports multiple users with role-based permissions (admin/user). Deactivated users or archived organizations are blocked via middleware, preserving data while restricting access.

**Invitation Tracking System**: The platform includes a comprehensive invitation tracking system. When admins or super admins invite new users, invitation records are created with status tracking (pending/accepted/cancelled). Invitations are displayed on the Team Management page alongside active users. When an invited user logs in for the first time, pending invitations are automatically accepted, adding the user to the appropriate organization with the designated role. The system maintains an audit trail with timestamps for invitation sent/accepted events and tracks who sent each invitation.

**Session Management**: The logout endpoint (`/api/logout`) properly destroys sessions by calling `req.session.destroy()`, clearing session cookies, and redirecting to the OIDC logout endpoint. This ensures complete session cleanup and prevents session reuse, providing incognito-style logout behavior.

**Switch User Flow**: Designed for shared computer environments common in hotels, the system implements a switch user confirmation screen. When users log out, their information (name and email) is stored in localStorage before session destruction, and they are redirected to `/switch-user`. This page offers two options: (1) "Yes, I'm [Name]" to quickly re-authenticate as the same user, or (2) "I understand - Clear last user info" to clear the stored information and prepare for a different user login. The UI dynamically updates based on localStorage state, showing user-specific options when a last user is detected or generic messaging when cleared. This feature addresses the common hotel scenario where multiple staff members share workstations throughout the day.

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + Shadcn UI components
- **Design System**: Linear/Notion-inspired aesthetic.

### Backend
- **Server**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **API**: RESTful JSON API

### Core Features
- **Contact Management**: CRUD operations for contacts, with search, filter, and outreach tracking.
- **Deal Pipeline**: Manages sales opportunities through stages, with value tracking and integration with Active Accounts upon closure.
- **Active Accounts**: Dedicated management for closed deals, including contract uploads via Replit Object Storage and options to reopen deals.
- **Lead Import**: Supports bulk import via CSV/Excel with intelligent column mapping and validation.
- **Template Management**: Creation and use of contract and email templates.
- **Revenue Calculator**: Interactive tool for estimating potential revenue.
- **Outreach Tracking**: Logging of outreach attempts with detailed activity tracking.
- **Reports & Analytics**: Comprehensive reporting (Lead Activity, Pipeline Potential, Deal Pipeline, Lapsed Contacts) with date filtering and multi-format export.
- **Dashboard**: Displays KPI metrics, recent activity, pipeline overview, and quick actions.
- **Team Management**: Admin users can invite, assign roles, and deactivate team members.

### Database Schema Highlights
- `organizations`: Root entity for multi-tenancy.
- `users`: Stores user details and roles, linked to organizations.
- `user_organizations`: Junction table for multi-user, multi-organization relationships with role and active status.
- `user_invitations`: Tracks invitation lifecycle with status (pending/accepted/cancelled), timestamps (sentAt/acceptedAt), inviter attribution, and organization association.
- `contacts`: Stores lead/customer data including hospitality-specific fields.
- `deals`: Tracks sales opportunities with financial and status details.
- `activities`, `contract_templates`, `email_templates`: All feature `organization_id` for data isolation.

## External Dependencies
- **Replit Auth (OIDC)**: User authentication.
- **PostgreSQL (Neon)**: Main database.
- **Resend**: Email sending service.
- **xlsx**: For parsing Excel files.
- **Lucide React**: Icon library.
- **date-fns**: Date formatting utilities.