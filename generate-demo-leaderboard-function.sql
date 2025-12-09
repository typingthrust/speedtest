-- Database function to generate demo leaderboard data
-- Run this in Supabase SQL Editor to enable demo data generation
-- This function bypasses RLS to insert demo entries

CREATE OR REPLACE FUNCTION generate_demo_leaderboard_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- Loop through each timeframe
  FOR timeframe_val IN SELECT unnest(ARRAY['weekly', 'monthly', 'yearly', 'all']) LOOP
    -- Loop through each demo user
    FOR i IN 0..jsonb_array_length(demo_users) - 1 LOOP
      demo_user := demo_users->i;
      
      -- Generate fake user_id (using a deterministic UUID based on index)
      fake_user_id := gen_random_uuid();
      
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
        updated_at = NOW();
    END LOOP;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_demo_leaderboard_data() TO authenticated;

