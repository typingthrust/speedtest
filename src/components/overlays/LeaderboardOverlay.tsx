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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col items-center max-h-[95vh] min-w-0 sm:min-w-[320px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* X Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-card/50 transition-colors z-10"
          aria-label="Close leaderboard"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full px-4 sm:px-6 py-6 overflow-y-auto scrollbar-hide">
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-xs flex flex-col items-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base sm:text-lg font-bold mb-3 text-foreground">Share Leaderboard</h2>
        <input
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={link}
          readOnly
          onFocus={e => e.target.select()}
        />
        <div className="flex gap-2 w-full mb-3">
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${copied ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <button className="text-muted-foreground hover:text-foreground text-sm transition-colors" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// Helper to get display name - uses username for security
function getDisplayName(entry: any) {
  if (entry.username && entry.username !== 'NULL') return entry.username;
  if (entry.user_id) return 'User_' + entry.user_id.slice(0, 6);
  return 'User';
}

export default function LeaderboardOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { state, setTimeframe, refreshLeaderboard } = useLeaderboard();
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuth();
  const link = 'https://typingthrust.com/leaderboard';

  // Refresh leaderboard when overlay opens or timeframe changes
  useEffect(() => {
    if (open === 'leaderboard') {
      refreshLeaderboard(state.timeframe);
    }
  }, [open, state.timeframe, refreshLeaderboard]);

  // Use real user ID/email for filtering
  const currentUserId = user?.id;
  const currentUserEmail = user?.email;

  // Sort all entries by WPM (desc), then XP (desc)
  const sorted = [...state.entries].sort((a, b) => b.wpm - a.wpm || b.xp - a.xp);
  
  // Find current user's entry and index
  const userIdx = sorted.findIndex(e => e.user_id === currentUserId);
  const userEntry = userIdx !== -1 ? sorted[userIdx] : null;
  
  // Filter out current user from the displayed list (show only top 5 others)
  const filteredEntries = sorted.filter(e => e.user_id !== currentUserId);

  return (
    <MinimalLeaderboardOverlay open={open === 'leaderboard'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-4 sm:gap-5 items-center">
        <header className="w-full flex flex-row items-center justify-between mb-1 pr-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leaderboard</h1>
          <button
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            onClick={() => setShareOpen(true)}
            aria-label="Share leaderboard"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Share</span>
          </button>
        </header>
        {/* Timeframe Filters */}
        <div className="flex flex-wrap gap-2 mb-2 w-full justify-center">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${state.timeframe === tf.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted'}`}
              onClick={() => {
                setTimeframe(tf.value as any);
                // Refresh immediately when timeframe changes
                setTimeout(() => refreshLeaderboard(tf.value as any), 100);
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {/* Leaderboard List */}
        <section className="w-full flex flex-col gap-2">
          {filteredEntries.length === 0 && sorted.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-muted-foreground text-sm">No leaderboard data</span>
              <p className="text-xs text-muted-foreground mt-2">
                Complete a typing test while logged in to appear on the leaderboard
              </p>
            </div>
          ) : filteredEntries.length === 0 && userEntry ? (
            <div className="text-center py-8">
              <span className="text-muted-foreground text-sm">You're the only one on the leaderboard!</span>
              <div className="mt-4">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 border-primary bg-primary/10 ring-2 ring-primary/20 font-semibold w-full" style={{ minHeight: 56 }}>
                  <span className="w-6 sm:w-8 text-center text-base sm:text-lg font-bold text-primary select-none">1</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden text-primary-foreground">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <span className="flex-1 truncate text-primary text-sm sm:text-base font-medium">{getDisplayName(userEntry)}</span>
                  <span className="w-14 sm:w-16 text-center text-primary font-mono text-sm sm:text-base">{userEntry.wpm} WPM</span>
                  <span className="hidden sm:block w-14 text-center text-primary font-mono text-sm">{userEntry.xp ?? 0} XP</span>
                </div>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredEntries.slice(0, 5).map((entry, i) => (
                <li
                  key={getDisplayName(entry)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-all duration-200`}
                  style={{ minHeight: 56 }}
                >
                  <span className="w-6 sm:w-8 text-center text-base sm:text-lg font-bold text-muted-foreground select-none">{i + 1}</span>
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden text-foreground/70">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <span className="flex-1 truncate text-foreground text-sm sm:text-base font-medium">{getDisplayName(entry)}</span>
                  <span className="w-14 sm:w-16 text-center text-primary font-mono text-sm sm:text-base">{entry.wpm} WPM</span>
                  <span className="hidden sm:block w-14 text-center text-muted-foreground font-mono text-sm">{entry.xp ?? 0} XP</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Current User Row (if not in top 5) */}
        {userIdx > 4 && userEntry && (
          <div className="w-full flex flex-col items-center mt-2">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 border-primary bg-primary/10 ring-2 ring-primary/20 font-semibold w-full" style={{ minHeight: 56 }}>
              <span className="w-6 sm:w-8 text-center text-base sm:text-lg font-bold text-primary select-none">{userIdx + 1}</span>
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden text-primary-foreground">
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span className="flex-1 truncate text-primary text-sm sm:text-base font-medium">{getDisplayName(userEntry)}</span>
              <span className="w-14 sm:w-16 text-center text-primary font-mono text-sm sm:text-base">{userEntry.wpm} WPM</span>
              <span className="hidden sm:block w-14 text-center text-primary font-mono text-sm">{userEntry.xp ?? 0} XP</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1.5">Your rank</span>
          </div>
        )}
      </section>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} link={link} />
    </MinimalLeaderboardOverlay>
  );
} 