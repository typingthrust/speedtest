-- Database function to generate demo leaderboard data
-- Run this in Supabase SQL Editor to enable demo data generation
-- 
-- IMPORTANT: This function requires temporarily modifying the table constraint.
-- Run these commands FIRST before creating the function:
--
-- 1. Temporarily drop the foreign key constraint:
--    ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;
--
-- 2. Make user_id nullable temporarily:
--    ALTER TABLE leaderboard ALTER COLUMN user_id DROP NOT NULL;
--
-- 3. Then run this function creation script
--
-- 4. After testing, you can optionally restore the constraint:
--    ALTER TABLE leaderboard ALTER COLUMN user_id SET NOT NULL;xDfc e4r.

--    ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_user_id_fkey 
--      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION generate_demo_leaderboard_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_users JSONB := '[
    {"email": "typer.pro@example.com", "wpm": 145, "xp": 12500},
    {"email": "speed.demon@example.com", "wpm": 138, "xp": 11200},
    {"email": "keyboard.master@example.com", "wpm": 132, "xp": 9800},
    {"email": "fast.fingers@example.com", "wpm": 128, "xp": 8700},
    {"email": "typing.champ@example.com", "wpm": 125, "xp": 7600},
    {"email": "quick.typer@example.com", "wpm": 118, "xp": 6500},
    {"email": "speed.racer@example.com", "wpm": 115, "xp": 5400},
    {"email": "word.wizard@example.com", "wpm": 112, "xp": 4800},
    {"email": "keyboard.king@example.com", "wpm": 108, "xp": 4200},
    {"email": "typing.ninja@example.com", "wpm": 105, "xp": 3800}
  ]'::jsonb;
  demo_user JSONB;
  timeframe_val TEXT;
  wpm_val INTEGER;
  xp_val INTEGER;
  fake_user_id UUID;
  i INTEGER;
BEGIN
  -- First, delete any existing demo entries (identified by email pattern)
  DELETE FROM leaderboard WHERE email LIKE '%@example.com';
  
  -- Loop through each timeframe
  FOR timeframe_val IN SELECT unnest(ARRAY['weekly', 'monthly', 'yearly', 'all']) LOOP
    -- Loop through each demo user
    FOR i IN 0..jsonb_array_length(demo_users) - 1 LOOP
      demo_user := demo_users->i;
      
      -- Generate a deterministic UUID for each demo user
      fake_user_id := ('00000000-0000-0000-' || LPAD(i::text, 4, '0') || '-' || LPAD(i::text, 12, '0'))::UUID;
      
      -- Add some variation for different timeframes
      wpm_val := (demo_user->>'wpm')::INTEGER + (random() * 10 - 5)::INTEGER;
      wpm_val := GREATEST(50, wpm_val); -- Ensure minimum WPM
      
      xp_val := (demo_user->>'xp')::INTEGER + (random() * 500 - 250)::INTEGER;
      xp_val := GREATEST(0, xp_val); -- Ensure non-negative XP
      
      -- Insert or update leaderboard entry
      INSERT INTO leaderboard (user_id, email, wpm, xp, timeframe)
      VALUES (
        fake_user_id,
        demo_user->>'email',
        wpm_val,
        xp_val,
        timeframe_val
      )
      ON CONFLICT (user_id, timeframe) 
      DO UPDATE SET
        wpm = EXCLUDED.wpm,
        xp = EXCLUDED.xp,
        email = EXCLUDED.email,
        updated_at = NOW();
    END LOOP;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_demo_leaderboard_data() TO authenticated;

