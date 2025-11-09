# 🚀 RUN MIGRATIONS NOW - Step by Step

## Quick Method: Railway Dashboard (5 minutes)

### Step 1: Go to Railway PostgreSQL Database

1. Go to: https://railway.app
2. Click on your project: **empathetic-upliftment**
3. Click on the **PostgreSQL** database service (not the roomroute-crm service)

### Step 2: Open Query Tab

1. Look for **"Data"** or **"Query"** tab
2. Click on it

### Step 3: Copy and Paste This SQL

```sql
-- Add new columns for email/password authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Make email required (should already be, but ensuring)
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
```

### Step 4: Click "Run" or "Execute"

You should see:
```
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE INDEX
CREATE INDEX
```

### Step 5: Verify It Worked

Run this query:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

You should see `password`, `birthday`, and `auth_provider` columns in the list.

---

## ✅ After Migrations Complete

Test the signup:

1. Visit: https://roomroute-crm-production-dd6e.up.railway.app
2. Click **"Get Started"**
3. Create a test account:
   - First Name: Josh
   - Last Name: Test
   - Email: josh+test@roomroute.org
   - Password: Test1234!
   - Confirm Password: Test1234!
4. Click **"Sign Up"**

Should redirect you to onboarding/dashboard! 🎉

---

## If You Get Stuck

Alternative: Connect via psql or any PostgreSQL client:

1. In Railway, click PostgreSQL service
2. Go to "Connect" tab
3. Copy the connection string (DATABASE_URL)
4. Use any PostgreSQL client to connect and run the SQL above

---

## Need Help?

Screenshot any errors you see and I'll help troubleshoot!
