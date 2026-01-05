-- Add username column to leaderboard table
-- Run this in Supabase SQL Editor

ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Update existing entries to use email prefix as username (if username is null)
UPDATE leaderboard 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

