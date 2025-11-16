# RoomRoute CRM - Claude Development Rules

## Project Overview
RoomRoute CRM is a hospitality-focused sales management platform built with TypeScript, Express.js, React, and PostgreSQL. It features multi-tenant architecture with organization-based data isolation.

## Tech Stack
- **Backend:** Node.js + Express.js + TypeScript
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Session-based (express-session) with bcryptjs
- **Storage:** Google Cloud Storage
- **Validation:** Zod schemas
- **Email:** Resend API

## Architecture Patterns

### Multi-Tenancy
- **CRITICAL:** ALL data queries MUST be filtered by `organizationId`
- Users can belong to multiple organizations via `userOrganizations` junction table
- Every API endpoint (except auth) must enforce organization-scoped data access
- Never expose data across organizations - data isolation is paramount

### Code Organization
```
client/src/          → Frontend React code
  pages/            → Page components
  components/       → Reusable UI components
  lib/              → Utilities and API client
  hooks/            → Custom React hooks

server/             → Backend Express code
  routes.ts         → Main API routes (50+ endpoints)
  authRoutes.ts     → Authentication endpoints
  storage.ts        → Data access layer
  auth.ts           → Auth middleware
  objectStorage.ts  → GCS integration

shared/             → Shared between client & server
  schema.ts         → Drizzle schema + Zod validation
```

### Type Safety
- Use TypeScript everywhere - no `any` types
- Drizzle ORM provides type-safe database queries
- Zod schemas validate all inputs (client + server)
- Shared schema ensures type consistency across stack

## Development Guidelines

### Database Schema Changes
1. **Always modify** `shared/schema.ts` first
2. Run `npm run db:push` to sync changes to database
3. Create migration with `drizzle-kit generate`
4. Test migration with `npm run migrate`
5. Update Zod schemas if adding/changing fields

### API Endpoint Development
```typescript
// Pattern for new endpoints in server/routes.ts
app.post("/api/resource", requireAuth, async (req, res) => {
  // 1. Get organizationId from session
  const organizationId = req.session.organizationId;

  // 2. Validate input with Zod
  const parsed = insertResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  // 3. Add organizationId to data
  const data = { ...parsed.data, organizationId };

  // 4. Use storage layer
  const result = await storage.createResource(data);

  // 5. Return result
  res.json(result);
});
```

### Authentication & Authorization
- Use `requireAuth` middleware for protected routes
- Check `req.session.user` for current user
- Use `req.session.organizationId` for org-scoped queries
- Roles: `user`, `admin`, `super_admin`
- Admin routes should check `req.session.user.role`

### Storage Layer Pattern
- **Always use** `server/storage.ts` methods, never direct database queries in routes
- Storage methods handle organization filtering automatically
- Add new methods to `IStorage` interface when needed
- Keep business logic in storage layer, not routes

### Frontend Development
- Use TanStack Query for API calls
- API client in `client/src/lib/api.ts`
- Follow shadcn/ui patterns for components
- Use Tailwind CSS for styling
- Wouter for routing

### Validation Rules
```typescript
// Client schema (no organizationId)
export const insertContactSchema = z.object({
  leadOrProject: z.string(),
  company: z.string(),
  // ...
});

// Server schema (adds organizationId)
export const insertContactSchemaServer = insertContactSchema.extend({
  organizationId: z.number(),
});
```

## Code Standards

### Naming Conventions
- **Files:** camelCase (e.g., `authRoutes.ts`, `storage.ts`)
- **Components:** PascalCase (e.g., `ContactDialog.tsx`)
- **Functions:** camelCase (e.g., `createContact`)
- **Types/Interfaces:** PascalCase (e.g., `IStorage`, `Contact`)
- **Database tables:** camelCase (e.g., `contacts`, `userOrganizations`)

### Error Handling
```typescript
// Use try-catch in routes
try {
  const result = await storage.someMethod();
  res.json(result);
} catch (error) {
  console.error("Error in endpoint:", error);
  res.status(500).json({ error: "Internal server error" });
}
```

