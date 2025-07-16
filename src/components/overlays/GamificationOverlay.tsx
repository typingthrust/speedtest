import React, { useRef, useEffect } from 'react';
import { useOverlay } from '../OverlayProvider';
import { useGamification } from '../GamificationProvider';
import { X } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { Award, Zap, Target, Flame, Moon, Sun, Crown, Globe, Code, Trophy, ArrowUp, Gem, Lock } from 'lucide-react';

// Mock global leaderboard data (replace with backend fetch in production)
const mockLeaderboard = [
  { username: 'Alice', xp: 1200, badges: 8, wpm: 110 },
  { username: 'Bob', xp: 1100, badges: 7, wpm: 105 },
  { username: 'Charlie', xp: 950, badges: 6, wpm: 100 },
  { username: 'You', xp: 900, badges: 5, wpm: 98 }, // current user
  { username: 'Daisy', xp: 850, badges: 5, wpm: 95 },
  { username: 'Eve', xp: 800, badges: 4, wpm: 92 },
  { username: 'Frank', xp: 750, badges: 4, wpm: 90 },
  { username: 'Grace', xp: 700, badges: 3, wpm: 88 },
  { username: 'Heidi', xp: 650, badges: 3, wpm: 85 },
  { username: 'Ivan', xp: 600, badges: 2, wpm: 80 },
];

// Define all possible badges
const allBadges = [
  { key: 'speedster', name: 'Speedster', icon: Zap, gradient: 'from-yellow-400 to-orange-500', description: 'Achieve 60+ WPM in a test.' },
  { key: 'accuracy-ace', name: 'Accuracy Ace', icon: Target, gradient: 'from-green-400 to-blue-500', description: 'Score 98%+ accuracy in a test.' },
  { key: 'streak-starter', name: 'Streak Starter', icon: Flame, gradient: 'from-orange-400 to-red-500', description: '3-day streak.' },
  { key: 'consistency-king', name: 'Consistency King', icon: Crown, gradient: 'from-purple-400 to-blue-600', description: '5 tests in a week.' },
  { key: 'challenge-champ', name: 'Challenge Champ', icon: Trophy, gradient: 'from-pink-400 to-indigo-500', description: 'Complete a daily challenge.' },
  // Add more as needed
];

function MinimalGamificationOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
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
        className="relative w-full max-w-lg mx-auto bg-white/90 rounded-xl border border-white/30 shadow-lg flex flex-col items-center min-h-[40vh] max-h-[90vh] min-w-[320px] p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close gamification"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function GamificationOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { state } = useGamification();
  const { user } = useAuth();
  // Sort leaderboard by XP, then badges, then WPM
  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) =>
    b.xp !== a.xp ? b.xp - a.xp : b.badges !== a.badges ? b.badges - a.badges : b.wpm - a.wpm
  );
  // Find current user (by username or email)
  const currentUsername = user?.username || user?.email || 'You';

  // 1. Add Escape key close and ARIA roles
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeOverlay();
    }
    if (open === 'gamification') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOverlay]);

  return (
    <MinimalGamificationOverlay open={open === 'gamification'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-6 items-center" aria-label="Gamification Progress" tabIndex={-1}>
        <header className="w-full flex flex-row items-center justify-between mb-2 pr-14">
          <h1 className="text-2xl font-bold text-gray-900" tabIndex={0}>Gamification</h1>
        </header>
        {/* XP & Level Section */}
        <div className="w-full bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 items-center" aria-label="XP and Level">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">XP & Level</h2>
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-gray-900">{state.level}</span>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Level</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden" aria-label="XP Progress Bar">
                <div className="absolute left-0 top-0 h-3 rounded-full bg-gray-700 transition-all" style={{ width: `${Math.min(100, (state.xp % 100))}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{state.xp % 100}/100 XP</span>
                <span className="font-bold">{state.xp >= 100 ? 'Level Up!' : ''}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Levels Section */}
        <div className="w-full bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 items-center" aria-label="Levels Progression">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Levels</h2>
          <div className="relative w-full max-w-xs h-8 flex items-center mb-2">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 rounded-full" />
            {[1,2,3,4,5,6,7,8,9,10].map(lvl => (
              <div key={lvl} className="absolute" style={{ left: `${(lvl-1)*11.11}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${state.level === lvl ? 'bg-gray-900 border-gray-900 text-white' : lvl < state.level ? 'bg-gray-700 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>{lvl}</div>
              </div>
            ))}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gray-900 rounded-full transition-all" style={{ width: `${Math.min(100, ((state.level-1)/9)*100)}%`, zIndex: 1 }} />
          </div>
          <div className="text-sm text-gray-700">Current Level: <span className="font-bold text-gray-900">{state.level}</span></div>
        </div>
        {/* Badges Section */}
        <div className="w-full bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 items-center" aria-label="Badges">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Badges</h2>
          {allBadges.length === 0 ? (
            <span className="text-gray-400 text-sm">No badges available.</span>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              {allBadges.map(badge => {
                const earned = state.badges.includes(badge.name);
                const Icon = badge.icon;
                return (
                  <div key={badge.key} className={`group relative w-14 h-14 rounded-full flex items-center justify-center shadow transition-all duration-300 ${earned ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-400 grayscale'}` } tabIndex={0} aria-label={badge.name + (earned ? '' : ' (Locked)')}>
                    <Icon className="w-7 h-7" />
                    {!earned && (
                      <Lock className="absolute w-5 h-5 text-gray-400 top-1 right-1 opacity-80" />
                    )}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 shadow-lg">
                      <span className="font-bold">{badge.name}</span> {earned ? '' : '(Locked)'}<br/>
                      <span className="font-normal text-gray-300">{badge.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Streak Section */}
        <div className="w-full bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 items-center" aria-label="Current Streak">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Streak</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-orange-500"><Flame className="inline w-6 h-6 mr-1" />{typeof state.streak === 'number' ? state.streak : 0}</span>
          </div>
        </div>
        {/* Global Rank Section (if available) */}
        {(() => {
          const userIndex = sortedLeaderboard.findIndex(entry => entry.username === currentUsername);
          if (userIndex !== -1) {
            return (
              <div className="w-full bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 items-center" aria-label="Global Rank">
                <span className="text-sm text-gray-600 font-medium flex items-center gap-1"><Award className="w-5 h-5 text-yellow-500" />Your Global Rank: <span className="font-bold text-gray-900">#{userIndex + 1}</span></span>
              </div>
            );
          }
          return null;
        })()}
      </section>
    </MinimalGamificationOverlay>
  );
} 