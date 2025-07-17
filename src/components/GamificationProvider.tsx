import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';

export interface GamificationState {
  xp: number;
  level: number;
  badges: string[];
  streak: number;
  leaderboard: Array<{ username: string; wpm: number; xp: number }>;
  gamificationEnabled: boolean;
}

const defaultState: GamificationState = {
  xp: 0,
  level: 1,
  badges: [],
  streak: 0,
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
      clearAllGamificationStorage(); // Always clear on user change for isolation
      if (user && user.id && user.id !== 'guest') {
        const { data, error } = await supabase
          .from('user_gamification')
          .select('xp, level, badges, streak')
          .eq('user_id', user.id)
          .single();
        if (!error && data) {
          setState(prev => ({
            ...prev,
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            badges: data.badges ?? [],
            streak: data.streak ?? 0,
          }));
        } else if (!error && !data) {
          // No record yet, initialize
          await supabase.from('user_gamification').upsert({ user_id: user.id, xp: 0, level: 1, badges: [], streak: 0 });
          setState(prev => ({ ...prev, xp: 0, level: 1, badges: [], streak: 0 }));
        } else if (error) {
          console.error('Error loading gamification data:', error);
        }
      } else {
        // Guest: load from sessionStorage
        const session = sessionStorage.getItem('tt_gamification');
        if (session) {
          setState(prev => ({ ...prev, ...JSON.parse(session) }));
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
  useEffect(() => {
    if (loading || authLoading) return; // Don't persist until initial load and auth are done
    async function persist() {
      if (user && user.id && user.id !== 'guest') {
        const { error } = await supabase.from('user_gamification').upsert({
          user_id: user.id,
          xp: state.xp,
          level: state.level,
          badges: state.badges,
          streak: state.streak,
        });
        if (error) {
          console.error('Error saving gamification data:', error);
        }
      } else {
        sessionStorage.setItem('tt_gamification', JSON.stringify({
          xp: state.xp,
          level: state.level,
          badges: state.badges,
          streak: state.streak,
        }));
      }
    }
    persist();
    // eslint-disable-next-line
  }, [state.xp, state.level, state.badges, state.streak, user && user.id, loading, authLoading]);

  const addXP = (amount: number) => {
    setState(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };
  // Prevent duplicate badges
  const addBadge = (badge: string) => {
    setState(prev => {
      if (prev.badges.includes(badge)) return prev;
      return { ...prev, badges: [...prev.badges, badge] };
    });
  };
  const incrementStreak = () => {
    setState(prev => ({ ...prev, streak: prev.streak + 1 }));
  };
  const resetStreak = () => {
    setState(prev => ({ ...prev, streak: 0 }));
  };
  const setLeaderboard = (data: GamificationState['leaderboard']) => {
    setState(prev => ({ ...prev, leaderboard: data }));
  };
  const setGamificationEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, gamificationEnabled: enabled }));
  };

  return (
    <GamificationContext.Provider value={{ state, addXP, addBadge, incrementStreak, resetStreak, setLeaderboard, setGamificationEnabled }}>
      {children}
    </GamificationContext.Provider>
  );
};

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
} 