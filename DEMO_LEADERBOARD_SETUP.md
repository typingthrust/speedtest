# Demo Leaderboard Data Setup

To enable demo leaderboard data generation, you need to temporarily modify the table constraints and create a database function in Supabase.

## Steps:

1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com
   - Select your project
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Temporarily Modify Table Constraints (REQUIRED)**
   - Run these commands FIRST to allow demo entries:
   ```sql
   -- Drop foreign key constraint temporarily
   ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;
   
   -- Make user_id nullable temporarily
   ALTER TABLE leaderboard ALTER COLUMN user_id DROP NOT NULL;
   ```

3. **Create the Function**
   - Open the file `generate-demo-leaderboard-function.sql` in this project
   - Copy **ALL** the SQL code
   - Paste it into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Use the Feature**
   - Open the Leaderboard overlay in the app
   - Click the "Generate Demo Data" button
   - The leaderboard will be populated with 10 demo users across all timeframes

5. **Optional: Restore Constraints (After Testing)**
   - If you want to restore the original constraints after testing:
   ```sql
   ALTER TABLE leaderboard ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_user_id_fkey 
     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

## What the Function Does:

- Creates 10 demo users with realistic WPM and XP values
- Generates entries for all timeframes: weekly, monthly, yearly, and all-time
- Adds variation to WPM and XP values for different timeframes
- Uses `SECURITY DEFINER` to bypass RLS policies for demo data insertion

## Important Notes:

- **The table constraints must be modified first** - the function will fail without this step
- Demo entries are identified by email addresses ending in `@example.com`
- You can delete demo entries anytime by running: `DELETE FROM leaderboard WHERE email LIKE '%@example.com';`
- The function uses deterministic UUIDs for demo users, so running it multiple times will update existing entries
