import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface LeaderboardEntry {
  username: string;
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
} | undefined>(undefined);

export const LeaderboardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LeaderboardState>(defaultState);
  const setTimeframe = (timeframe: LeaderboardState['timeframe']) => setState(prev => ({ ...prev, timeframe }));
  const setEntries = (entries: LeaderboardEntry[]) => setState(prev => ({ ...prev, entries }));
  const setMultiplayerRoomId = (id: string | undefined) => setState(prev => ({ ...prev, multiplayerRoomId: id }));

  useEffect(() => {
    async function fetchLeaderboard() {
      let query = supabase
        .from('leaderboard')
        .select('username, wpm, xp, timeframe')
        .eq('timeframe', state.timeframe);
      const { data, error } = await query;
      if (!error && data) {
        // Sort by WPM (desc), then XP (desc)
        const sorted = [...data].sort((a, b) => b.wpm - a.wpm || b.xp - a.xp);
        setEntries(sorted as LeaderboardEntry[]);
      } else {
        setEntries([]);
      }
    }
    fetchLeaderboard();
  }, [state.timeframe]);

  return (
    <LeaderboardContext.Provider value={{ state, setTimeframe, setEntries, setMultiplayerRoomId }}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export function useLeaderboard() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboard must be used within LeaderboardProvider');
  return ctx;
} 