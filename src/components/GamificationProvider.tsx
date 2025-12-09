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
  getCurrentStreak: () => number;
  setLeaderboard: (data: GamificationState['leaderboard']) => void;
  setGamificationEnabled: (enabled: boolean) => void;
} | undefined>(undefined);

// Helper function to calculate streak from last test date (defined outside component)
function calculateStreakFromLastTest(lastTestDate: string | null, currentStreak: number): number {
  if (!lastTestDate) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const yesterdayStr = yesterday.toDateString();
  
  const lastTest = new Date(lastTestDate);
  lastTest.setHours(0, 0, 0, 0);
  const lastTestStr = lastTest.toDateString();
  
  // If last test was today, keep current streak (already counted today)
  if (lastTestStr === todayStr) {
    return currentStreak;
  }
  // If last test was yesterday, streak continues
  else if (lastTestStr === yesterdayStr) {
    return currentStreak; // Keep current streak, will increment when test is completed today
  }
  // If last test was more than 1 day ago, reset streak to 0
  else {
    return 0; // Streak broken - reset to 0
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
          // Calculate streak based on last test date - reset if gap is too large
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let calculatedStreak = 0;
          if (lastTestDate) {
            const lastTest = new Date(lastTestDate);
            lastTest.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
            
            // Always validate: if gap is 2+ days, reset to 0
            // If tested yesterday or today, keep streak (but cap at reasonable value)
            if (daysDiff === 0 || daysDiff === 1) {
              // Tested today or yesterday - streak might be valid, but cap it
              const storedStreak = data.streak ?? 0;
              // If stored streak is unreasonably high (like 94), reset it
              if (storedStreak > daysDiff + 5) {
                // Streak seems incorrect - reset to 0 or 1
                calculatedStreak = daysDiff === 0 ? 0 : 1;
              } else {
                calculatedStreak = storedStreak;
              }
            } else {
              // Gap of 2+ days - reset streak to 0
              calculatedStreak = 0;
            }
          } else {
            // No previous test - reset streak
            calculatedStreak = 0;
          }
          
          // If calculated streak is still unreasonably high, force reset
          if (calculatedStreak > 100) {
            calculatedStreak = 0;
          }
          
          setState(prev => ({
            ...prev,
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            badges: data.badges ?? [],
            streak: calculatedStreak,
            lastTestDate: lastTestDate,
          }));
          
          // If streak was reset, update database immediately
          if (calculatedStreak === 0 && (data.streak ?? 0) > 0) {
            supabase.from('user_gamification').upsert({
              user_id: user.id,
              xp: data.xp ?? 0,
              level: data.level ?? 1,
              badges: data.badges ?? [],
              streak: 0,
            }, { onConflict: 'user_id' }).then(({ error }) => {
              if (error) {
                console.error('Error resetting streak:', error);
              }
            });
          }
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
            // Validate and fix streak for guest users too
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toDateString();
            
            let validatedStreak = parsed.streak ?? 0;
            if (parsed.lastTestDate) {
              const lastTest = new Date(parsed.lastTestDate);
              lastTest.setHours(0, 0, 0, 0);
              const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff > 1) {
                // Gap of 2+ days - reset streak
                validatedStreak = 0;
              } else if (daysDiff === 0 || daysDiff === 1) {
                // Tested today or yesterday - validate streak value
                const storedStreak = parsed.streak ?? 0;
                // If streak is unreasonably high, reset it
                if (storedStreak > 100 || storedStreak > daysDiff + 5) {
                  validatedStreak = daysDiff === 0 ? 0 : 1;
                } else {
                  validatedStreak = storedStreak;
                }
              }
            } else {
              // No last test date - reset streak
              validatedStreak = 0;
            }
            
            // Final safety check - cap at reasonable value
            if (validatedStreak > 100) {
              validatedStreak = 0;
            }
            
            setState(prev => ({ 
              ...prev, 
              ...parsed, 
              streak: validatedStreak,
              lastTestDate: parsed.lastTestDate || null 
            }));
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

  // Validate and fix streak on mount/state change - AGGRESSIVE VALIDATION
  useEffect(() => {
    if (loading || authLoading) return;
    
    setState(prev => {
      // If streak is unreasonably high (> 10), force reset unless validated
      if (prev.streak > 10 || prev.streak < 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (prev.lastTestDate) {
          const lastTest = new Date(prev.lastTestDate);
          lastTest.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
          
          // If gap is 2+ days OR streak is way too high for the days difference, reset
          if (daysDiff > 1 || prev.streak > daysDiff + 5) {
            // Force reset and update database
            if (user && user.id && user.id !== 'guest') {
              supabase.from('user_gamification').upsert({
                user_id: user.id,
                streak: 0,
              }, { onConflict: 'user_id' }).then(({ error }) => {
                if (error) console.error('Error resetting streak:', error);
              });
            }
            return { ...prev, streak: 0, lastTestDate: null };
          }
        } else {
          // No lastTestDate but high streak - definitely wrong, reset
          if (user && user.id && user.id !== 'guest') {
            supabase.from('user_gamification').upsert({
              user_id: user.id,
              streak: 0,
            }, { onConflict: 'user_id' }).then(({ error }) => {
              if (error) console.error('Error resetting streak:', error);
            });
          }
          return { ...prev, streak: 0, lastTestDate: null };
        }
      }
      
      // Validate streak based on lastTestDate for any streak value
      if (prev.lastTestDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastTest = new Date(prev.lastTestDate);
        lastTest.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
        
        // If gap is 2+ days, reset streak
        if (daysDiff > 1 && prev.streak > 0) {
          if (user && user.id && user.id !== 'guest') {
            supabase.from('user_gamification').upsert({
              user_id: user.id,
              streak: 0,
            }, { onConflict: 'user_id' }).then(({ error }) => {
              if (error) console.error('Error resetting streak:', error);
            });
          }
          return { ...prev, streak: 0 };
        }
      } else if (prev.streak > 0) {
        // No lastTestDate but streak exists - reset
        if (user && user.id && user.id !== 'guest') {
          supabase.from('user_gamification').upsert({
            user_id: user.id,
            streak: 0,
          }, { onConflict: 'user_id' }).then(({ error }) => {
            if (error) console.error('Error resetting streak:', error);
          });
        }
        return { ...prev, streak: 0 };
      }
      
      return prev;
    });
  }, [loading, authLoading, user, state.streak, state.lastTestDate]);

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
  // This checks if we've already counted today and validates streak continuity
  const incrementStreak = () => {
    setState(prev => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toDateString();
      
      // If we already counted today, don't increment again
      if (prev.lastTestDate === todayStr) {
        return prev;
      }
      
      // Calculate new streak based on last test date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStr = yesterday.toDateString();
      
      let newStreak = 0;
      
      if (!prev.lastTestDate) {
        // First test ever - start at 1
        newStreak = 1;
      } else {
        const lastTest = new Date(prev.lastTestDate);
        lastTest.setHours(0, 0, 0, 0);
        const lastTestStr = lastTest.toDateString();
        
        // Calculate days difference
        const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day - increment streak
          newStreak = prev.streak + 1;
        } else if (daysDiff === 0) {
          // Same day - don't increment (shouldn't happen due to check above, but safety)
          return prev;
        } else {
          // Gap of 2+ days - reset to 1 (starting new streak)
          newStreak = 1;
        }
      }
      
      return { 
        ...prev, 
        streak: Math.max(0, Math.min(newStreak, 999)), // Cap at reasonable max
        lastTestDate: todayStr 
      };
    });
  };
  
  // Reset streak (when user misses a day or accuracy is too low)
  const resetStreak = () => {
    setState(prev => {
      // Also update database immediately
      if (user && user.id && user.id !== 'guest') {
        supabase.from('user_gamification').upsert({
          user_id: user.id,
          streak: 0,
        }, { onConflict: 'user_id' }).then(({ error }) => {
          if (error) console.error('Error resetting streak:', error);
        });
      }
      return { ...prev, streak: 0, lastTestDate: null };
    });
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