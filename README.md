# RoomRoute CRM

A modern CRM platform designed specifically for hotels and hospitality businesses to manage contacts, deals, and sales pipelines.

## Features

### Core Functionality
- **Contact Management** - Track leads and customer relationships with detailed profiles
- **Deal Pipeline** - Visual pipeline management (New, Qualified, Proposal, Closed)
- **Activity Tracking** - Log calls, emails, meetings, and notes with creator tracking
- **Contract Templates** - Pre-built templates for LNR agreements and group contracts
- **Email Templates** - Professional email templates for outreach and follow-ups
- **Reporting & Analytics** - Export data to CSV, Excel, and PDF formats

### Multi-Tenant Architecture
- **Organizations** - Complete data isolation per hotel/organization
- **User Management** - Role-based access control (User, Admin, Super Admin)
- **Team Invitations** - Invite team members with automatic organization assignment
- **Organization Switching** - Super admins can manage multiple organizations

### Authentication & Security
- **Email/Password Authentication** - Secure bcrypt password hashing
- **Session Management** - PostgreSQL-backed sessions with 7-day expiry
- **Password Reset** - Secure token-based password reset flow
- **Permission Levels** - Granular access control based on user roles

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query (React Query)** for data fetching and caching
- **Wouter** for lightweight routing
- **Tailwind CSS** with shadcn/ui components
- **Lucide Icons** for consistent iconography

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Session-based authentication** with express-session
- **Resend API** for transactional emails
- **Zod** for runtime validation

### Infrastructure
- **Railway** - Hosting and deployment
- **PostgreSQL** - Managed database on Railway
- **GitHub** - Version control and CI/CD

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Contacts, etc.)
│   │   ├── lib/           # Utilities and API client
│   │   └── App.tsx        # Main application component
│   └── index.html
│
├── server/                # Backend Express application
│   ├── routes.ts          # API route handlers
│   ├── authRoutes.ts      # Authentication endpoints
│   ├── auth.ts            # Auth middleware and helpers
│   ├── storage.ts         # Database access layer
│   └── db.ts              # Database connection
│
├── shared/                # Shared code between frontend/backend
│   └── schema.ts          # Database schema and TypeScript types
│
├── scripts/               # Database migrations and utilities
│   ├── addCreatorTracking.cjs
│   ├── addPasswordResetTokensTable.cjs
│   └── seedTemplates.cjs
│
└── docs/                  # Documentation
    ├── CHANGES_BY_CLIENT_LIST.md
    ├── CLIENT_REQUIREMENTS_ANALYSIS.md
    └── CLIENT_RESPONSE_SUMMARY.md
```

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://...

# Session
SESSION_SECRET=your-secret-key-here

# Email (Resend)
RESEND_API_KEY=re_...
SENDER_EMAIL=sales@roomroute.org
APP_URL=https://www.roomroute.org

# Node Environment
NODE_ENV=production
```

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run database migrations**
   ```bash
   npm run migrate
   ```

4. **Seed templates (optional)**
   ```bash
   NODE_ENV=production node scripts/seedTemplates.cjs
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:5000/api

## Deployment

The application is configured for automatic deployment on Railway:

1. **Push to GitHub main branch**
   ```bash
   git push origin main
   ```

2. **Railway auto-deploys**
   - Builds both frontend and backend
   - Runs migrations automatically
   - Restarts with zero downtime

3. **Access production**
   - https://www.roomroute.org

## Scripts

### Database Scripts

```bash
# Add creator tracking columns
NODE_ENV=production node scripts/addCreatorTracking.cjs

# Add password reset tokens table
NODE_ENV=production node scripts/addPasswordResetTokensTable.cjs

# Seed templates for all organizations
NODE_ENV=production node scripts/seedTemplates.cjs
```

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run check
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/user` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Resource Endpoints

All resource endpoints require authentication and are scoped to the user's organization:

- **Contacts**: `/api/contacts`
- **Deals**: `/api/deals`
- **Activities**: `/api/activities`
- **Contract Templates**: `/api/contract-templates`
- **Email Templates**: `/api/email-templates`
- **Organizations**: `/api/organizations`
- **Team**: `/api/team`

Standard REST operations: GET (list/detail), POST (create), PATCH (update), DELETE (remove)

## Recent Updates

### November 2025

- ✅ Creator tracking with timestamps on all records
- ✅ Auto-assignment of invited users to organizations
- ✅ Template library with LNR and group contract templates
- ✅ Mobile-responsive header with visible logout button
- ✅ Contact pagination (10 per page, alphabetical sorting)
- ✅ Clickable activity feed to navigate to contacts
- ✅ Fixed export functions (CSV, Excel, PDF)
- ✅ Complete password reset flow with email tokens

## Contributing

This is a private project for RoomRoute. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved

---

**Last Updated:** November 2025
**Version:** 1.0
**Maintained By:** RoomRoute Development Team
