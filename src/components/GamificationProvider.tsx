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
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>(defaultState);
  const [loading, setLoading] = useState(true);

  // Load gamification data on mount or user change
  useEffect(() => {
    async function loadGamification() {
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
        } else {
          // No record yet, initialize
          await supabase.from('user_gamification').upsert({ user_id: user.id, xp: 0, level: 1, badges: [], streak: 0 });
          setState(prev => ({ ...prev, xp: 0, level: 1, badges: [], streak: 0 }));
        }
      } else {
        // Guest: load from localStorage
        const local = localStorage.getItem('tt_gamification');
        if (local) {
          setState(prev => ({ ...prev, ...JSON.parse(local) }));
        } else {
          setState(defaultState);
        }
      }
      setLoading(false);
    }
    loadGamification();
  }, [user && user.id]);

  // Persist to Supabase/localStorage on state change (except loading)
  useEffect(() => {
    if (loading) return;
    async function persist() {
      if (user && user.id && user.id !== 'guest') {
        await supabase.from('user_gamification').upsert({
          user_id: user.id,
          xp: state.xp,
          level: state.level,
          badges: state.badges,
          streak: state.streak,
        });
      } else {
        localStorage.setItem('tt_gamification', JSON.stringify({
          xp: state.xp,
          level: state.level,
          badges: state.badges,
          streak: state.streak,
        }));
      }
    }
    persist();
  }, [state.xp, state.level, state.badges, state.streak, user && user.id, loading]);

  const addXP = (amount: number) => {
    setState(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };
  const addBadge = (badge: string) => {
    setState(prev => ({ ...prev, badges: [...prev.badges, badge] }));
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