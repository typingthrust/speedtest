-- Cleanup Demo Leaderboard Data and Restore Constraints
-- Run this in Supabase SQL Editor to remove demo data and restore original table constraints

-- STEP 1: Delete all demo entries (identified by @example.com email pattern)
DELETE FROM leaderboard WHERE email LIKE '%@example.com';

-- STEP 2: Restore the NOT NULL constraint on user_id
ALTER TABLE leaderboard ALTER COLUMN user_id SET NOT NULL;

-- STEP 3: Restore the foreign key constraint
-- Note: This will fail if there are any remaining entries with invalid user_ids
-- If it fails, first check for invalid entries:
-- SELECT * FROM leaderboard WHERE user_id NOT IN (SELECT id FROM auth.users);

ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the cleanup
-- Run this to check if any demo entries remain:
-- SELECT COUNT(*) FROM leaderboard WHERE email LIKE '%@example.com';
-- Should return 0

