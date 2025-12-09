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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col items-center max-h-[90vh] min-w-0 sm:min-w-[320px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-card/50 transition-colors z-10"
          aria-label="Close gamification"
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
      <section className="w-full flex flex-col gap-4 sm:gap-5 items-center" aria-label="Gamification Progress" tabIndex={-1}>
        <header className="w-full flex flex-row items-center justify-between mb-1 pr-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" tabIndex={0}>Gamification</h1>
        </header>
        {/* XP & Level Section */}
        <div className="w-full bg-card/50 rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-3 items-center" aria-label="XP and Level">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">XP & Level</h2>
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-xs">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">{state.level}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Level</span>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="w-full bg-muted/50 rounded-full h-2.5 relative overflow-hidden" aria-label="XP Progress Bar">
                <div className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (state.xp % 100))}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{state.xp % 100}/100 XP</span>
                <span className="font-semibold text-primary">{state.xp >= 100 ? 'Level Up!' : ''}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Levels Section */}
        <div className="w-full bg-card/50 rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-4 items-center" aria-label="Levels Progression">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Levels</h2>
          <div className="w-full max-w-sm px-2">
            <div className="relative w-full h-16 flex items-center">
              {/* Level numbers - positioned absolutely, evenly spaced */}
              {[1,2,3,4,5,6,7,8,9,10].map((lvl, index) => {
                const isActive = state.level === lvl;
                const isCompleted = lvl < state.level;
                const leftPosition = `${4 + (index * (92 / 9))}%`;
                const circleSize = 32; // w-8 = 32px (smaller circles)
                const circleRadius = circleSize / 2;
                
                return (
                  <React.Fragment key={lvl}>
                    {/* Line segments BETWEEN circles - only show if not the last circle */}
                    {index < 9 && (
                      <>
                        {/* Background line segment */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-muted/30 rounded-full"
                          style={{ 
                            left: `calc(${leftPosition} + ${circleRadius}px)`,
                            width: `calc(${92 / 9}% - ${circleSize}px)`,
                            zIndex: 0
                          }} 
                        />
                        {/* Progress line segment - only show if this segment is completed */}
                        {lvl < state.level && (
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-primary rounded-full transition-all duration-300"
                            style={{ 
                              left: `calc(${leftPosition} + ${circleRadius}px)`,
                              width: `calc(${92 / 9}% - ${circleSize}px)`,
                              zIndex: 1
                            }} 
                          />
                        )}
                      </>
                    )}
                    {/* Circle with number */}
                    <div 
                      className="absolute flex items-center justify-center"
                      style={{ 
                        left: leftPosition,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                      }}
                    >
                      <div 
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 font-semibold text-xs sm:text-sm ${
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : isCompleted 
                            ? 'bg-primary/20 text-primary border-2 border-primary/40' 
                            : 'bg-background text-muted-foreground border-2 border-border'
                        }`}
                      >
                        {lvl}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="text-center mt-4 text-sm text-foreground/70">
              Level <span className="font-semibold text-primary">{state.level}</span> of 10
            </div>
          </div>
        </div>
        {/* Badges Section */}
        <div className="w-full bg-card/50 rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-3 items-center" aria-label="Badges">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Badges</h2>
          {allBadges.length === 0 ? (
            <span className="text-muted-foreground text-sm">No badges available.</span>
          ) : (
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center relative">
              {allBadges.map(badge => {
                const earned = state.badges.includes(badge.name);
                const Icon = badge.icon;
                return (
                  <div key={badge.key} className={`group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hover:scale-110 ${earned ? 'bg-card border-2 border-primary text-primary' : 'bg-muted/50 border-2 border-border text-muted-foreground grayscale opacity-60'}` } tabIndex={0} aria-label={badge.name + (earned ? '' : ' (Locked)')}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 relative z-0" />
                    {!earned && (
                      <Lock className="absolute w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground top-0.5 right-0.5 opacity-70 z-10" />
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap z-[100] shadow-xl pointer-events-none">
                      <span className="font-bold block">{badge.name}</span>
                      <span className="font-normal text-muted-foreground text-[10px]">{earned ? '' : '(Locked) '}{badge.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Streak Section */}
        <div className="w-full bg-card/50 rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-2 items-center" aria-label="Current Streak">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Current Streak</h2>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="text-2xl sm:text-3xl font-extrabold text-primary">{typeof state.streak === 'number' ? state.streak : 0}</span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>
        {/* Global Rank Section (if available) */}
        {(() => {
          const userIndex = sortedLeaderboard.findIndex(entry => entry.username === currentUsername);
          if (userIndex !== -1) {
            return (
              <div className="w-full bg-card/50 rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-2 items-center" aria-label="Global Rank">
                <span className="text-sm text-foreground/80 font-medium flex items-center gap-2"><Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />Your Global Rank: <span className="font-bold text-primary">#{userIndex + 1}</span></span>
              </div>
            );
          }
          return null;
        })()}
      </section>
    </MinimalGamificationOverlay>
  );
} 