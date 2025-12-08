import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabaseClient';

// Types for tracked stats and personalization
export interface TypingStats {
  wpm: number;
  accuracy: number;
  errorTypes: Record<string, number>; // e.g., { 'punctuation': 3, 'case': 2 }
  fingerUsage: Record<string, number>; // e.g., { 'left-pinky': 10 }
  keystrokeStats: { keyCounts: Record<string, number> };
  history: Array<{ wpm: number; accuracy: number; timestamp: number }>;
}

export interface PersonalizationState {
  stats: TypingStats;
  suggestedDifficulty: string;
  suggestedContentType: string;
}

const defaultStats: TypingStats = {
  wpm: 0,
  accuracy: 100,
  errorTypes: {},
  fingerUsage: {},
  keystrokeStats: { keyCounts: {} },
  history: [],
};

const PersonalizationContext = createContext<{
  state: PersonalizationState;
  updateStats: (stats: Partial<TypingStats>) => void;
  suggestDifficulty: () => string;
  suggestContentType: () => string;
  resetStats: () => Promise<void>;
} | undefined>(undefined);

// --- Supabase table schema (if not present) ---
// Table: user_stats
// Columns: user_id (uuid, primary key), stats (jsonb)

// Add a global hard reset flag
const isHardReset = () => typeof window !== 'undefined' && (window as any).__HARD_RESET_STATS;
const setHardReset = (v: boolean) => { if (typeof window !== 'undefined') (window as any).__HARD_RESET_STATS = v; };

// Utility to clear all stats from both storages
const clearAllStatsStorage = () => {
  localStorage.removeItem('protype_stats');
  sessionStorage.removeItem('protype_stats');
};

