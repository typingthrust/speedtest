# Demo Leaderboard Data Setup

To enable demo leaderboard data generation, you need to create a database function in Supabase.

## Steps:

1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com
   - Select your project
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Run the Function**
   - Open the file `generate-demo-leaderboard-function.sql` in this project
   - Copy ALL the SQL code
   - Paste it into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Use the Feature**
   - Open the Leaderboard overlay in the app
   - Click the "Generate Demo Data" button
   - The leaderboard will be populated with 10 demo users across all timeframes

## What the Function Does:

- Creates 10 demo users with realistic WPM and XP values
- Generates entries for all timeframes: weekly, monthly, yearly, and all-time
- Adds variation to WPM and XP values for different timeframes
- Uses `SECURITY DEFINER` to bypass RLS policies for demo data insertion

## Note:

If you don't create the database function, the "Generate Demo Data" button will try to insert data directly, but it may fail due to database constraints (foreign keys, RLS policies). The database function is the recommended approach.

