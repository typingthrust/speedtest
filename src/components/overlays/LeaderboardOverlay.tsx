import React, { useRef, useEffect, useState } from 'react';
import { useOverlay } from '../OverlayProvider';
import { X, Share2, User as UserIcon, Award } from 'lucide-react';
import { useLeaderboard } from '../LeaderboardProvider';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-2xl mx-auto bg-white/90 rounded-3xl border border-white/30 shadow-xl flex flex-col items-center min-h-[60vh] max-h-[95vh] min-w-[90vw] sm:min-w-[320px] px-4 p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        {/* X Close Button absolutely positioned, not in header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close leaderboard"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-2 sm:px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col items-center animate-fade-in">
        <h2 className="text-lg font-bold mb-2 text-gray-900">Share Leaderboard</h2>
        <input
          className="w-full px-3 py-2 rounded border border-gray-200 bg-gray-50 text-sm mb-3 text-center text-gray-900"
          value={link}
          readOnly
          onFocus={e => e.target.select()}
        />
        <div className="flex gap-2 w-full mb-3">
          <button
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-white ${copied ? 'bg-gray-700' : 'bg-gray-900 hover:bg-gray-700'}`}
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <button className="text-gray-500 hover:text-gray-900 mt-2" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function LeaderboardOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { state, setTimeframe } = useLeaderboard();
  const [shareOpen, setShareOpen] = useState(false);
  const currentUser = 'You'; // TODO: Replace with real user from AuthProvider if available
  const link = 'https://typingthrust.com/leaderboard';

  // Already sorted by WPM, XP in provider
  const sorted = state.entries;
  const userIdx = sorted.findIndex(e => e.username === currentUser);
  const userEntry = sorted[userIdx];

  return (
    <MinimalLeaderboardOverlay open={open === 'leaderboard'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-6 items-center">
        <header className="w-full flex flex-row items-center justify-between mb-2 pr-14">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <button
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
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
              className={`px-3 py-1 rounded-full text-xs font-semibold ${state.timeframe === tf.value ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setTimeframe(tf.value as any)}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {/* Leaderboard List */}
        <section className="w-full flex flex-col gap-2">
          {sorted.length === 0 ? (
            <span className="text-gray-400">No leaderboard data</span>
          ) : (
            <ul className="flex flex-col gap-2">
              {sorted.map((entry, i) => (
                <li
                  key={entry.username}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl shadow-sm border border-gray-100 bg-white/80 transition-all duration-200 ${
                    entry.username === currentUser
                      ? 'ring-2 ring-gray-900/80 font-bold scale-[1.03] bg-gray-900/5'
                      : 'hover:bg-gray-100'
                  }`}
                  style={{ minHeight: 56 }}
                  aria-current={entry.username === currentUser ? 'true' : undefined }
                >
                  <span className="w-8 text-center text-lg font-bold text-gray-400 select-none">{i + 1}</span>
                  <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-gray-500 font-bold text-base">
                    <UserIcon className="w-6 h-6" />
                  </span>
                  <span className="flex-1 truncate text-gray-900 text-base font-medium">{entry.username}</span>
                  <span className="w-16 text-center text-gray-700 font-mono text-base">{entry.wpm} WPM</span>
                  <span className="w-14 text-center text-gray-500 font-mono text-sm">{entry.xp ?? 0} XP</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Current User Row (if not in top 5) */}
        {userIdx > 4 && userEntry && (
          <div className="w-full flex flex-col items-center mt-2">
            <div className="flex items-center gap-2 px-3 py-3 rounded-2xl shadow-sm border border-gray-200 bg-white/90 ring-2 ring-gray-900/80 font-bold scale-[1.03]" style={{ minHeight: 56 }}>
              <span className="w-8 text-center text-lg font-bold text-gray-400 select-none">{userIdx + 1}</span>
              <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-gray-500 font-bold text-base">
                <UserIcon className="w-6 h-6" />
              </span>
              <span className="flex-1 truncate text-gray-900 text-base font-medium">{userEntry.username}</span>
              <span className="w-16 text-center text-gray-700 font-mono text-base">{userEntry.wpm} WPM</span>
              <span className="w-14 text-center text-gray-500 font-mono text-sm">{userEntry.xp ?? 0} XP</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">Your rank</span>
          </div>
        )}
      </section>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} link={link} />
    </MinimalLeaderboardOverlay>
  );
} 