export const PersonalizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<PersonalizationState>({
    stats: defaultStats,
    suggestedDifficulty: 'medium',
    suggestedContentType: 'words',
  });
  // Load stats from Supabase or sessionStorage on mount or user change
  React.useEffect(() => {
    if (isHardReset()) {
      setState(prev => ({ ...prev, stats: defaultStats }));
      return;
    }
    async function loadStats() {
      clearAllStatsStorage(); // Always clear on user change for isolation
      if (user && user.id && user.id !== 'guest') {
        // Logged-in: fetch from Supabase
        const { data, error } = await supabase
          .from('user_stats')
          .select('stats')
          .eq('user_id', user.id)
          .single();
        if (!error && data && data.stats) {
          setState(prev => ({
            ...prev,
            stats: { ...defaultStats, ...data.stats },
          }));
        } else if (!error && !data) {
          // No row exists for this user, initialize
          const { error: insertError } = await supabase.from('user_stats').upsert({ 
            user_id: user.id, 
            stats: defaultStats 
          });
          if (insertError) {
            console.error('Error initializing user stats:', insertError);
            console.error('Make sure you have run the database schema in Supabase SQL Editor');
            // Don't crash, just use default state
          } else {
            setState(prev => ({ ...prev, stats: defaultStats }));
          }
        } else {
          // For any other error, do NOT overwrite stats, just log or handle gracefully
          console.error('Failed to load user stats:', error);
          if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
            console.error('⚠️ Database tables not found! Please run the SQL schema in Supabase SQL Editor.');
            console.error('See supabase-schema.sql file for the complete schema.');
          }
        }
      } else {
        // Guest: load from sessionStorage
        const session = sessionStorage.getItem('protype_stats');
        if (session) {
          setState(prev => ({ ...prev, stats: { ...defaultStats, ...JSON.parse(session) } }));
        } else {
          setState(prev => ({ ...prev, stats: defaultStats }));
        }
      }
    }
    loadStats();
    // eslint-disable-next-line
  }, [user && user.id]);

  // Save stats to Supabase or sessionStorage on update
  const persistStats = async (stats: TypingStats) => {
    if (user && user.id && user.id !== 'guest') {
      const { error } = await supabase.from('user_stats').upsert({ user_id: user.id, stats });
      if (error) {
        console.error('Error saving user stats:', error);
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.error('⚠️ Database tables not found! Please run the SQL schema in Supabase SQL Editor.');
        }
      }
    } else {
      sessionStorage.setItem('protype_stats', JSON.stringify(stats));
    }
  };

  // Update stats and recalculate suggestions
  const updateStats = (stats: Partial<TypingStats>) => {
    setState(prev => {
      // Add new test to history
      const now = Date.now();
      const prevHistory = prev.stats.history || [];
      const newEntry = {
        wpm: stats.wpm ?? prev.stats.wpm,
        accuracy: stats.accuracy ?? prev.stats.accuracy,
        timestamp: now,
      };
      const updatedHistory = [...prevHistory, newEntry];
      // Calculate averages
      const avgWpm = Math.round(updatedHistory.reduce((sum, t) => sum + t.wpm, 0) / updatedHistory.length);
      const avgAccuracy = Math.round(updatedHistory.reduce((sum, t) => sum + t.accuracy, 0) / updatedHistory.length);
      // Merge errorTypes and fingerUsage (sum all)
      const mergeCounts = (arr: Record<string, number>[]) => {
        const result: Record<string, number> = {};
        arr.forEach(obj => {
          Object.entries(obj).forEach(([k, v]) => {
            result[k] = (result[k] || 0) + v;
          });
        });
        return result;
      };
      const allErrorTypes = [prev.stats.errorTypes, stats.errorTypes || {}];
      const allFingerUsage = [prev.stats.fingerUsage, stats.fingerUsage || {}];
      const mergedErrorTypes = mergeCounts(allErrorTypes);
      const mergedFingerUsage = mergeCounts(allFingerUsage);
      // Merge keystrokeStats.keyCounts
      const allKeyCounts = [prev.stats.keystrokeStats.keyCounts, (stats.keystrokeStats && stats.keystrokeStats.keyCounts) || {}];
      const mergedKeyCounts = mergeCounts(allKeyCounts);
      const newStats: TypingStats = {
        wpm: avgWpm,
        accuracy: avgAccuracy,
        errorTypes: mergedErrorTypes,
        fingerUsage: mergedFingerUsage,
        keystrokeStats: { keyCounts: mergedKeyCounts },
        history: updatedHistory,
      };
      // Persist to backend or sessionStorage
      persistStats(newStats);
      return {
        ...prev,
        stats: newStats,
        suggestedDifficulty: suggestDifficulty(newStats),
        suggestedContentType: suggestContentType(newStats),
      };
    });
  };

  // Add a function to hard-clear stats from sessionStorage
  const clearStatsFromSessionStorage = () => {
    sessionStorage.removeItem('protype_stats');
  };

  // Update resetStats to also clear sessionStorage and set hard reset flag
  const resetStats = async () => {
    setHardReset(true);
    setState(prev => ({
      ...prev,
      stats: defaultStats,
    }));
    if (user && user.id && user.id !== 'guest') {
      await supabase.from('user_stats').upsert({ user_id: user.id, stats: defaultStats });
    } else {
      clearAllStatsStorage();
      sessionStorage.setItem('protype_stats', JSON.stringify(defaultStats));
    }
    // After a short delay, clear the flag and reload the page
    setTimeout(() => {
      setHardReset(false);
      window.location.reload();
    }, 300);
  };

  // Example suggestion logic (expandable)
  const suggestDifficulty = (stats: TypingStats = state.stats) => {
    if (stats.wpm > 80 && stats.accuracy > 97) return 'long';
    if (stats.wpm > 60 && stats.accuracy > 95) return 'medium';
    if (stats.wpm < 40 || stats.accuracy < 90) return 'short';
    return 'medium';
  };
  const suggestContentType = (stats: TypingStats = state.stats) => {
    if ((stats.errorTypes['punctuation'] || 0) > 3) return 'punctuation';
    if ((stats.errorTypes['numbers'] || 0) > 3) return 'numbers';
    return 'words';
  };

  return (
    <PersonalizationContext.Provider value={{ state, updateStats, suggestDifficulty, suggestContentType, resetStats }}>
      {children}
    </PersonalizationContext.Provider>
  );
};

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
} 