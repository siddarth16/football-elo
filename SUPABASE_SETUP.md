# Supabase Setup Instructions

## Why Supabase?

Vercel's serverless environment has a **read-only filesystem**, so we can't save match scores to JSON files in production. Supabase provides:
- ✅ Free PostgreSQL database
- ✅ Built-in authentication (for admin login)
- ✅ Real-time updates
- ✅ Works perfectly with Vercel

## Step-by-Step Setup

### 1. Create Supabase Project (2 minutes)

1. Go to https://supabase.com
2. Sign up or login
3. Click **"New Project"**
4. Fill in:
   - **Name**: `football-elo`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., US East, EU West)
   - **Pricing Plan**: Free
5. Click **"Create new project"** (takes ~2 minutes to provision)

### 2. Get Your API Credentials

Once the project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these 3 values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbG...` (long string)
   - **service_role** key: `eyJhbG...` (different long string) - ⚠️ KEEP SECRET!

### 3. Create Database Schema

1. In your Supabase project, click **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Open the file: `supabase/schema.sql` (in this repo)
4. Copy the entire contents
5. Paste into the Supabase SQL editor
6. Click **"Run"** (bottom right)
7. You should see: ✓ Success. No rows returned

This creates 4 tables: `teams`, `matches`, `predictions`, `parameters`

### 4. Migrate Your Data

1. Install Supabase Python library:
   ```bash
   pip install supabase
   ```

2. Edit `scripts/migrate_to_supabase.py`:
   - Find lines 15-16
   - Replace `YOUR_SUPABASE_URL_HERE` with your Project URL
   - Replace `YOUR_SERVICE_KEY_HERE` with your service_role key

3. Run the migration:
   ```bash
   cd scripts
   python migrate_to_supabase.py
   ```

4. You should see:
   ```
   ✓ Inserted 96 teams
   ✓ Inserted 1752 matches from 2024-25
   ✓ Inserted 304 completed matches from 2025-26
   ✓ Inserted 23 pending matches from 2025-26
   ✓ Inserted 23 predictions
   ```

### 5. Verify Data in Supabase

1. Go to **Table Editor** in Supabase
2. Check each table has data:
   - `teams`: Should have 96 rows
   - `matches`: Should have 2,079 rows (1752 + 304 + 23)
   - `predictions`: Should have 23 rows
   - `parameters`: Should have ~10 rows

### 6. Create Admin User

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: Your email (e.g., `admin@example.com`)
   - **Password**: Create a strong password (SAVE THIS!)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create user"**

This is YOUR admin account for updating scores.

### 7. Add Environment Variables to Vercel

1. Go to your Vercel dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Add these 3 variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key |
   | `SUPABASE_SERVICE_KEY` | Your service_role key |

4. Make sure they're set for **Production**, **Preview**, and **Development**
5. Click **"Save"**

### 8. Add Local Environment Variables

Create a file `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
```

⚠️ **IMPORTANT**: This file is already in `.gitignore` - never commit it to GitHub!

### 9. Done! 🎉

You're all set up! Next, I'll update the code to:
- ✅ Fetch data from Supabase instead of JSON files
- ✅ Save scores to Supabase database
- ✅ Add admin login page (only you can access score entry)
- ✅ Keep regular users able to view predictions without login

---

## Troubleshooting

**Migration fails with "duplicate key error"**
- Your database already has data. Run this in SQL Editor to reset:
  ```sql
  TRUNCATE teams, matches, predictions, parameters CASCADE;
  ```
- Then run the migration script again

**Can't login after creating admin user**
- Make sure you checked "Auto Confirm User"
- Check the email/password are correct
- Try resetting password in Supabase dashboard

**Environment variables not working in Vercel**
- Make sure you clicked "Save" after adding each variable
- Redeploy your app after adding variables
- Check spelling matches exactly (case-sensitive)

---

**Ready?** Let me know when you've completed steps 1-8, and I'll update the code!
