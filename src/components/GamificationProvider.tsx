import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';

export interface GamificationState {
  xp: number;
  level: number;
  badges: string[];
  streak: number;
  lastTestDate: string | null; // Track last test date for streak calculation
  leaderboard: Array<{ username: string; wpm: number; xp: number }>;
  gamificationEnabled: boolean;
}

const defaultState: GamificationState = {
  xp: 0,
  level: 1,
  badges: [],
  streak: 0,
  lastTestDate: null,
  leaderboard: [],
  gamificationEnabled: true,
};

const GamificationContext = createContext<{
  state: GamificationState;
  addXP: (amount: number) => void;
  addBadge: (badge: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setLeaderboard: (data: GamificationState['leaderboard']) => void;
  setGamificationEnabled: (enabled: boolean) => void;
} | undefined>(undefined);

// Helper function to calculate streak from last test date (defined outside component)
function calculateStreakFromLastTest(lastTestDate: string | null, currentStreak: number): number {
  if (!lastTestDate) return 0;
  
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  // If last test was today, keep current streak (or increment if first test today)
  if (lastTestDate === today) {
    return currentStreak; // Already counted today
  }
  // If last test was yesterday, increment streak
  else if (lastTestDate === yesterdayStr) {
    return currentStreak + 1;
  }
  // If last test was more than 1 day ago, reset streak
  else {
    return 0;
  }
}

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GamificationState>(defaultState);
  const [loading, setLoading] = useState(true);

  // Utility to clear all gamification data from both storages
  const clearAllGamificationStorage = () => {
    localStorage.removeItem('tt_gamification');
    sessionStorage.removeItem('tt_gamification');
  };

  // Load gamification data on mount or user change, but only after auth is done loading
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish
    async function loadGamification() {
      // Reset state first for proper user isolation
      setState(defaultState);
      setLoading(true);
      clearAllGamificationStorage(); // Always clear on user change for isolation
      
      if (user && user.id && user.id !== 'guest') {
        // Get gamification data and last test date
        const { data, error } = await supabase
          .from('user_gamification')
          .select('xp, level, badges, streak')
          .eq('user_id', user.id)
          .single();
        
        // Get last test date from test_results to calculate streak
        const { data: lastTest, error: lastTestError } = await supabase
          .from('test_results')
          .select('timestamp')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle to handle no results gracefully
        
        const lastTestDate = lastTest?.timestamp ? new Date(lastTest.timestamp).toDateString() : null;
        
        if (!error && data) {
          // Calculate streak based on last test date
          const calculatedStreak = calculateStreakFromLastTest(lastTestDate, data.streak ?? 0);
          
          setState(prev => ({
            ...prev,
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            badges: data.badges ?? [],
            streak: calculatedStreak,
            lastTestDate: lastTestDate,
          }));
        } else if (!error && !data) {
          // No record yet, initialize
          const { error: insertError } = await supabase.from('user_gamification').upsert({ 
            user_id: user.id, 
            xp: 0, 
            level: 1, 
            badges: [], 
            streak: 0 
          });
          if (insertError) {
            console.error('Error initializing gamification data:', insertError);
            console.error('Make sure you have run the database schema in Supabase SQL Editor');
            // Don't crash, just use default state
          } else {
            setState(prev => ({ ...prev, xp: 0, level: 1, badges: [], streak: 0, lastTestDate: null }));
          }
        } else if (error) {
          console.error('Error loading gamification data:', error);
          console.error('Error details:', error.message, error.code);
          if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.error('⚠️ Database tables not found! Please run the SQL schema in Supabase SQL Editor.');
            console.error('See supabase-schema.sql file for the complete schema.');
          }
        }
      } else {
        // Guest: load from sessionStorage
        const session = sessionStorage.getItem('tt_gamification');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            setState(prev => ({ ...prev, ...parsed, lastTestDate: parsed.lastTestDate || null }));
          } catch (e) {
            console.error('Error parsing sessionStorage gamification data:', e);
            setState(defaultState);
          }
        } else {
          setState(defaultState);
        }
      }
      setLoading(false);
    }
    loadGamification();
    // eslint-disable-next-line
  }, [user && user.id, authLoading]);

  // Persist to Supabase/sessionStorage on state change (except loading)
  // Use debouncing to prevent race conditions and excessive writes
  useEffect(() => {
    if (loading || authLoading) return; // Don't persist until initial load and auth are done
    
    // Debounce persistence to prevent race conditions
    const timeoutId = setTimeout(async () => {
      if (user && user.id && user.id !== 'guest') {
        // Use a more robust upsert with proper conflict handling
        const { error } = await supabase.from('user_gamification').upsert({
          user_id: user.id,
          xp: state.xp,
          level: state.level,
          badges: state.badges,
          streak: state.streak,
        }, {
          onConflict: 'user_id',
        });
        
        // Note: lastTestDate is not stored in DB, it's calculated from test_results
        if (error) {
          console.error('Error saving gamification data:', error);
          console.error('Error details:', error.message, error.code);
          if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.error('⚠️ Database tables not found! Please run the SQL schema in Supabase SQL Editor.');
            console.error('See supabase-schema.sql file for the complete schema.');
          } else if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.error('⚠️ Permission denied! Check Row Level Security (RLS) policies in Supabase.');
          }
        }
      } else {
        // Guest: save to sessionStorage
        try {
          sessionStorage.setItem('tt_gamification', JSON.stringify({
            xp: state.xp,
            level: state.level,
            badges: state.badges,
            streak: state.streak,
            lastTestDate: state.lastTestDate,
          }));
        } catch (e) {
          console.error('Error saving to sessionStorage:', e);
        }
      }
    }, 500); // 500ms debounce to batch rapid updates
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line
  }, [state.xp, state.level, state.badges, state.streak, state.lastTestDate, user && user.id, loading, authLoading]);

  const addXP = (amount: number) => {
    if (amount <= 0) return; // Prevent negative or zero XP
    setState(prev => {
      const newXP = Math.max(0, prev.xp + amount); // Ensure XP never goes negative
      const newLevel = Math.max(1, Math.floor(newXP / 100) + 1); // Level starts at 1
      return { ...prev, xp: newXP, level: newLevel };
    });
  };
  
  // Prevent duplicate badges
  const addBadge = (badge: string) => {
    if (!badge || badge.trim() === '') return; // Prevent empty badges
    setState(prev => {
      // Check if badge already exists (case-insensitive check)
      const badgeLower = badge.toLowerCase();
      const hasBadge = prev.badges.some(b => b.toLowerCase() === badgeLower);
      if (hasBadge) return prev; // Already has badge
      return { ...prev, badges: [...prev.badges, badge] };
    });
  };
  
  // Increment streak (should be called once per day, not per test)
  // This checks if we've already counted today
  const incrementStreak = () => {
    setState(prev => {
      const today = new Date().toDateString();
      
      // If we already counted today, don't increment again
      if (prev.lastTestDate === today) {
        return prev;
      }
      
      // Calculate new streak based on last test date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      let newStreak = 0;
      if (prev.lastTestDate === yesterdayStr) {
        // Consecutive day - increment
        newStreak = prev.streak + 1;
      } else if (!prev.lastTestDate) {
        // First test ever
        newStreak = 1;
      } else {
        // Gap in days - reset to 1 (starting new streak)
        newStreak = 1;
      }
      
      return { 
        ...prev, 
        streak: Math.max(0, newStreak),
        lastTestDate: today 
      };
    });
  };
  
  // Reset streak (when user misses a day or accuracy is too low)
  const resetStreak = () => {
    setState(prev => ({ ...prev, streak: 0, lastTestDate: null }));
  };
  
  // Helper to get current streak (useful for badge checks)
  const getCurrentStreak = () => {
    return state.streak;
  };
  
  const setLeaderboard = (data: GamificationState['leaderboard']) => {
    setState(prev => ({ ...prev, leaderboard: data }));
  };
  const setGamificationEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, gamificationEnabled: enabled }));
  };

  return (
    <GamificationContext.Provider value={{ state, addXP, addBadge, incrementStreak, resetStreak, getCurrentStreak, setLeaderboard, setGamificationEnabled }}>
      {children}
    </GamificationContext.Provider>
  );
};

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
} 