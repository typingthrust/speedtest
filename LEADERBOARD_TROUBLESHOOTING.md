# Leaderboard Troubleshooting Guide

## Current Status
✅ Query is working correctly  
✅ No errors in fetching  
❌ Leaderboard table is empty (no data)

## Root Cause
The leaderboard table is empty because **no data has been inserted yet**. The leaderboard only gets populated when:
1. A user is **logged in** (not guest)
2. User **completes a typing test**
3. The `updateLeaderboard` function is called

## How to Test & Populate Leaderboard

### Step 1: Make sure you're logged in
- Click the user icon in the navbar
- Sign up or log in with an account
- **Important**: Guest users won't have data saved to leaderboard

### Step 2: Complete a typing test
- Start typing a test
- Complete it (finish the text or let timer run out)
- Check browser console - you should see:
  ```
  🔵 updateLeaderboard called with userId: [your-user-id] wpm: [your-wpm]
  ✅ updateLeaderboard: userEmail: [your-email]
  Successfully updated leaderboard (all) - WPM: [wpm] XP: [xp]
  Successfully updated leaderboard (weekly) - WPM: [wpm] XP: [xp]
  Successfully updated leaderboard (monthly) - WPM: [wpm] XP: [xp]
  Successfully updated leaderboard (yearly) - WPM: [wpm] XP: [xp]
  ```

### Step 3: Check leaderboard
- Open leaderboard overlay
- You should now see your entry
- Try different timeframes (Weekly, Monthly, Yearly, All Time)

## Verify Data in Supabase

### Option 1: Check via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Select `leaderboard` table
4. You should see entries with your user_id

### Option 2: Check via SQL Editor
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM leaderboard ORDER BY wpm DESC;
```

## Common Issues

### Issue: "No leaderboard data" even after completing test

**Check 1: Are you logged in?**
- Look for user icon in navbar - should show your email/name
- If it shows "Guest" or login button, you need to log in first

**Check 2: Check browser console**
- Look for errors when completing test
- Should see "updateLeaderboard called" message
- If you see "No valid userId provided", you're not logged in

**Check 3: Check Supabase RLS Policies**
Run in Supabase SQL Editor:
```sql
-- Check if policy exists
SELECT * FROM pg_policies WHERE tablename = 'leaderboard';

-- Should see: "Leaderboard is publicly readable" for SELECT
-- Should see: "Users can insert own leaderboard entries" for INSERT
```

**Check 4: Verify data was inserted**
```sql
-- Check if any data exists
SELECT COUNT(*) FROM leaderboard;

-- Check your specific entry
SELECT * FROM leaderboard WHERE user_id = '[your-user-id]';
```

### Issue: Data exists but not showing in UI

**Check 1: Refresh leaderboard**
- Close and reopen leaderboard overlay
- Click different timeframe buttons
- Check console for "Fetching leaderboard" messages

**Check 2: Verify timeframe**
- Make sure you're checking the correct timeframe
- Data is stored per timeframe (weekly, monthly, yearly, all)

**Check 3: Check RLS policy**
- Leaderboard should be publicly readable
- Run: `SELECT * FROM pg_policies WHERE tablename = 'leaderboard';`

## Quick Test Script

To quickly test if leaderboard insertion works, run this in Supabase SQL Editor (replace with your actual user_id):

```sql
-- Get your user_id first
SELECT id, email FROM auth.users LIMIT 1;

-- Then insert test data (replace 'YOUR_USER_ID' with actual ID)
INSERT INTO leaderboard (user_id, email, wpm, xp, timeframe)
VALUES 
  ('YOUR_USER_ID', 'test@example.com', 100, 5000, 'all'),
  ('YOUR_USER_ID', 'test@example.com', 95, 4500, 'weekly'),
  ('YOUR_USER_ID', 'test@example.com', 90, 4000, 'monthly'),
  ('YOUR_USER_ID', 'test@example.com', 85, 3500, 'yearly')
ON CONFLICT (user_id, timeframe) 
DO UPDATE SET wpm = EXCLUDED.wpm, xp = EXCLUDED.xp;
```

Then refresh the leaderboard overlay - you should see the test data.

## Next Steps

1. **Complete a test while logged in** - This will populate the leaderboard
2. **Check console logs** - Verify updateLeaderboard is being called
3. **Verify in Supabase** - Check if data exists in the table
4. **Refresh leaderboard** - Close and reopen the overlay

The code is working correctly - you just need to have at least one completed test from a logged-in user to see data!

