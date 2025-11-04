# CRM Application

## Overview
A comprehensive CRM (Customer Relationship Management) system built with Node.js, React, and PostgreSQL. The application features contact management, deal tracking, activity logging, sales pipeline management, contract templates, email templates, and lead import functionality.

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
- **contacts**: Customer contact information
- **deals**: Sales opportunities with value and stage tracking
- **activities**: Activity log for contacts and deals
- **contract_templates**: Reusable contract templates (LNR and Group categories)
- **email_templates**: Email templates with subject and body
- **users**: Authentication (basic structure)

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

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/import` - Bulk import contacts

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
