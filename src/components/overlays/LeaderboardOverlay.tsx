import React, { useRef, useEffect, useState } from 'react';
import { useOverlay } from '../OverlayProvider';
import { X, Share2, User as UserIcon, Award } from 'lucide-react';
import { useLeaderboard } from '../LeaderboardProvider';
import { useAuth } from '../AuthProvider';

const TIMEFRAMES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'All Time', value: 'all' },
];

function MinimalLeaderboardOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (backdropRef.current && e.target === backdropRef.current) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-2xl mx-4 sm:mx-auto bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center min-h-[60vh] max-h-[95vh] min-w-0 sm:min-w-[320px] px-4 p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(51, 65, 85, 0.5)' }}
      >
        {/* X Close Button absolutely positioned, not in header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close leaderboard"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-2 sm:px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ open, onClose, link }: { open: boolean; onClose: () => void; link: string }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col items-center animate-fade-in">
        <h2 className="text-lg font-bold mb-2 text-slate-100">Share Leaderboard</h2>
        <input
          className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-700 text-sm mb-3 text-center text-slate-100"
          value={link}
          readOnly
          onFocus={e => e.target.select()}
        />
        <div className="flex gap-2 w-full mb-3">
          <button
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-slate-900 ${copied ? 'bg-slate-600' : 'bg-primary hover:opacity-90'}`}
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <button className="text-slate-400 hover:text-slate-200 mt-2" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// Helper to get display name
function getDisplayName(entry: any) {
  if (entry.email && entry.email !== 'NULL') return entry.email;
  if (entry.user_id) return entry.user_id.slice(0, 6) + '...' + entry.user_id.slice(-4);
  return 'User';
}

export default function LeaderboardOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { state, setTimeframe, refreshLeaderboard } = useLeaderboard();
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuth();
  const link = 'https://typingthrust.com/leaderboard';

  // Refresh leaderboard when overlay opens
  useEffect(() => {
    if (open === 'leaderboard') {
      refreshLeaderboard();
    }
  }, [open, refreshLeaderboard]);

  // Use real user ID/email for filtering
  const currentUserId = user?.id;
  const currentUserEmail = user?.email;

  // Sort all entries by WPM (desc), then XP (desc)
  const sorted = [...state.entries].sort((a, b) => b.wpm - a.wpm || b.xp - a.xp);
  
  // Find current user's entry and index
  const userIdx = sorted.findIndex(e => e.user_id === currentUserId || e.email === currentUserEmail);
  const userEntry = userIdx !== -1 ? sorted[userIdx] : null;
  
  // Filter out current user from the displayed list (show only top 5 others)
  const filteredEntries = sorted.filter(e => e.user_id !== currentUserId && e.email !== currentUserEmail);

  return (
    <MinimalLeaderboardOverlay open={open === 'leaderboard'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-6 items-center">
        <header className="w-full flex flex-row items-center justify-between mb-2 pr-14">
          <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-slate-900 font-semibold hover:opacity-90 transition"
              onClick={() => setShareOpen(true)}
              aria-label="Share leaderboard"
            >
              <Share2 className="w-5 h-5" /> Share
            </button>
        </header>
        {/* Timeframe Filters */}
        <div className="flex gap-2 mb-4">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${state.timeframe === tf.value ? 'bg-primary text-slate-900' : 'bg-slate-700 text-slate-300'}`}
              onClick={() => setTimeframe(tf.value as any)}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {/* Leaderboard List */}
        <section className="w-full flex flex-col gap-2">
          {filteredEntries.length === 0 ? (
            <span className="text-slate-400">No leaderboard data</span>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredEntries.slice(0, 5).map((entry, i) => (
                <li
                  key={getDisplayName(entry)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl shadow-sm border border-slate-600 bg-slate-700/80 transition-all duration-200`}
                  style={{ minHeight: 56 }}
                >
                  <span className="w-8 text-center text-lg font-bold text-slate-400 select-none">{i + 1}</span>
                  <span className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden text-slate-300 font-bold text-base">
                    <UserIcon className="w-6 h-6" />
                  </span>
                  <span className="flex-1 truncate text-slate-100 text-base font-medium">{getDisplayName(entry)}</span>
                  <span className="w-16 text-center text-primary font-mono text-base">{entry.wpm} WPM</span>
                  <span className="w-14 text-center text-slate-400 font-mono text-sm">{entry.xp ?? 0} XP</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Current User Row (if not in top 5) */}
        {userIdx > 4 && userEntry && (
          <div className="w-full flex flex-col items-center mt-2">
            <div className="flex items-center gap-2 px-3 py-3 rounded-2xl shadow-sm border border-primary bg-slate-700 ring-2 ring-primary/50 font-bold scale-[1.03]" style={{ minHeight: 56 }}>
              <span className="w-8 text-center text-lg font-bold text-primary select-none">{userIdx + 1}</span>
              <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden text-slate-900 font-bold text-base">
                <UserIcon className="w-6 h-6" />
              </span>
              <span className="flex-1 truncate text-primary text-base font-medium">{getDisplayName(userEntry)}</span>
              <span className="w-16 text-center text-primary font-mono text-base">{userEntry.wpm} WPM</span>
              <span className="w-14 text-center text-primary font-mono text-sm">{userEntry.xp ?? 0} XP</span>
            </div>
            <span className="text-xs text-slate-400 mt-1">Your rank</span>
          </div>
        )}
      </section>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} link={link} />
    </MinimalLeaderboardOverlay>
  );
} 