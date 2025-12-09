import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface LeaderboardEntry {
  user_id: string;
  email: string | null;
  wpm: number;
  xp: number;
  timeframe: 'weekly' | 'monthly' | 'yearly' | 'all';
}

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  timeframe: 'weekly' | 'monthly' | 'yearly' | 'all';
  multiplayerRoomId?: string;
}

const defaultState: LeaderboardState = {
  entries: [],
  timeframe: 'weekly',
  multiplayerRoomId: undefined,
};

const LeaderboardContext = createContext<{
  state: LeaderboardState;
  setTimeframe: (tf: LeaderboardState['timeframe']) => void;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setMultiplayerRoomId: (id: string | undefined) => void;
  refreshLeaderboard: () => Promise<void>;
} | undefined>(undefined);

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LeaderboardState>(defaultState);
  const setTimeframe = (timeframe: LeaderboardState['timeframe']) => setState(prev => ({ ...prev, timeframe }));
  const setEntries = (entries: LeaderboardEntry[]) => setState(prev => ({ ...prev, entries }));
  const setMultiplayerRoomId = (id: string | undefined) => setState(prev => ({ ...prev, multiplayerRoomId: id }));

  // --- Add manual refreshLeaderboard function ---
  const refreshLeaderboard = async (timeframeOverride?: LeaderboardState['timeframe']) => {
    const targetTimeframe = timeframeOverride ?? state.timeframe;
    let query = supabase
      .from('leaderboard')
      .select('user_id, wpm, xp, timeframe, email')
      .eq('timeframe', targetTimeframe);
    const { data, error } = await query;
    if (!error && data) {
      // Sort by WPM (desc), then XP (desc)
      const sorted = [...data].sort((a, b) => b.wpm - a.wpm || b.xp - a.xp);
      setEntries(sorted as LeaderboardEntry[]);
    } else {
      if (error) {
        console.error('Error fetching leaderboard:', error);
      }
      setEntries([]);
    }
  };

  // Refresh when timeframe changes and auto-refresh every hour
  useEffect(() => {
    refreshLeaderboard();
    
    // Auto-refresh leaderboard every hour
    const interval = setInterval(() => {
      refreshLeaderboard();
    }, 60 * 60 * 1000); // 1 hour in milliseconds

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [state.timeframe]);

  return (
    <LeaderboardContext.Provider value={{ state, setTimeframe, setEntries, setMultiplayerRoomId, refreshLeaderboard }}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export function useLeaderboard() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboard must be used within LeaderboardProvider');
  return ctx;
} 