### API Response Format
- Success: `res.json(data)` - return data directly
- Error: `res.status(4xx|5xx).json({ error: "message" })`
- Use appropriate status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors)

## Database Patterns

### Queries with Drizzle
```typescript
// ✅ Good - Organization-scoped
const contacts = await db
  .select()
  .from(schema.contacts)
  .where(eq(schema.contacts.organizationId, organizationId));

// ❌ Bad - Missing organization filter
const contacts = await db.select().from(schema.contacts);
```

### Relationships
- Use `leftJoin` for optional relations
- Use `innerJoin` for required relations
- Always include `organizationId` in join conditions when needed

## Security Rules

### CRITICAL Security Requirements
1. **Never** expose data across organizations
2. **Always** validate `organizationId` from session, never from request body
3. **Always** hash passwords with bcryptjs (10 rounds)
4. **Never** log sensitive data (passwords, tokens, session data)
5. **Always** use parameterized queries (Drizzle handles this)
6. **Validate** all user inputs with Zod schemas

### Password Reset Flow
1. User requests reset → generates token with expiry
2. Email sent via Resend API
3. Token validated on reset page
4. Password updated, token deleted
5. User must login with new password

## Testing Guidelines
- Test organization data isolation
- Test role-based access control
- Test input validation
- Test authentication flows
- Manual testing for now (no automated tests yet)

## Environment Variables
Required in `.env`:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=...
RESEND_API_KEY=...
SENDER_EMAIL=...
APP_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

## Common Tasks

### Adding a New Resource
1. Add table to `shared/schema.ts`
2. Add Zod schemas (client + server)
3. Run `npm run db:push`
4. Add storage methods to `server/storage.ts`
5. Add API routes to `server/routes.ts`
6. Create frontend page/components
7. Add API calls to `client/src/lib/api.ts`

### Adding a New Field to Existing Table
1. Modify table in `shared/schema.ts`
2. Update Zod schemas
3. Run `npm run db:push`
4. Update storage methods if needed
5. Update frontend forms/displays

### Debugging Tips
- Check `req.session.user` and `req.session.organizationId`
- Use `console.log` for development (logged to terminal)
- Check PostgreSQL logs for query issues
- Use browser DevTools Network tab for API debugging

## Git Commit Guidelines
- **DO NOT** include Claude co-author attribution in commits
- Write clear, concise commit messages in imperative mood (e.g., "Add feature" not "Added feature")
- Keep commit messages focused on the "why" rather than the "what"
- Format: Short summary (50 chars max), blank line, detailed explanation if needed

## Deployment (Railway)
- Auto-deploys from `main` branch
- Runs migrations automatically
- Environment variables configured in Railway dashboard
- Database hosted on Railway
- Trust proxy enabled for secure cookies

## Important Files Reference
- [server/routes.ts](server/routes.ts) - Main API routes (1,602 lines)
- [server/storage.ts](server/storage.ts) - Data access layer (679 lines)
- [shared/schema.ts](shared/schema.ts) - Database schema
- [server/authRoutes.ts](server/authRoutes.ts) - Auth endpoints
- [server/index.ts](server/index.ts) - Express app setup
- [client/src/lib/api.ts](client/src/lib/api.ts) - API client

## Known Patterns in Codebase
- Routes file is large (1,602 lines) - consider breaking into modules if adding many endpoints
- Storage layer uses interface pattern for testability
- Frontend uses dialog components for create/edit operations
- Pagination is 10 items per page, alphabetical order
- Activity feed shows most recent first

## When Making Changes
1. **Always** maintain multi-tenant data isolation
2. **Always** update both client and server schemas
3. **Always** test with multiple organizations
4. **Always** handle errors gracefully
5. **Consider** performance with large datasets
6. **Document** complex business logic
7. **Follow** existing code patterns and structure
