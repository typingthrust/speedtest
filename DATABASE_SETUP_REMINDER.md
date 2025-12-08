# ⚠️ Database Setup Required

## You're seeing "Database error saving new user" because:

The database tables haven't been created in your Supabase project yet.

## Quick Fix (2 minutes):

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Database Schema
1. Open the file `supabase-schema.sql` in this project
2. Copy **ALL** the SQL code
3. Paste it into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Tables Created
1. Go to **Table Editor** in left sidebar
2. You should see 4 tables:
   - ✅ `test_results`
   - ✅ `user_gamification`
   - ✅ `user_stats`
   - ✅ `leaderboard`

### Step 4: Refresh Your App
1. Refresh your browser
2. Try signing up again
3. Error should be gone!

---

## What the Error Means:

- **"relation does not exist"** = Tables not created
- **"permission denied"** = RLS policies not set up
- **"PGRST116"** = Table doesn't exist

All of these are fixed by running the SQL schema!

---

## Need Help?

1. Check `supabase-schema.sql` file exists
2. Make sure you copied ALL the SQL (not just part of it)
3. Check Supabase Table Editor to verify tables exist
4. Check browser console for specific error messages

---

**After running the schema, the app will work perfectly!** ✅

