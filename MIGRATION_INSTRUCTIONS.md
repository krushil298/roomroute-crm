# Database Migration Instructions

## After Deployment to Railway

Once the new code is deployed, you need to run the database migrations to add the new authentication fields.

### Option 1: Via Railway CLI (if logged in)

```bash
railway run npm run migrate
```

### Option 2: Via Railway Dashboard

1. Go to Railway Dashboard
2. Click on your `roomroute-crm` service
3. Go to the **"Deployments"** tab
4. Click on the latest successful deployment
5. Click **"View Logs"** or **"..."** → **"Shell"**
6. In the shell, run:
   ```bash
   npm run migrate
   ```

### Option 3: Manual SQL (if needed)

If the migration script doesn't work, you can run the SQL manually:

1. In Railway, click on the **PostgreSQL** database service
2. Go to **"Connect"** tab
3. Copy the connection command or use the **"Query"** tab
4. Run the SQL from `migrations/001_add_password_auth.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
```

## Verify Migration

After running migrations, verify the columns were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';
```

You should see:
- `password` (VARCHAR)
- `birthday` (TIMESTAMP)
- `auth_provider` (TEXT)

## What Changed

- Added `password` field for storing hashed passwords
- Added `birthday` field (optional) for user signup
- Added `auth_provider` field to track auth method (email, google, apple)
- Made `email` NOT NULL (should already be, but ensuring)
- Added indexes for better query performance
