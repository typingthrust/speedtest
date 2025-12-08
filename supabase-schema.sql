-- TypingThrust Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: test_results
-- Stores individual typing test results
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wpm INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  errors INTEGER NOT NULL DEFAULT 0,
  time INTEGER NOT NULL, -- Time taken in seconds
  consistency INTEGER, -- Consistency score (0-100)
  keystroke_stats JSONB DEFAULT '{}'::jsonb, -- { total, correct, incorrect, extra, keyCounts }
  error_types JSONB DEFAULT '{}'::jsonb, -- { punctuation, case, number, other }
  word_count INTEGER,
  duration INTEGER, -- Test duration setting (15, 30, 60, 120 seconds)
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_gamification
-- Stores user gamification data (XP, levels, badges, streaks)
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  badges TEXT[] DEFAULT '{}', -- Array of badge names
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_stats
-- Stores user typing statistics and personalization data
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb, -- { wpm, accuracy, errorTypes, fingerUsage, keystrokeStats, history }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: leaderboard
-- Stores leaderboard entries for different timeframes
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  wpm INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('weekly', 'monthly', 'yearly', 'all')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, timeframe) -- One entry per user per timeframe
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_timeframe ON leaderboard(timeframe);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wpm ON leaderboard(timeframe, wpm DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_timeframe ON leaderboard(user_id, timeframe);

-- Enable Row Level Security (RLS)
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_results
-- Users can only see their own test results
CREATE POLICY "Users can view own test results"
  ON test_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own test results
CREATE POLICY "Users can insert own test results"
  ON test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own test results
CREATE POLICY "Users can delete own test results"
  ON test_results FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_gamification
-- Users can view their own gamification data
CREATE POLICY "Users can view own gamification"
  ON user_gamification FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own gamification data
CREATE POLICY "Users can insert own gamification"
  ON user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gamification data
CREATE POLICY "Users can update own gamification"
  ON user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own gamification data
CREATE POLICY "Users can delete own gamification"
  ON user_gamification FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_stats
-- Users can view their own stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own stats
CREATE POLICY "Users can delete own stats"
  ON user_stats FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboard
-- Everyone can view leaderboard (public read)
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT
  USING (true);

-- Only authenticated users can insert/update leaderboard entries
CREATE POLICY "Users can insert own leaderboard entries"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entries"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to sync leaderboard when test results are inserted
-- This can be called from your application or set up as a trigger
CREATE OR REPLACE FUNCTION update_leaderboard_on_test_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert leaderboard entry for 'all' timeframe
  INSERT INTO leaderboard (user_id, email, wpm, xp, timeframe)
  VALUES (
    NEW.user_id,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    NEW.wpm,
    (SELECT COALESCE(xp, 0) FROM user_gamification WHERE user_id = NEW.user_id),
    'all'
  )
  ON CONFLICT (user_id, timeframe)
  DO UPDATE SET
    wpm = GREATEST(leaderboard.wpm, NEW.wpm),
    xp = (SELECT COALESCE(xp, 0) FROM user_gamification WHERE user_id = NEW.user_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Trigger to auto-update leaderboard (uncomment if you want automatic updates)
-- CREATE TRIGGER trigger_update_leaderboard
--   AFTER INSERT ON test_results
--   FOR EACH ROW
--   EXECUTE FUNCTION update_leaderboard_on_test_result();

