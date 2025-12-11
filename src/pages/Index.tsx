import React, { useState, useEffect, useRef, useCallback, memo, useMemo, useLayoutEffect } from 'react';
import { Settings, User, RotateCcw, Keyboard, BarChart2, Award, Users, BookOpen, Rocket, User as UserIcon, Clock, Type, SlidersHorizontal, Bell } from 'lucide-react';
import ResultScreen from '../components/ResultScreen';
import { useOverlay } from '../components/OverlayProvider';
import type { OverlayType } from '../components/OverlayProvider';
import { ExpandableTabs } from '../components/ui/expandable-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersonalization } from '../components/PersonalizationProvider';
import { useContentLibrary } from '../components/ContentLibraryProvider';
import { Link } from 'react-router-dom';
import GraphemeSplitter from 'grapheme-splitter';
import { Switch } from '../components/ui/switch'; // If not present, use a simple custom switch inline
import { useGamification } from '../components/GamificationProvider';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { useLeaderboard } from '../components/LeaderboardProvider';

// Add this style block at the top-level of the file (or in App.css if preferred)
// For popover fade/slide animation and backdrop
const style = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fadeSlideOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-8px) scale(0.98); }
}
.animate-fade-in { animation: fadeSlideIn 0.22s cubic-bezier(.4,0,.2,1) both; }
.animate-fade-out { animation: fadeSlideOut 0.18s cubic-bezier(.4,0,.2,1) both; }
.settings-backdrop {
  position: fixed; inset: 0; z-index: 10;
  background: rgba(243,244,246,0.5); /* gray-100/50 */
  backdrop-filter: blur(4px);
  transition: opacity 0.2s;
}
@keyframes timerGlow {
  0% { text-shadow: 0 0 5px rgba(0, 0, 0, 0.2); }
  50% { text-shadow: 0 0 15px rgba(0, 0, 0, 0.4); }
  100% { text-shadow: 0 0 5px rgba(0, 0, 0, 0.2); }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('settings-anim-style')) {
  const s = document.createElement('style');
  s.id = 'settings-anim-style';
  s.innerHTML = style;
  document.head.appendChild(s);
}

// Add this style block at the top-level of the file (or in App.css if preferred)
const typingAreaStyle = `
.typing-text-area::-webkit-scrollbar { display: none; }
.typing-text-area { scrollbar-width: none; -ms-overflow-style: none; }
`;
if (typeof document !== 'undefined' && !document.getElementById('typing-area-style')) {
  const s = document.createElement('style');
  s.id = 'typing-area-style';
  s.innerHTML = typingAreaStyle;
  document.head.appendChild(s);
}

// Add this style block for hiding scrollbars (if not already present)
const hideScrollbarStyle = `
.typing-text-area::-webkit-scrollbar { display: none; }
.typing-text-area { scrollbar-width: none; -ms-overflow-style: none; }
`;
if (typeof document !== 'undefined' && !document.getElementById('hide-scrollbar-style')) {
  const s = document.createElement('style');
  s.id = 'hide-scrollbar-style';
  s.innerHTML = hideScrollbarStyle;
  document.head.appendChild(s);
}

// --- Monkeytype-style caret CSS ---
const monkeyCaretStyle = `
@keyframes monkey-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
.monkey-caret {
  position: absolute;
  left: 0;
  top: 0;
  width: 2.5px;
  height: 100%;
  background: #888;
  border-radius: 2px;
  animation: monkey-blink 1s steps(1) infinite;
  z-index: 2;
  box-shadow: none;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('monkey-caret-style')) {
  const s = document.createElement('style');
  s.id = 'monkey-caret-style';
  s.innerHTML = monkeyCaretStyle;
  document.head.appendChild(s);
}

// --- Simplified Typing Area Component ---
// Supports all modes: time, words, quote, coding, custom, zen, god, syntax, essay, notimer, softtheme, hardwords, foreign
type TypingAreaProps = { currentText: string; userInput: string; currentIndex: number };
const TypingArea: React.FC<TypingAreaProps & { mode?: string; godModeIndex?: number }> = React.memo(function TypingArea(_props) {
  const {
    currentText = '',
    userInput = '',
    currentIndex = 0,
    mode,
    godModeIndex
  } = _props;

  const containerRef = useRef<HTMLDivElement>(null);
  const caretCharRef = useRef<HTMLSpanElement>(null);

  // Track which line we've scrolled past for Monkeytype-style snapping
  const [scrolledLines, setScrolledLines] = useState(0);
  const lineHeightRef = useRef<number>(0);
  
  // Monkeytype-style line snapping with smooth animation
  // Improved to always keep caret visible, especially at the end
  useLayoutEffect(() => {
    if (!containerRef.current || !caretCharRef.current) return;
    
    const container = containerRef.current;
    const caretChar = caretCharRef.current;
    
    // Calculate actual line height from the caret element
    const caretRect = caretChar.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = fontSize * 1.8; // Match the CSS lineHeight: 1.8
    lineHeightRef.current = lineHeight;
    
    // Get container's content area (excluding padding)
    const containerRect = container.getBoundingClientRect();
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    const containerHeight = containerRect.height;
    const visibleHeight = containerHeight - paddingTop - paddingBottom;
    
    // Calculate caret's position relative to the scrollable content
    const caretTopInContent = caretRect.top - containerRect.top + container.scrollTop - paddingTop;
    const currentLine = Math.floor(caretTopInContent / lineHeight);
    
    // Check if caret is visible in viewport
    const caretTopRelative = caretRect.top - containerRect.top;
    const caretBottomRelative = caretRect.bottom - containerRect.top;
    const isCaretVisible = caretTopRelative >= paddingTop && caretBottomRelative <= (containerHeight - paddingBottom);
    
    // When cursor moves to line 2 (0-indexed), scroll so line 1 becomes line 0
    // This keeps the cursor always on line 0 or 1 visually
    if (currentLine >= 2 && currentLine > scrolledLines) {
      const newScrolledLines = currentLine - 1;
      setScrolledLines(newScrolledLines);
    } 
    // If caret is not visible (especially at the end), scroll to make it visible
    else if (!isCaretVisible) {
      if (caretBottomRelative > containerHeight - paddingBottom) {
        // Caret is below visible area - scroll down
        const scrollNeeded = caretBottomRelative - (containerHeight - paddingBottom) + 8;
        container.scrollTop += scrollNeeded;
      } else if (caretTopRelative < paddingTop) {
        // Caret is above visible area - scroll up
        const scrollNeeded = paddingTop - caretTopRelative + 8;
        container.scrollTop = Math.max(0, container.scrollTop - scrollNeeded);
      }
    }
  }, [userInput, currentText, scrolledLines]);
  
  // Apply smooth scroll animation
  useLayoutEffect(() => {
    if (!containerRef.current || lineHeightRef.current === 0) return;
    
    const targetScrollTop = scrolledLines * lineHeightRef.current;
    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [scrolledLines]);
  
  // Reset scroll when test resets
  useEffect(() => {
    if (userInput.length === 0) {
      setScrolledLines(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [userInput]);

  // Determine which rendering mode to use based on the mode prop
  const isCodeMode = mode === 'coding' || mode === 'syntax';
  const isZenMode = mode === 'zen' || mode === 'zenwriting' || mode === 'softtheme';
  const isGodMode = mode === 'god';
  
  // Handle empty text gracefully
  if (!currentText) {
    return (
      <div 
        className="typing-text-area"
        style={{ 
          minHeight: 120, 
          width: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        }}
      >
        Loading text...
      </div>
    );
  }

  // =============== GOD MODE ===============
  // Shows only a few words at a time for speed practice - larger and centered
  if (isGodMode) {
    const words = currentText.split(/\s+/);
    const windowSize = 3;
    const start = godModeIndex || 0;
    const visibleWords = words.slice(start, Math.min(words.length, start + windowSize));
    const visibleText = visibleWords.join(' ');
    const typed = userInput.trim();
    
    return (
      <div 
        className="typing-text-area"
        style={{ 
          height: 'calc(2.5rem * 1.8 * 2 + 32px)', // 2 lines for god mode
          width: '100%', 
          textAlign: 'center', 
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          lineHeight: '1.8',
          padding: '24px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {Array.from(visibleText).map((char, idx) => {
          const isTyped = idx < typed.length;
          const isCorrect = isTyped && visibleText[idx] === typed[idx];
          const isIncorrect = isTyped && visibleText[idx] !== typed[idx];
          const isCurrent = idx === typed.length;
          
          let className = 'text-foreground/60';
          
          if (isCorrect) className = 'text-foreground';
          else if (isIncorrect) className = 'text-red-400'; // Soft red, no background
          else if (isCurrent) className = 'text-foreground';
          
          // Render caret for current character
          if (isCurrent) {
            return (
              <span key={idx} className={className} style={{ position: 'relative', display: 'inline-block' }}>
                <span 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.15em',
                    width: '3px',
                    height: '0.85em',
                    background: 'hsl(48, 96%, 53%)',
                    borderRadius: '1px',
                    animation: 'monkey-blink 1s steps(1) infinite',
                  }}
                />
                {char}
              </span>
            );
          }
          
          return (
            <span key={idx} className={className} style={{ display: 'inline-block' }}>
              {char}
            </span>
          );
        })}
      </div>
    );
  }

  // =============== CODE/SYNTAX MODE ===============
  // Preserves whitespace, newlines, and uses monospace font
  if (isCodeMode) {
    return (
      <div
        ref={containerRef}
        className="typing-text-area scrollbar-hide"
        style={{
          position: 'relative',
          height: 'calc(1.125rem * 1.8 * 6 + 32px)', // 6 lines for code
          width: '100%',
          textAlign: 'left',
          whiteSpace: 'pre',
          overflowY: 'scroll',
          overflowX: 'auto',
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          lineHeight: '1.7',
          padding: '16px',
          background: 'hsl(var(--card))',
          borderRadius: '8px',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {Array.from(currentText).map((char, idx) => {
          const isTyped = idx < userInput.length;
          const isCorrect = isTyped && userInput[idx] === char;
          const isIncorrect = isTyped && userInput[idx] !== char;
          const isCurrent = idx === userInput.length;
          
          let className = 'text-foreground/60';
          
          if (isCorrect) className = 'text-foreground';
          else if (isIncorrect) className = 'text-red-400'; // Soft red, no background
          else if (isCurrent) className = 'text-foreground';
          
          // Render the caret inline with the current character
          if (isCurrent) {
            return (
              <span key={idx} ref={caretCharRef} className={className} style={{ position: 'relative' }}>
          <span
            className="monkey-caret"
            style={{
              position: 'absolute',
                    left: 0,
                    top: '0.1em',
                    width: '2px',
                    height: '0.9em',
                    background: 'hsl(48, 96%, 53%)',
              animation: 'monkey-blink 1s steps(1) infinite',
                    zIndex: 2,
                  }}
                />
                {char === '\n' ? <br /> : char}
              </span>
            );
          }
          
          // Handle newlines and spaces
          if (char === '\n') {
            return <br key={idx} />;
          }
          
          return (
            <span key={idx} className={className}>
              {char}
            </span>
          );
        })}
        {/* Caret at end if all text typed */}
        {userInput.length >= currentText.length && (
          <span 
            className="monkey-caret"
            style={{
              display: 'inline-block',
              width: '2px',
              height: '0.9em',
              background: 'hsl(48, 96%, 53%)',
              animation: 'monkey-blink 1s steps(1) infinite',
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </div>
    );
  }

  // =============== ZEN/MINDFULNESS MODE ===============
  // Same font and size as other modes for consistency
  if (isZenMode) {
    return (
      <div
        ref={containerRef}
        className="typing-text-area scrollbar-hide"
        style={{
          position: 'relative',
          height: 'calc(2.5rem * 1.9 * 3 + 40px)', // Same 3-line height (updated for larger font)
          width: '100%',
          maxWidth: '100%',
          textAlign: 'left',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
          overflowY: 'scroll',
          overflowX: 'hidden',
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', // Larger, cleaner font
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          lineHeight: '1.9', // More spacing between lines
          padding: '20px 24px', // More horizontal padding for wider feel
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
        }}
      >
        {Array.from(currentText).map((char, idx) => {
          const isTyped = idx < userInput.length;
          const isCorrect = isTyped && userInput[idx] === char;
          const isIncorrect = isTyped && userInput[idx] !== char;
          const isCurrent = idx === userInput.length;
          
          let className = 'text-foreground/60';
          
          if (isCorrect) className = 'text-foreground';
          else if (isIncorrect) className = 'text-red-400'; // Soft red, no background
          else if (isCurrent) className = 'text-foreground';
          
          // Render the caret inline with the current character
          if (isCurrent) {
            return (
              <span key={idx} ref={caretCharRef} className={className} style={{ position: 'relative' }}>
                <span 
                  className="monkey-caret"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.15em',
                    width: '2px',
                    height: '0.85em',
                    background: 'hsl(48, 96%, 53%)',
                    borderRadius: '1px',
                    animation: 'monkey-blink 1s steps(1) infinite',
                    zIndex: 2,
                  }}
                />
          {char}
        </span>
      );
    }
          
          return (
            <span key={idx} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
          );
        })}
        {/* Caret at end if all text typed */}
        {userInput.length >= currentText.length && (
          <span 
            className="monkey-caret"
            style={{
              display: 'inline-block',
              width: '2px',
              height: '0.85em',
              background: 'hsl(48, 96%, 53%)',
              borderRadius: '1px',
              animation: 'monkey-blink 1s steps(1) infinite',
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </div>
    );
  }

  // =============== DEFAULT MODE ===============
  // Monkeytype-style: Show 3 lines, when cursor reaches line 3, text snaps up smoothly
  return (
    <div
      ref={containerRef}
      className="typing-text-area scrollbar-hide"
      style={{
        position: 'relative',
        height: 'calc(2.5rem * 1.9 * 3 + 40px)', // Exactly 3 lines + padding (updated for larger font)
        width: '100%',
        maxWidth: '100%',
        textAlign: 'left',
        wordBreak: 'normal',
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        textIndent: 0,
        wordSpacing: 'normal',
        overflowY: 'scroll', // Allow scroll but hide scrollbar via CSS
        overflowX: 'hidden',
        fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', // Larger, cleaner font
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        lineHeight: '1.9', // More spacing between lines
        padding: '20px 24px', // More horizontal padding for wider feel
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        scrollBehavior: 'smooth', // Smooth scroll animation
      }}
    >
      {Array.from(currentText).map((char, idx) => {
        const isTyped = idx < userInput.length;
        const isCorrect = isTyped && userInput[idx] === char;
        const isIncorrect = isTyped && userInput[idx] !== char;
        const isCurrent = idx === userInput.length;
        
        // Professional dark theme colors: theme-aware untyped, light typed correct, red incorrect
        let className = 'text-foreground/60'; // Untyped - muted foreground
        
        if (isCorrect) className = 'text-foreground'; // Correct - foreground
        else if (isIncorrect) className = 'text-red-400'; // Wrong - soft red, no background
        else if (isCurrent) className = 'text-foreground';
        
        // Render the caret inline with the current character
        if (isCurrent) {
          return (
            <span key={idx} ref={caretCharRef} className={className} style={{ position: 'relative' }}>
        <span
          className="monkey-caret"
          style={{
            position: 'absolute',
                  left: 0,
                  top: '0.15em',
                  width: '2px',
                  height: '0.85em',
                  background: 'hsl(var(--primary))', // Theme primary caret
                  borderRadius: '1px',
            animation: 'monkey-blink 1s steps(1) infinite',
                  zIndex: 2,
                }}
              />
              {char}
            </span>
          );
        }
        
        return (
          <span key={idx} className={className}>
            {char}
          </span>
        );
      })}
      {/* Caret at end if all text typed */}
      {userInput.length >= currentText.length && (
        <span 
          className="monkey-caret"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '0.85em',
            background: 'hsl(var(--primary))', // theme primary
            borderRadius: '1px',
            animation: 'monkey-blink 1s steps(1) infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </div>
  );
});

// AnimatedUnderlineTabs component
function AnimatedUnderlineTabs({ tabs, activeIndex, onChange }: { tabs: string[]; activeIndex: number; onChange: (idx: number) => void }) {
  return (
    <div className="flex justify-center items-center gap-8 mt-8 mb-8">
      {tabs.map((tab, idx) => (
        <button
          key={tab}
          onClick={() => onChange(idx)}
          className={
            'relative bg-transparent border-none outline-none px-2 py-1 text-lg font-medium transition-colors duration-200 ' +
            (activeIndex === idx ? 'text-primary font-bold' : 'text-foreground/60 hover:text-foreground')
          }
          style={{ background: 'none' }}
        >
          <span>{tab}</span>
          <AnimatePresence>
            {activeIndex === idx && (
              <motion.div
                layoutId={`underline-${idx}`}
                className="absolute left-0 right-0 -bottom-1 h-[2.5px] rounded-full bg-primary"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </AnimatePresence>
        </button>
      ))}
    </div>
  );
}

// Animated Chip component for settings
const AnimatedChip = ({ selected, onClick, children, id }: { selected: boolean; onClick: () => void; children: React.ReactNode; id?: string }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`relative px-6 py-2 rounded-xl font-semibold text-base transition-all duration-200
      ${selected
        ? "bg-primary text-primary-foreground shadow-lg scale-105"
        : "bg-muted text-foreground hover:bg-muted/80 hover:scale-105"}
      focus:outline-none focus:ring-2 focus:ring-primary`}
    whileTap={{ scale: 0.97 }}
    whileHover={{ scale: 1.07 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    style={{ minWidth: 64, margin: 2 }}
  >
    {children}
    {selected && (
      <motion.div
        layoutId={`chip-underline-${id || 'default'}`}
        className="absolute left-3 right-3 bottom-1 h-1 rounded-b-xl bg-primary"
        style={{ marginTop: 2 }}
      />
    )}
  </motion.button>
);

// Animated Settings Section component
const AnimatedSettingsSection = ({
  heading,
  children,
  expanded,
  setExpanded,
}: {
  heading: string;
  children: React.ReactNode;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) => (
  <div
    className="relative w-full max-w-2xl mx-auto mb-2"
    onMouseEnter={() => setExpanded(true)}
    onMouseLeave={() => setExpanded(false)}
    onTouchStart={() => setExpanded(!expanded)}
    tabIndex={0}
    style={{ outline: 'none' }}
  >
    <div
      className={`text-lg font-bold text-foreground px-6 py-3 rounded-xl cursor-pointer transition-colors duration-200 ${
        expanded ? 'bg-card' : 'bg-card/50'
      }`}
      style={{backdropFilter: expanded ? 'blur(4px)' : undefined, WebkitBackdropFilter: expanded ? 'blur(4px)' : undefined}}
    >
      {heading}
    </div>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute left-0 right-0 z-10 mt-2 p-4 rounded-2xl bg-card/90 shadow-xl backdrop-blur-md border border-border"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// SettingsCard component for 3 main cards
const SettingsCard = ({
  heading,
  children,
  expanded,
  setExpanded,
}: {
  heading: string;
  children: React.ReactNode;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) => (
  <motion.div
    className="relative flex flex-col items-center justify-center cursor-pointer select-none"
    onMouseEnter={() => setExpanded(true)}
    onMouseLeave={() => setExpanded(false)}
    onTouchStart={() => setExpanded(!expanded)}
    tabIndex={0}
    style={{ outline: 'none', minWidth: 120 }}
    initial={false}
    animate={expanded ? { width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } : { width: 120, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  >
    <div
      className={`w-full px-4 py-4 rounded-2xl text-center font-semibold text-lg transition-colors duration-200 text-foreground ${
        expanded ? 'bg-card/90 backdrop-blur-md border border-border' : 'bg-card/50 border border-transparent'
      }`}
      style={{ minHeight: 56 }}
    >
      {heading}
    </div>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute left-0 right-0 top-full z-10 mt-2 p-4 rounded-2xl bg-card/90 shadow-xl backdrop-blur-md border border-border flex flex-col items-center"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// Key to finger mapping (QWERTY, including numbers, punctuation, space)
const keyToFinger: Record<string, string> = {
  Q: 'left-pinky', W: 'left-ring', E: 'left-middle', R: 'left-index', T: 'left-index',
  A: 'left-pinky', S: 'left-ring', D: 'left-middle', F: 'left-index', G: 'left-index',
  Z: 'left-pinky', X: 'left-ring', C: 'left-middle', V: 'left-index', B: 'left-index',
  Y: 'right-index', U: 'right-index', I: 'right-middle', O: 'right-ring', P: 'right-pinky',
  H: 'right-index', J: 'right-index', K: 'right-middle', L: 'right-ring',
  N: 'right-index', M: 'right-index',
  '1': 'left-pinky', '2': 'left-ring', '3': 'left-middle', '4': 'left-index', '5': 'left-index',
  '6': 'right-index', '7': 'right-index', '8': 'right-middle', '9': 'right-ring', '0': 'right-pinky',
  '-': 'right-pinky', '=': 'right-pinky',
  '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky',
  ';': 'right-ring', "'": 'right-pinky', ',': 'right-middle', '.': 'right-ring', '/': 'right-pinky',
  '`': 'left-pinky',
  ' ': 'thumb',
};
const keyLabels: Record<string, string> = {
  ' ': 'Space',
  '\\': 'Backslash',
  '`': 'Backtick',
  '-': 'Dash',
  '=': 'Equal',
  '[': 'Left Bracket',
  ']': 'Right Bracket',
  ';': 'Semicolon',
  "'": 'Apostrophe',
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
};

// Add at the top, after imports
const quotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is not the key to happiness. Happiness is the key to success. - Albert Schweitzer",
  "The best way to get started is to quit talking and begin doing. - Walt Disney",
  // ...add more quotes as needed
];
const codeSnippets = [
  "function greet(name) {\n  return `Hello, ${name}!`;\n}",
  "const sum = (a, b) => a + b;\nconsole.log(sum(2, 3));",
  "for (let i = 0; i < 10; i++) {\n  console.log(i);\n}",
  // ...add more code snippets as needed
];

const contentByCategory = {
  quote: {
    short: [
      "The only way to do great work is to love what you do.",
      "The best way to predict the future is to create it.",
      "Simplicity is the ultimate sophistication.",
    ],
    medium: [
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "Your time is limited, so don't waste it living someone else's life.",
      "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    ],
    long: [
      "The future belongs to those who believe in the beauty of their dreams. Do not wait to strike till the iron is hot; but make it hot by striking.",
      "The two most important days in your life are the day you are born and the day you find out why. The secret of getting ahead is getting started.",
    ],
    thicc: [
      "In three words I can sum up everything I've learned about life: it goes on. To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
      "Life is what happens when you're busy making other plans. The purpose of our lives is to be happy. Get busy living or get busy dying. You only live once, but if you do it right, once is enough.",
    ]
  },
  coding: {
    short: [
      "const app = express();",
      "let count = 0;",
      "import { useState } from 'react';",
      "const pi = 3.14159;",
    ],
    medium: [
      "const add = (a, b) => a + b;",
      "const user = { name: 'John', age: 30 };",
      "for (let i = 0; i < 5; i++) { console.log(i); }",
    ],
    long: [
      "function factorial(n) {\n  return (n != 1) ? n * factorial(n - 1) : 1;\n}",
      "const fetchData = async () => {\n  const res = await fetch(url);\n  const data = await res.json();\n}",
    ],
    thicc: [
      "const promise = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Success!');\n  }, 1000);\n});",
      "app.get('/', (req, res) => {\n  res.send('Hello World!');\n});",
    ]
  }
};

// Add this after contentByCategory and before Index component
const contentBySubcategory = {
  coding: {
    short: ["const sum = (a, b) => a + b;"],
    medium: ["function greet(name) {\n  return 'Hello, ' + name + '!';\n}"],
    long: ["class Stack {\n  constructor() { this.items = []; }\n  push(item) { this.items.push(item); }\n  pop() { return this.items.pop(); }\n  peek() { return this.items[this.items.length - 1]; }\n}"],
    thicc: ["function quickSort(arr) {\n  if (arr.length < 2) return arr;\n  const pivot = arr[0];\n  const left = arr.slice(1).filter(x => x < pivot);\n  const right = arr.slice(1).filter(x => x >= pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}"],
  },
  syntax: {
    short: ["if (x > 10) {\n  console.log('x is greater than 10');\n}"],
    medium: ["for (let i = 0; i < 5; i++) {\n  if (i % 2 === 0) {\n    console.log(i + ' is even');\n  }\n}"],
    long: ["function isPalindrome(str) {\n  const reversed = str.split('').reverse().join('');\n  return str === reversed;\n}"],
    thicc: ["try {\n  const data = JSON.parse(input);\n  if (!Array.isArray(data)) throw new Error('Not an array');\n  data.forEach(item => {\n    if (typeof item !== 'number') throw new Error('Invalid item');\n  });\n  console.log('All items are numbers');\n} catch (e) {\n  console.error(e.message);\n}"],
  },
  essay: {
    short: ["The internet has changed the way we communicate."],
    medium: ["Technology has made information accessible to everyone, but it also raises concerns about privacy and security."],
    long: ["Education is the foundation of progress. With the rise of online learning platforms, students can now access quality education from anywhere in the world. However, this shift also requires self-discipline and motivation."],
    thicc: ["Climate change is one of the most pressing issues of our time. It affects every aspect of our lives, from the food we eat to the air we breathe. Addressing climate change requires global cooperation, innovative solutions, and a commitment to sustainability from individuals, businesses, and governments alike."],
  },
  zen: {
    short: ["Breathe in, breathe out. Focus on the present moment."],
    medium: ["Let your thoughts flow freely, without judgment or expectation. Writing can be a form of meditation, a way to clear your mind."],
    long: ["In the quiet of the morning, before the world awakens, there is a stillness that invites reflection. Writing in this space allows ideas to surface naturally, without force or hurry."],
    thicc: ["Zen writing is about embracing simplicity and clarity. It is not about perfection, but about presence. As you type, let go of distractions and immerse yourself in the rhythm of your words. Notice the sensations of your fingers on the keys, the sound of each letter appearing on the screen, and the gentle flow of your breath."],
  },
  zenwriting: {
    short: ["Breathe in, breathe out. Focus on the present moment."],
    medium: ["Let your thoughts flow freely, without judgment or expectation. Writing can be a form of meditation, a way to clear your mind."],
    long: ["In the quiet of the morning, before the world awakens, there is a stillness that invites reflection. Writing in this space allows ideas to surface naturally, without force or hurry."],
    thicc: ["Zen writing is about embracing simplicity and clarity. It is not about perfection, but about presence. As you type, let go of distractions and immerse yourself in the rhythm of your words. Notice the sensations of your fingers on the keys, the sound of each letter appearing on the screen, and the gentle flow of your breath."],
  },
  hardwords: {
    short: ["Quizzical sphinxes jump by dwarf ivy growls."],
    medium: ["The juxtaposition of zephyrs and labyrinthine corridors perplexed the archaeologists."],
    long: ["Philosophers often ponder the quintessential nature of consciousness, debating whether it is an emergent property or a fundamental aspect of the universe."],
    thicc: ["Sesquipedalian loquaciousness may obfuscate the perspicuity of one's discourse, yet the judicious use of polysyllabic terminology can, on occasion, elucidate complex concepts with remarkable precision and nuance."],
  },
  notimer: {
    short: ["Take your time. There is no rush. Type at your own pace."],
    medium: ["Practice makes perfect. Without a timer, you can focus on accuracy rather than speed. Enjoy the process of improving."],
    long: ["In this mode, there is no timer counting down. You can type at whatever pace feels comfortable. Focus on each keystroke, notice the rhythm of your fingers, and enjoy the journey of typing without pressure."],
    thicc: ["The art of typing is not just about speed. It is about precision, rhythm, and flow. Without the pressure of a timer, you can develop muscle memory, improve accuracy, and truly master the keyboard. Take a deep breath, relax your shoulders, and type each word with intention and care."],
  },
  softtheme: {
    short: ["Gentle keystrokes. Soft focus. Calm mind."],
    medium: ["In the quiet rhythm of typing, find your peace. Each keystroke is a step towards mastery and mindfulness."],
    long: ["The soft glow of the screen illuminates your journey. With each letter typed, you move closer to fluency. Let the gentle pace of this practice soothe your mind and sharpen your skills."],
    thicc: ["Typing can be a form of meditation. As your fingers dance across the keys, let your thoughts flow like water. There is no destination, only the journey. Each word is a brushstroke on the canvas of digital expression. Embrace the tranquility of focused practice."],
  },
  god: {
    short: ["Speed. Focus. Precision."],
    medium: ["In god mode, only the current words matter. Type fast, stay accurate, dominate the keyboard."],
    long: ["God mode is designed for speed demons. You see only a few words at a time. Your focus sharpens. Your fingers fly. Every keystroke counts. Are you ready to push your limits?"],
    thicc: ["Welcome to god mode, where typing transcends ordinary practice. Here, distractions fade away. Only the words before you exist. Your peripheral vision narrows. Your fingers become an extension of your thoughts. This is where champions are forged. This is where records are broken. Type like your keyboard depends on it."],
  },
};

// Memoized character renderer for performance
const MemoChar = memo(function MemoChar({ char, index, userInput, currentIndex }: { char: string, index: number, userInput: string, currentIndex: number }) {
  let className = 'transition-all duration-150 ease-out inline-block ';
  if (index < userInput.length) {
    if (userInput[index] === char) {
      className += 'text-foreground transform scale-105';
    } else {
      className += 'text-red-500 bg-red-100'; // Incorrect - red, no pulse
    }
  } else if (index === userInput.length) {
    return (
      <motion.span
        key={index}
        style={{ position: 'relative', display: 'inline-block' }}
        className="current-caret"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.06, ease: 'easeOut' }}
      >
        <motion.span
          className="bg-primary text-primary-foreground transform scale-110"
          layoutId="caret-char"
          transition={{ duration: 0.06, ease: 'easeOut' }}
        >
          {char}
        </motion.span>
        <motion.span
          className="cursor-blink"
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            width: '2px',
            height: '100%',
            background: 'hsl(var(--primary))', // theme primary
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
          layoutId="caret-bar"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.06, ease: 'easeOut' }}
        />
      </motion.span>
    );
  } else {
    className += 'text-foreground/60';
  }
  return (
    <span key={index} className={className}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
});

const Index = () => {
  // State management
  const [currentMode, setCurrentMode] = useState('time');
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordLimit, setWordLimit] = useState(25);
  const [difficulty, setDifficulty] = useState('medium');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<Array<{ t: number; wpm: number }>>([]);
  const [keystrokeStats, setKeystrokeStats] = useState<{ total: number; correct: number; incorrect: number; extra: number; keyCounts?: Record<string, number> }>({ total: 0, correct: 0, incorrect: 0, extra: 0, keyCounts: {} });
  const [errorTypes, setErrorTypes] = useState<{ punctuation: number; case: number; number: number; other: number }>({ punctuation: 0, case: 0, number: 0, other: 0 });
  const [consistency, setConsistency] = useState<number | null>(null);
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textDisplayRef = useRef<HTMLDivElement>(null);
  const typingPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [intervalActive, setIntervalActive] = useState(false);
  const [chartData, setChartData] = useState<Array<{ x: number; y: number; acc: number }>>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState<null | 'mode' | 'duration' | 'difficulty'>(null);
  const modeChipRef = useRef<HTMLButtonElement>(null);
  const durationChipRef = useRef<HTMLButtonElement>(null);
  const diffChipRef = useRef<HTMLButtonElement>(null);
  const { open, openOverlay } = useOverlay();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  // Allow openSetting to be a category heading string, 'duration', 'difficulty', or null
  const [openSetting, setOpenSetting] = useState<string | null>(null);
  const { updateStats } = usePersonalization();
  const { state: contentLibraryState } = useContentLibrary();

  // Add language selector state
  const [language, setLanguage] = useState('english');
  // Add a comprehensive language list
  const languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' },
    { label: 'German', value: 'german' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Russian', value: 'russian' },
    { label: 'Arabic', value: 'arabic' },
    { label: 'Portuguese', value: 'portuguese' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Bengali', value: 'bengali' },
    { label: 'Telugu', value: 'telugu' },
    { label: 'Marathi', value: 'marathi' },
    { label: 'Tamil', value: 'tamil' },
    { label: 'Urdu', value: 'urdu' },
    { label: 'Gujarati', value: 'gujarati' },
    { label: 'Kannada', value: 'kannada' },
    { label: 'Malayalam', value: 'malayalam' },
    { label: 'Punjabi', value: 'punjabi' },
    { label: 'Odia', value: 'odia' },
    { label: 'Assamese', value: 'assamese' },
    { label: 'Maithili', value: 'maithili' },
    { label: 'Santali', value: 'santali' },
    { label: 'Nepali', value: 'nepali' },
    { label: 'Sinhala', value: 'sinhala' },
    // Add more as needed
  ];
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Add state for modal and search
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [showIndian, setShowIndian] = useState(false);

  const globalLanguages = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' },
    { label: 'German', value: 'german' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Russian', value: 'russian' },
    { label: 'Arabic', value: 'arabic' },
    { label: 'Portuguese', value: 'portuguese' },
    // ...add more as needed
  ];
  const indianLanguages = [
    { label: 'Hindi', value: 'hindi' },
    { label: 'Bengali', value: 'bengali' },
    { label: 'Telugu', value: 'telugu' },
    { label: 'Marathi', value: 'marathi' },
    { label: 'Tamil', value: 'tamil' },
    { label: 'Urdu', value: 'urdu' },
    { label: 'Gujarati', value: 'gujarati' },
    { label: 'Kannada', value: 'kannada' },
    { label: 'Malayalam', value: 'malayalam' },
    { label: 'Punjabi', value: 'punjabi' },
    { label: 'Odia', value: 'odia' },
    { label: 'Assamese', value: 'assamese' },
    { label: 'Maithili', value: 'maithili' },
    { label: 'Santali', value: 'santali' },
    { label: 'Nepali', value: 'nepali' },
    { label: 'Sinhala', value: 'sinhala' },
    // ...add more as needed
  ];

  // Tabs config for navbar
  const navbarTabs = [
    { title: 'Growth', icon: Rocket },
  ];

  // Add per-language, per-difficulty sample texts
  const sampleTextsByLanguageAndDifficulty = {
    english: {
      short: "Master the keyboard and unlock your potential. Every keystroke brings you closer to perfection.",
      medium: "In the midst of winter I found there was within me an invincible summer. And that makes me happy. For it says that no matter how hard the world pushes against me there is something stronger within me.",
      long: "Technology has fundamentally transformed the way we live work and communicate. From smartphones to satellites our world is connected like never before. Digital platforms empower individuals and businesses to innovate faster. Understanding technology is now essential in every field and industry.",
      thicc: "Photosynthesis is the biological process by which plants algae and certain bacteria convert light energy into chemical energy stored in glucose molecules. This process occurs in the chloroplasts using chlorophyll. Carbon dioxide and water are converted into sugars and oxygen. Light-dependent reactions take place in the thylakoid membranes. The light-independent reactions also known as the Calvin Cycle occur in the stroma. Photosynthesis is vital for life on Earth producing both oxygen and organic compounds used in food chains."
    },
    hindi: {
      short: "तेज़ भूरा लोमड़ी आलसी कुत्ते के ऊपर कूद जाती है। टाइपिंग एक कौशल्य है जो अभ्यास से सुधरता है।",
      medium: "सर्दियों के बीच में मुझे एक अजेय गर्मी मिली। और यह मुझे खुश करता है। क्योंकि यह दर्शाता है कि चाहे दुनिया कितनी भी कठिनाई से धकेले मेरे भीतर कुछ मजबूत आछे।",
      long: "प्रौद्योगिकी ने हमारे जीवन कार्य और संचार के तरीकों को मूल रूप से बदल दिया है। स्मार्टफोन्स से लेकर उपग्रहों तक हमारी दुनिया पहले कभी नहीं जुड़े हुए जैसी है। डिजिटल प्लेटफॉर्म व्यक्तियों और व्यवसायों को तेजी से नवाचार करने के लिए सशक्त बनाते हैं। सभी क्षेत्रों और उद्योगों में प्रौद्योगिकी को समझना अब आवश्यक है।",
      thicc: "प्रकाश संश्लेषण एक जैविक प्रक्रिया है जिसमें पौधे शैवाल और कुछ बैक्टीरिया प्रकाश ऊर्जा को ग्लुकोज अणुओं में संग्रहीत रासायनिक ऊर्जा में परिवर्तित करते हैं। यह प्रक्रिया क्लोरोप्लास्ट्स में क्लोरोफिल का उपयोग करके होती है। कार्बन डाइऑक्साइड और पानी को शर्करा और ऑक्सीजन में परिवर्तित किया जाता है। प्रकाश पर निर्भर प्रतिक्रियाएँ थायलेकोएड झिल्लियों में होती हैं। प्रकाश-स्वतंत्र प्रतिक्रियाएं जिन्हें कैल्विन चक्र के रूप में भी जाना जाता है स्ट्रोमा में होती हैं।"
    },
    tamil: {
      short: "வேகமான காவி நரி சோம்பேறி நாயின் மீது குதிக்கின்றது. டட்டச்சு ஒரு திறமை சிலிர்க்க உறுதி செய்கிறது.",
      medium: "குளிர்காலத்தின் நடுவில் எனக்குள் வெல்ல முடியாத கோடை கிடைத்தது. அது எனக்கு மகிழ்ச்சியைத் தருகிறது. உலகம் எவ்வளவு தீவிரமாக என்மீது தள்ளும்போதும் எனக்குள் பலம் கொண்ட ஒன்று உள்ளது.",
      long: "தொழில்நுட்பம் நம் வாழ்க்கை வேலை தொடர்புகளை அடிப்படையாக மாற்றியுள்ளது. ஸ்மார்ட்போன்கள் முதல் செயற்கைக்கோள்கள் வரை நமது உலகம் இதுவரை இல்லாதபடி இணையப்பட்டுள்ளது. டிஜிட்டல் தளங்கள் எவராலும் வணிகங்களில் வேகமாக புதுமை செய்ய நுட்பத்தை வழங்குகின்றன.",
      thicc: "ஒளித் தசைம்பத்திவதன் மூலம் தாவரங்கள் ஈர்ச்சழலாளிகள் சில வகை மூலக்கூறுகள் ஒளி ஆற்றலை கார்போ ஹைட்ரேட்டுகளில் சேமியக்க முடிவுகளை மாற்றுகிறன. இச்செயல்நிலை கலோரோபிளாஸ்ட்களால் கலோரோஃபிலின் மூலம் நிகழ்கிறது. கார்பன் டைஅக்ஸைடு மற்றும் நீர் சர்க்கரை மற்றும் ஆம்லஜநகமாக மாறுத்துகிறது."
    },
    kannada: {
      short: "ನೀವು ವೇಗವಾಗಿ ಮತ್ತು ಸರಿಯಾಗಿ ಟೈಪ್ ಮಾಡುವುದನ್ನು ಅಭ್ಯಾಸದಿಂದ ಕಲಿಯಬಹುದು. ಪ್ರತಿದಿನವೂ ಕೆಲ ನಿಮಿಷಗಳು ಅಭ್ಯಾಸ ಮಾಡುವುದು ಉತ್ತಮವಾಗಿದೆ.",
      medium: "ನಿಮ್ಮ ಟೈಪಿಂಗ್ ದಕ್ಷತೆಯನ್ನು ಸುಧಾರಿಸಲು ದಿನನಿತ್ಯ ಅಭ್ಯಾಸ ಮಾಡುವುದು ಅಗತ್ಯ. ಸರಿಯಾದ ಹತ್ತಿರದ ಕೀಲಿಗಳನ್ನು ಗೊತ್ತಾದಾಗ ತಪ್ಪುಗಳು ಕಡಿಮೆಯಾಗುತ್ತವೆ. ಗಮನವಿಟ್ಟು ಟೈಪ್ ಮಾಡುವುದರಿಂದ ಶುದ್ಧತೆ ಮತ್ತು ವೇಗ ಎರಡೂ ಸುಧಾರಿಸುತ್ತವೆ.",
      long: "ತಂತ್ರಜ್ಞಾನವು ನಾವು ಬದುಕುವ ವಿಧಾನ ಕೆಲಸ ಮಾಡುವ ವಿಧಾನ ಮತ್ತು ಸಂಪರ್ಕ ಸಾಧಿಸುವ ವಿಧಾನವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಬದಲಿಸಿದೆ. ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ಗಳಿಂದ ಉಪಗ್ರಹಗಳವರೆಗೆ ಇಂದು ಪ್ರಪಂಚವು ಹೆಚ್ಚು ಸಂಪರ್ಕಿತವಾಗಿದೆ. ಡಿಜಿಟಲ್ ವೇದಿಕೆಗಳು ವ್ಯಕ್ತಿಗಳು ಮತ್ತು ಉದ್ಯಮಗಳಿಗೆ ವೇಗವಾಗಿ ಹೊಸ ಆವಿಷ್ಕಾರಗಳನ್ನು ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ. ಪ್ರತಿ ಕ್ಷೇತ್ರದಲ್ಲಿಯೂ ತಂತ್ರಜ್ಞಾನ ತಿಳಿದಿರಬೇಕಾಗಿದೆ.",
      thicc: "ಫೋಟೋಸಿಂಥೆಸಿಸ್ ಎಂಬುದು ಸಸ್ಯಗಳು ಶೈವಲಗಳು ಮತ್ತು ಕೆಲ ಬ್ಯಾಕ್ಟೀರಿಯಾಗಳಿಂದ ನಡೆಯುವ ಜೀವಶಾಸ್ತ್ರದ ಪ್ರಕ್ರಿಯೆಯಾಗಿದ್ದು ಬೆಳಕಿನ ಶಕ್ತಿಯನ್ನು ಗ್ಲುಕೋಸ್ ಅಣುಗಳಲ್ಲಿ ಸಂಗ್ರಹಿತ ರಾಸಾಯನಿಕ ಶಕ್ತಿಯಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ. ಈ ಪ್ರಕ್ರಿಯೆ ಕ್ಲೊರೋಪ್ಲಾಸ್ಟ್‌ನಲ್ಲಿ ನಡೆಯುತ್ತದೆ ಮತ್ತು ಕ್ಲೊರೋಫಿಲ್ ಇದರಲ್ಲಿ ಪ್ರಮುಖ ಪಾತ್ರ ವಹಿಸುತ್ತದೆ. ಕಾರ್ಬನ್ ಡೈಆಕ್ಸೈಡ್ ಮತ್ತು ನೀರನ್ನು ಸಕ್ಕರೆ ಮತ್ತು ಆಮ್ಲಜನಕವಾಗಿ ಪರಿವರ್ತಿಸಲಾಗುತ್ತದೆ. ಬೆಳಕಿನ ಅವಲಂಬಿತ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಥೈಲಾಕಾಯ್ಡ್ ಝಿಲೆಯ ಮೇಲೆ ನಡೆಯುತ್ತವೆ. ಬೆಳಕಿನ ಅವಲಂಬಿತವಲ್ಲದ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಸ್ಟ್ರೋಮಾದಲ್ಲಿ ನಡೆಯುತ್ತವೆ. ಈ ಪ್ರಕ್ರಿಯೆಯು ಭೂಮಿಯ ಮೇಲೆ ಜೀವದ ನಿರ್ವಹಣೆಗೆ ಅತ್ಯಂತ ಅಗತ್ಯವಾಗಿದೆ."
    },
    telugu: {
      short: "వేగంగా కదలే తోగటెతుకుక్క మందగామి ప్రాణిని దాటుతుంది. టైపింగ్ అనేది సాధనతో మెరుగు పడే నైపుణ్యం.",
      medium: "చలికాలం మధ్యలో నాకు అనాగాన్యం వేసవి దొరికింది. ఇది నాకు ఆనందాన్ని ఇస్తుంది. ప్రపంచం ఎంత కష్టంగా నన్ను నెట్టినా నా లోపల శక్తివంతమైనది ఉంది.",
      long: "సాంకేతికత మన జీవిత, పని, మరియు కమ్యూనికేషన్ విధానాలను మార్చింది. స్మార്ట്‌ఫోన్లు నుండి ఉపగ്రహాలు వరకు, మన ప్రపంచం అసామాన్యంగా కలిసిపోయింది. డిజిట్లు వేదికలు వ్యక్తికൾకు మరియు వ్యాపారాలకు సంశయాతീతమాయి వీణుండు పునరాహ్వానం చేయడానికి శక్తి ఇస్తాయి.",
      thicc: "ప్రకాశ సంశ్లేషణ అనేది మొక్కలు, అల్గే మరియు కొన్ని బ్యాక್టೀరియా కాంతి శక్తిని రసాయన శకతిగా మార్చే జీవ ప్రకరియ. ఇందులో క్లೋరೋఫిల్ సూర్యకాంతిని పట్టుకుంటుంది, వాతావరణం నుండి కార్బన్ డయాక్సైడ్ మరియు నేల నుండి నీటిని తీసుకుని గ్లೂకೋస్ ఉత్పాదిస్తుంది మరియు ఉప ఉత్పత్తిగా ఆక్సిజన్‌ను విడుదల చేస్తుంది."
    },
    bengali: {
      short: "ত্বরিত ভূরা লোমড়ি আলস্য গ্র পুদ লাংঘদী হેয়। টাইপিং একটি দক্ষতা যা অভিযোগ সে উন্নত হয়।",
      medium: "শীতের মাঝে আমি অদম্য একটি গ্রীষ্ম খুঁজে পেয়েছিলাম। এবং এটি আমাকে খুশ করে। কারণ এটি প্রমাণ করে যে দুনিয়া কিছুটা বলা হয় আমার মধ্যে কিছু শক্তিশালী আছে।",
      long: "প্ৰযুক্তি আমাদের জীবনযাত্রা কাজ এবং যোগাযোগকে সম্পূর্ণরূপে পরিবর্তন করেছে। স্মার্টফোন থেকে সেটেলাইট পর্যন্ত আমাদের জগত কখনো এতে জুড়ে আসেনি। ডিজিটাল প্লেটফর্ম ব্যক্তি এবং ব্যবসায়িক উদ্ভাবন করার জন্য শক্তি দেয়।",
      thicc: "ফোটোসিন্থেসিস হল একটি জীববৈজ্ঞানিক প্ৰক্ৰিয়া যাতে ছড় শৈবাল এবং কিছু বেক্টেরিয়া প্রকাশ উপড়িনে রসায়নিক উদয়গে রূপান্তর করে। এই প্রক্রিয়া ক্লোরোফিল ব্যবহার করে ক্লোরোপ্লাস্টমাং ঘটে।"
    },
    marathi: {
      short: "झपाट्याने फिरणारा तपकिरी कोल्हा आळशी कुत्र्याचा ओलांडतो. टायपिंग एक कौशल्य आहे जे सरावाने सुधारते.",
      medium: "हिवाळ्यात मला एक अपरिहार्य उन्हाळा सापडला. आणि त्यामुळे मला आनंद होतो. कारण जग कितीही जोरदारपणे मला धकेल देत तरी माझ्या अंदर वळण असलेले काही आहे.",
      long: "तंत्रज्ञानाने आपल्या जीवन काम आणि संवादाच्या पद्धतींमध्ये आमूलाग्र बदल केला आहे. स्मार्टफोन ते उपग्रहपर्यंत आमचा जग कधीही नव्हता इतका जोडलेला आहे. डिजिटल प्लॅटफॉर्म व्यक्ती आणि व्यवसायांना जलद गतीने नवीन करण्यास सक्षम करतात.",
      thicc: "फोटोसिंथेसिस हा एक जੈविक प्रक्रिया आहे ज्यात वनस्पती, शੈवाळ, अंदर काही बेक्टेरिया प्रकाश उपड़िने रसायनशास्त्रीय उदयग मध्ये बदलते. या प्रक्रियेमध्ये क्लोरोफिल वापरून क्लोरोप्लास्टमध्ये होते."
    },
    urdu: {
      short: "تیز بھورا لومڑی کاہل کتے کے اوپر چھلانگ لگاتا ہے۔ ٹائپنگ ایک مہارت ہے جو مشق سے بہتر ہوتی ہے۔",
      medium: "سردیوں کے بیچ میں, मجھے اپنے اندر ایک ناقابل تسخیر گرمی ملی۔ اور یہ مجھے خوشی دیتا ہے۔ کیونکہ یہ ثابت کرتا ہے کہ چاہے دنیا کتنی بھی سختی سے مجھے دھکیل دے، پر میرے اندر کچھ زیادہ مضبوط ہے۔",
      long: "ٹیکنالوجی نے ہماری زندگی, कام, اور مواصلات کے طریقوں کو بنیادی طور 'تے بدل دیا ہے۔ स्मार्ट فونز سے لیکر سیٹلائٹس تک، ہماری دنیا اب پہلے سے کہیں زیادہ جڑی ہوئی ہے۔ ڈیجیٹل پلیٹ فارمز افراد اور کاروباروں کو تیز تر جدت فراہم کرتے ہیں۔",
      thicc: "فوٹو سنتھیسز ایک حیاتیاتی عمل ہے جس میں پودے ہلا اور کچھ بیکٹیریا روشنی کی توانائی کو کیمیائی توانائی میں تبدیل کرتے ہیں. یہ عمل کلوروفل کا استعمال کرتے ہوئے کلوروپلاسٹ میں ہوتا ہے."
    },
    gujarati: {
      short: "તેજસ્વ ભૂરા લૂમડી આલસ ગ્ર પુદ લાંઘદી હેયો. ટાઈપિંગ એક કુશળતા છે જે અભ્યાસથી સુધરે છે.",
      medium: "શીયાળાની વચ્ચે મને મારા અંદર અર્વાચીન ઉનાળો મળ્યો. અને તે મને ખુશ કરે છે. કારણ કે તે દર્શાવે છે કે દુન્યા કેટલીયે બળાનથી મને ધકેલે પણ મારા અંદર કંઈક મજૂતીસુવાગળ મળે છે.",
      long: "તંત્રજ્ઞાનવું અમારી જીવન કામ અને સંવાદની રીતે આમંત્રિત બદલી દીધી છે. સ્માર્ટ ફોન થી ઉપગ્રહ સુધી આપણું જગત ક્યારેય આકર્ષિત થઈ ગયું નથી. ડિજિટલ પ્લેટફોર્મ વ્યક્તિઓ અને વ્યવસાયો ને તીજી ને નું કરવા સમર્થ કરે છે.",
      thicc: "ફોટોસિંથેસિસ એક જੈવિક પ੍રક્રિયા છે જેમાં છડ શૈવાળ અને કેટલીક બેક્ટેરિયા પ੍રકાશ ઉપડ઼િને રસાયનિક ઊર્જામાં રૂપાંતર કરે છે. આ પ੍રક્રિયા ક્લોરોફિલનું ઉપયોગ કરીને ક્લોરોપ્લાસ્ટમાં થાય છે."
    },
    malayalam: {
      short: "വേഗത്തിലുള്ള തവിട്ട് നരി മടിയൻ നായയ്ക്കു മുകളിൽ ചാടുന്നു. ടൈപ്പിംഗ് അഭ്യാസം വഴി മെച്ചപ്പെടുന്ന ഒരു നൈപുണ്യമാണ്.",
      medium: "ശീതകാലത്തിന്റെ ഇടയിൽ എനിക്കു അജേയമായ ഒരു വേനൽക്കാലം കണ്ടെത്തി. അത് എനിക്ക് സന്തോഷം നൽകുന്നു. എന്തുകൊണ്ടെന്നാൽ ലോകം എത്ര ബലമായി എന്നെ തടസ്സപ്പെടുത്തിക്കഴിഞ്ഞാലും എന്റെ ഉള്ളിൽ വളരെ ശക്തമായ ഒന്നുണ്ട്.",
      long: "സാങ്കേതികവിദ്യ പെരുമാറ്റങ്ങൾ ജോലി കൊച്ചി തുടങ്ങിയവയെ ആസ്വദിക്കാൻ മാറ്റം വരുത്തി. സ്മാർട്ട്ഫോണുകളിൽ നിന്നും ഉപഗ്രഹങ്ങളിൽ എത്തിച്ചേരുകയും ചെയ്യുന്നു. ഡിജിറ്റൽ പ്ലാറ്റ്ഫോമുകൾ വ്യക്തികൾക്കും ബിസിനസ്സുകൾക്ക് സംശയാതീതമായി വീണ്ടും പ്രവർത്തിക്കാനും അനുവദിക്കുകയും ചെയ്യുന്നു.",
      thicc: "ഫോട്ടോസിന്തസിസ് ഒരു ജൈവശാസ്ത്ര പ്രക്രിയയാണ് ഇത് ഔപചാരിക ജൈവക കൃത്യമായ വിഷമത്തിന്റെ ഉല്പാദനവും വിപുലീകരണത്തിലേക്കും ആളിക് മാറ്റുന്നു. ഈ പ്രക്രിയ ക്രോമാറ്റിക് ഉപകരണങ്ങളിലും സൂക്ഷ്മബന്ധത്തിൽ ശ്രദ്ധകൊടുക്കുന്നു."
    },
    punjabi: {
      short: "ਤੇਜ਼ ਭੂਰਾ ਲੂਮੜੀ ਆਲਸ ਗਰ ਪੁੱਦ ਲਾਂਘਦੀ ਹੈ। ਟਾਈਪਿੰਗ ਉਹ ਹਨਰ ਹੈ ਜੋ ਅਭਿਆਸ ਨਾਲ ਸੁਧਰਦਾ ਹੈ।",
      medium: "ਸਰਦੀ ਦੇ ਵਿਚਕਾਰ ਮੈਂ ਖੁਸ਼ੀ ਦਾ ਅਦਮਤ ਗਰਮੀਆ ਮਹਿਸੂਸ ਕੀਤਾ। ਅਤੇ ਇਸ ਨਾਲ ਮੇਰਾ ਦਿਲ ਖ਼ੁਸ਼ ਹੁੰਦਾ ਹੈ। ਇਹ ਦਿਖਾਉਂਦਾ ਹੈ ਕਿ ਦੁਨੀਆ ਜਿੰਨੀ ਵੀ ਮੇਰੀ ਉਪਰ ਧ੍ਕੇਲਣ ਕਈ ਮੇਰੇ ਅੰਦਰ ਕੁਝ ਮਜੂਤੀਸ਼ਾਲ ਮੁਜੂਦ ਹੈ।",
      long: "ਤਕਨੀਕ ਨੇ ਸਾਡੇ ਜੀਵਨ ਕੰਮ ਅਤੇ ਸੰਚਾਰ ਦੇ ਢੰਗ ਨੂੰ ਬੁਨਿਆਦੀ ਤੌਰ 'ਤੇ ਬਦਲ ਦਿਤਾ ਹੈ। ਸਮਾਰਟਫੋਨ ਤੋਂ ਸੈਟੇਲਾਈਟ ਤੱਕ ਸਾਡਾ ਸੰਸਾਰ ਹੁਣ ਪਹਿਲਾਂ ਕਦੇ ਵੀ ਨਹੀਂ ਜੁੜਿਆ ਹੈ। ਡਿਜ਼ੀਟਲ ਪਲੇਟਫਾਰਮ ਵਿਅਕਤੀਆਂ ਅਤੇ ਕਾਰੋਬਾਰ ਨੂੰ ਤੀਜ਼ੀ ਨਾਲ ਨਵੱਛਣ ਦੀ ਸਮਰਥਕ ਬਣਾਉਦਾ ਹੈ।",
      thicc: "ਫੋਟੋਸਿੰਥੈਸਿਸ ਇੱਕ ਜੀਵ ਵਿਗਿਆਨਕ ਪ੍ਰਕਿਰਿਆ ਹੈ ਜਿਸ ਵਿੱਚ ਖਰੀ ਅਲਜੀ ਵ ਅੰਨੇਕ ਬੈਕਟੀਰੀਆ ਰੋਸ਼ਨੀ ਦੀ ਉਰਜਾ ਨੂੰ ਰਸਾਇਨੀਕ ਉਦਯੋਗ ਰੂਪ ਵਿੱਚ ਘੜਨਾ ਕਰਦਾ ਹੈ। ਇਹ ਪ੍ਰਕਿਰਿਆ ਕਲੋਰੋਫ਼ਿਲ ਯਉਗ ਕਲੋਰੋਪਲਾਸਟ ਅੰਦਰ ਹੋਣ ਹੁੰਦਾ ਹੈ."
    },
    odia: {
      short: "ତୀବ୍ର ବାଦାମୀ ଶିଆଳ ଆଳସା କୁକୁର ଉପରେ ଚାଳୁଛି। ଟାଇପିଂ ଏକ କୌଶଳ ଯାହା ପ୍ରାକଟିସ ସହିତ ଉନ୍ନତ ହୁଏ।",
      medium: "ଶୀତ ସମୟରେ ମୁଁ ମୋ ମନ ଭିତରେ ଜୟରହିତ ଗରମି ଖୋଜିଲି। ଏବଂ ଏହା ମତେ ଖୁସି କରେ। ଏହା ପ୍ରମାଣ করে ଯେ ବିଶ୍ୱ କେତେ ଭଳି ଭାବରେ ମୋ ଉପରେ ଧକ୍କା ମାରି ମୋର ଭିତରେ କିଛି ଦୃଢ଼ ଅଛି।",
      long: "ପ୍ରଯୁକ୍ତିବିଦ୍ୟା ଆମର ଜୀବନ କାମ ଏବଂ ଯୋଗାଯୋଗ ପ୍ରଣାଳୀକୁ ମୌଳିକ ଭାବେ ପରିବର୍ତ୍ତିତ କରିଛି। ସ୍ମାର୍ଟଫୋନ ରୁ ଉପଗ୍ରହ ପର୍ଯ୍ୟନ୍ତ ଆମ୍ଭ ଦୁନିଆ ବର୍ତ୍ତମାନ ପୂର୍ବରୁ କେବେଭୁଳି ଏତେ ଜଡିତ ହୋଇ ନାହିଁ। ଡିଜିଟାଲ ପ୍ଲାଟଫର୍ମ ବ୍ୟକ୍ତିଗତ ଏବଂ ବ୍ୟବସାୟ ଉଦ୍ଭାବନକୁ ଆରମ୍ଭ କରିବାରେ ସକ୍ଷମ କରେ।",
      thicc: "ଫୋଟୋସିନ୍ଥେସିସ ଜୀବ ଶାସ୍ତ୍ର ବିଦ୍ୟାମଧ୍ୟମ ଯାହାରେ ଉଦ୍ଭିଦ ଶୈବାଳ ଏବଂ କିଛି ଜୀବାଣୁ ଆଲୋକ ଶକ୍ତିକୁ ରସାୟନିକ ଶକ୍ତିରେ ରୂପାନ୍ତର ହୁଏ। ଏହି ପ୍ରକ୍ରିୟା କ୍ଲୋରୋଫିଲ୍ ବ୍ୟବହାର କରି କ୍ଲୋରୋପ୍ଲାଷ୍ଟରେ ଘଟେ।"
    },
    assamese: {
      short: "তেজ মুক্‌লি সিয়ালি অলস কুকুৰৰ ওপৰত জঁপ মাৰে। টাইপিং এটা দক্ষতা যি অনুশীলনেৰে উন্নত হয়।",
      medium: "শীতকালৰ মাজত মই মোৰ ভিতৰত এক অবিনশ্বৰ গ্ৰীষ্ম উলিয়ালোঁ। আৰু এইয়া মোক সুখী কৰে। কাৰণ এইয়া দেখুৱায় যে পৃথিৱী জিমানেই শক্তিশালীভাৱে মোক ঠেলা নাকৰে মোৰ ভিতৰত কিবা শক্তি আছে।",
      long: "প্ৰযুক্তিয়ে আমাৰ জীৱন কাম আৰু যোগাযোগৰ ধৰণ সম্পূৰ্ণ ৰূপে সলনি কৰিছে। স্মাৰ্টফোনৰ পৰা উপগ্ৰহলৈ আমাৰ পৃথিৱী এতিয়া পৰস্পৰত সংযুক্ত। ডিজিটেল প্লাটফৰ্মবোৰে ব্যক্তি আৰু ব্যৱসায়সমূহক সোনকালে সৃষ্টিশীল কৰিলে সহায় কৰে।",
      thicc: "ফ'ট'চিন্থেছিছ এটা জীৱ বৈজ্ঞানিক প্ৰক্ৰিয়া য'ত গছ-গছনি শৈৱাল আৰু কিছুমান বেক্টেৰিয়াই পোহৰ শক্তি ৰাসায়নিক শক্তি ৰূপে ৰূপান্তৰিত কৰে। এই প্ৰক্ৰিয়াটো ক্ল'ৰ'ফিল ব্যবহাৰ কৰি ক্ল'ৰ'প্লাষ্টত ঘটে।"
    },
    maithili: {
      short: "तुरंत भूरे रंग के सियार अलसी कुकुर के छलांग लगबैत अछि। टाइपिंग एक कौशल अछि जे अभ्यास सं सुध्रैत अछि।",
      medium: "जाड़क मौसमक मध्यमेँ हम अपन भीतर अनतिक्रमणीय ग्रीष्म देखलौं। आ ई हमरा खुशी दैत अछि। कारण ई देखबैत अछि जे संसार जतबे जोर सँ हमरा जोर करय हमरा भीतर किछु मजबूत अछि।",
      long: "प्रविधिकेँ हमरा जीवन कार्य आ संचारक रूप बहुते बदलि देने अछि। स्मार्टफोन सँ सेटेलाइट तक हमरा संसार अभिए सम्मिलित अछि। डिजिटल प्लेटफार्म आपसी आ व्यवसायिक सभ केँ त्वरित नव सृजनका लागि सक्षम करैत अछि।",
      thicc: "फोटोसिंथेसिस एक जैविक प्रक्रिया अछि जइमेँ पौधा अल्गी आ किछु ब्याक्टेरिया प्रकश ऊर्जा केँ रासायनिक ऊर्जा मे परिवर्तित करैत अछि। ई प्रक्रिया क्लोरोफिलकेँ उपयोग करैत अछि जे क्लोरोप्लास्टमेँ घटैत अछि।"
    },
    santali: {
      short: "Bagaya khoya hato rako sitma dhon geda lagod. Typing awe binsiye ta bik nemag kom thak chi.",
      medium: "Sai din majani len hemeng hepati geda pithi kaklo. Awe len cumbi kupara. Kipor hempa resok khosa re len golwar lamatar hemeng onor pandi kinor geda chiri.",
      long: "Tajan din atikchi daehela he melgi thiya sina khon birat gelog sir. Smartphones ba kalthangang hemeng sata balga koden bar jariena. Digital platform hiri awe birwa mah geda kam lasambe awe dumai raw samon cho.",
      thicc: "Photosynthesis awe durumbat chi hemeng mering aor agi go bacchar langowa. Agi awe sa depa chi chlorophyll useba chi chloroplast la. Ul hango chi harel tanser awe palba awe ghaya aseka chi ziemma."
    },
    nepali: {
      short: "चाँडो प्रयास गर्ने भालु आलसी कुकुरमा माथि उफ्रिन्छ। टाइपिंग एउटा सीप हो जसले अभ्यासबाट सुधार गर्दछ।",
      medium: "जाडोको बीचमा मैले मेरा भित्र एक अपरिहार्य गर्मी फेला पारे। र यसले मलाई खुशी बनाउँछ। किनकी यो देखाउँछ कि संसार जति ढिलो रुपमा मलाई धकेल्छ मेरो भित्र केही शक्ति छ।",
      long: "प्रविधिले हाम्रो जीवन काम र संवादको तरिकालाई मौलिक रुपमा परिवर्तन गरेको छ। स्मार्टफोनदेखि उपग्रहसम्म हाम्रो संसार अब कहिल्यो कनेक्टेड छ। डिजिटल प्लेटफर्महरूले व्यक्तिहरूलाई र व्यवसायहरूलाई नयाँ द्रुत गतिमा सिर्जना गर्न सक्षम बनाउँछ।",
      thicc: "फोटोसिन्थेसिस एक जैविक प्रक्रिया हो जसमा बिरुवाहरू शैवाल र केहि ब्याक्टेरिया प्रकाश ऊर्जा रासायनिक ऊर्जा ग्लुकोजमा परिवर्तित गर्दछ। यो प्रक्रिया क्लोरोफिलको प्रयोग गरेर क्लोरोप्लास्टको भित्र हुन्छ।"
    },
    sinhala: {
      short: "Vegavana kalu wušṭara hama naya kevara duppeta kadinava. Typing kiyanne abiasaṭa viśēśa tirṇyaak.",
      medium: "Himatama sadde mata lo venasak hemada gai. Eka mata satutak denava. Lokaya mata kisima thargena meselā yana venaṭa magē sunukama ātma viśēśa tanna thibena aya.",
      long: "Tathvakneka uganveya meyen abhisheka vannuṭa oʻvī. Seval do parakma karaṇnuṭa ledā ātma grahana vev hasurak kohoma apa nām ḍanavā vā ekatuvī.",
      thicc: "Photosynthesis yana wa ātma anušaṅga bī keṭuna vē. Eketin pīnī kiriema modaya oxasu rinasaṅgahirik aghaṣaṭa. Ekepradeśa apāṇa prakāraṇkaraṇa voṭa hāraṇya deṭeḷa colopheye varṇa. Ekevānanya calvanṭa vū hāsilopāna tisuhaṣakha."
    },
    spanish: {
      short: "El rápido zorro marrón salta sobre el perro perezoso. Escribir es una habilidad que mejora con la práctica.",
      medium: "En medio del invierno encontré un verano invencible dentro de mí. Y eso me hace feliz. Porque dice que no importa cuán fuerte me empuje el mundo dentro de mí hay algo más fuerte.",
      long: "La tecnología ha transformado fundamentalmente la forma en que vivimos trabajamos y nos comunicamos. Desde los teléfonos inteligentes hasta los satélites nuestro mundo está más conectado que nunca. Las plataformas digitales permiten a las personas y empresas innovar más rápido.",
      thicc: "La fotosíntesis es el proceso biológico mediante el cual las plantas algas y ciertas bacterias convierten la energía luminosa en energía química almacenada en moléculas de glucosa. Este proceso ocurre en los cloroplastos utilizando clorofila. El dióxido de carbono y el agua se convierten en azúcares y oxígeno."
    },
    french: {
      short: "Le rapide renard brun saute par-dessus le chien paresseux. Taper est une compétence qui s'améliore avec la pratique.",
      medium: "Au milieu de l'hiver j'ai découvert en moi un été invincible. Et cela me rend heureux. Car cela dit que peu importe la force avec laquelle le monde me pousse il y a quelque chose de plus fort en moi.",
      long: "La technologie a fondamentalement transformé notre façon de vivre de travailler et de communiquer. Des smartphones aux satellites notre monde est connecté comme jamais auparavant. Les plateformes numériques permettent aux individus et aux entreprises d'innover plus rapidement.",
      thicc: "La photosynthèse est le processus biologique par lequel les plantes les algues et certaines bactéries convertissent l'énergie lumineuse en énergie chimique stockée dans les molécules de glucose. Ce processus se déroule dans les chloroplastes à l'aide de chlorophylle. Le dioxyde de carbone et l'eau se transforment en sucres et en oxygène."
    },
    german: {
      short: "Der schnelle braune Fuchs springt über den faulen Hund. Tippen ist eine Fähigkeit die sich mit Übung verbessert.",
      medium: "Mitten im Winter fand ich in mir einen unbesiegbaren Sommer. Und das macht mich glücklich. Denn es sagt dass egal wie stark die Welt gegen mich drückt es gibt etwas Stärkeres in mir.",
      long: "Die Technologie hat unsere Lebensweise Arbeit und Kommunikation grundlegend verändert. Vom Smartphone bis zum Satelliten ist unsere Welt stärker vernetzt als je zuvor. Digitale Plattformen ermöglichen es Einzelpersonen und Unternehmen schneller zu innovieren.",
      thicc: "Die Photosynthese ist der biologische Prozess bei dem Pflanzen Algen und einige Bakterien Lichtenergie in chemische Energie umwandeln die in Glukosemolekülen gespeichert ist. Dieser Prozess findet in den Chloroplasten unter Verwendung von Chlorophyll statt. Kohlendioxid und Wasser werden in Zucker und Sauerstoff umgewandelt."
    },
    chinese: {
      short: "快速的棕色狐狸跳过懒狗。打字是一种通过练习提高的技能。",
      medium: "在冬季的中间我发现内心有一个不可征服的夏天。这让我快乐。因为这意味着无论世界多么强烈地推我我内心都有更强的东西。",
      long: "技术从根本上改变了我们的生活工作和交流方式。从智能手机到卫星我们的世界从未如此互联。数字平台使个人和企业能够更快速地创新。",
      thicc: "光合作用是植物藻类和某些细菌通过叶绿体内的叶绿素将光能转化为储存在葡萄糖分子中的化学能的生物过程。二氧化碳和水被转化为糖和氧气。"
    },
    japanese: {
      short: "素早い茶色の狐は怠け者の犬を飛び越えます。タイピングは練習で上達するスキルです。",
      medium: "冬の真ん中で私は自分の中に無敵の夏を見つけました。それが私を幸せにします。なぜなら世界がどんなに強く押しつけても私の中にはもっと強いものがあるからです。",
      long: "技術は私たちの生活仕事コミュニケーションの方法を根本的に変えました。スマートフォンから人工衛星まで私たちの世界はこれまでになくつながっています。デジタルプラットフォームは個人や企業がより迅速に革新することを可能にします。",
      thicc: "光合成は植物藻類および特定の細菌が光エネルギーをクロロフィルを使用してグルコース分子に蓄えられた化学エネルギーに変換する生物学的プロセスです。このプロセスは葉緑体で行われます。"
    },
    russian: {
      short: "Быстрая коричневая лисица перепрыгивает через ленивую собаку. Набор текста это навык который улучшается с практикой.",
      medium: "В середине зимы я обнаружил в себе непобедимое лето. И это делает меня счастливым. Потому что это показывает что несмотря на то как сильно мир меня давит в меня есть что-то более сильное.",
      long: "Технологии кардинально изменили то как мы живем работаем и общаемся. От смартфонов до спутников наш мир связан как никогда прежде. Цифровые платформы позволяют людям и бизнесу быстрее внедрять инновации.",
      thicc: "Фотосинтез это биологический процесс в ходе которого растения водоросли и некоторые бактерии превращают световую энергию в химическую энергию хранящуюся в молекулах глюкозы. Этот процесс происходит в хлоропластах с использованием хлорофилла."
    },
    arabic: {
      short: "الثعلب البني السريع يقفز فوق الكلب الكسول. الكتابة مهارة تتحسن مع الممارسة.",
      medium: "في وسط الشتاء وجدت في داخلي صيفًا لا يُقهر. وهذا يجعلني سعيدًا. لأنه بغض النظر عن مدى قوة دفع العالم لي هناك شيء أقوى بداخلي.",
      long: "لقد غيرت التكنولوجيا جذريًا الطريقة التي نعيش بها ونعمل ونتواصل. من الهواتف الذكية إلى الأقمار الصناعية أصبح عالمنا مرتبطًا بشكل غير مسبوق. تُمكّن المنصات الرقمية الأفراد والشركات من الابتكار بشكل أسرع.",
      thicc: "التمثيل الضوئي هو العملية البيولوجية التي تقوم من خلالها النباتات والطحالب وبعض البكتيريا بتحويل الطاقة الضوئية إلى طاقة كيميائية مخزنة في جزيئات الجلوكوز. تحدث هذه العملية في البلاستيدات الخضراء باستخدام الكلوروفيل."
    },
    portuguese: {
      short: "A rápida raposa marrom pula sobre o cachorro preguiçoso. Digitar é uma habilidade que melhora com a prática.",
      medium: "No meio do inverno encontrei dentro de mim um verão invencível. E isso me faz feliz. Pois mostra que não importa o quanto o mundo me empurre há algo mais forte dentro de mim.",
      long: "A tecnologia transformou fundamentalmente a maneira como vivemos trabalhamos e nos comunicamos. De smartphones a satélites nosso mundo está mais conectado do que nunca. As plataformas digitais permitem que indivíduos e empresas inovem mais rapidamente.",
      thicc: "A fotossíntese é o processo biológico pelo qual plantas algas e algumas bactérias convertem a energia luminosa em energia química armazenada em moléculas de glicose. Este processo ocorre nos cloroplastos usando clorofila."
    },
    // ...other languages remain unchanged
  };

  // Function to modify text based on punctuation and numbers preferences
  const modifyTextForOptions = (text: string, mode?: string): string => {
    if (!text) return text;
    
    // Don't modify coding/syntax mode text - preserve formatting and always include punctuation/numbers
    if (mode === 'coding' || mode === 'syntax') {
      // Force punctuation and numbers to be true for coding mode (they're always included)
      return text;
    }
    
    let modifiedText = text;
    
    // Remove punctuation if disabled
    if (!includePunctuation) {
      // Remove common punctuation marks but keep spaces and word boundaries
      modifiedText = modifiedText.replace(/[.,!?;:'"()\[\]{}\-_=+<>\/\\|`~@#$%^&*]/g, '');
      // Clean up multiple spaces that might result (but preserve newlines and single spaces)
      modifiedText = modifiedText.replace(/[ \t]+/g, ' ').replace(/ +$/gm, '');
    }
    // If includePunctuation is true, keep text as-is (don't modify)
    
    // Handle numbers
    if (!includeNumbers) {
      // Remove all digits (0-9) but preserve word boundaries
      modifiedText = modifiedText.replace(/[0-9]/g, '');
      // Clean up multiple spaces that might result (but preserve newlines and single spaces)
      modifiedText = modifiedText.replace(/[ \t]+/g, ' ').replace(/ +$/gm, '');
    } else {
      // If numbers are enabled, ensure some numbers exist in the text
      const hasNumbers = /[0-9]/.test(modifiedText);
      if (!hasNumbers && modifiedText.length > 10) {
        // Add numbers to the text by inserting them between words
        // Split by whitespace to get words, but preserve the structure
        // Filter out empty strings from multiple spaces
        const words = modifiedText.split(/\s+/).filter(word => word.trim().length > 0);
        const numbers = ['1', '2', '3', '4', '5', '10', '20', '50', '100', '2024'];
        let numberIndex = 0;
        const wordsWithNumbers: string[] = [];
        
        for (let i = 0; i < words.length; i++) {
          wordsWithNumbers.push(words[i]);
          
          // Add a number after every 5 words, but not at the very end
          // Insert with proper spacing to maintain word boundaries
          if (i > 0 && (i + 1) % 5 === 0 && i < words.length - 1) {
            wordsWithNumbers.push(numbers[numberIndex % numbers.length]);
            numberIndex++;
          }
        }
        
        // Join with single spaces to preserve word boundaries
        modifiedText = wordsWithNumbers.join(' ');
      }
    }
    
    return modifiedText;
  };

  // On language, difficulty, mode, or option changes, update currentText
  useEffect(() => {
    // Only update currentText if not in custom mode
    if (currentMode !== 'custom') {
    const newText = generateNewText(currentMode, difficulty, language);
    // Apply punctuation and numbers modifications (skip for coding/syntax to preserve formatting)
    const modifiedText = modifyTextForOptions(newText, currentMode);
    // For coding/syntax mode, preserve original formatting and force punctuation/numbers
    if (currentMode === 'coding' || currentMode === 'syntax') {
      // Force include punctuation and numbers for coding mode
      setIncludePunctuation(true);
      setIncludeNumbers(true);
      setCurrentText(modifiedText);
    } else {
      // Trim and normalize spaces to prevent wrapping issues - remove trailing spaces from each line
      const normalizedText = modifiedText
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim()
        .replace(/\s+/g, ' ');
      setCurrentText(normalizedText);
    }
    }
    // Optionally reset userInput, errors, etc. here if desired
  }, [language, difficulty, currentMode, includePunctuation, includeNumbers]);

  // On initial load, set currentText to default
  useEffect(() => {
    const text = sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || "";
    // Trim and normalize spaces to prevent wrapping issues - remove trailing spaces from each line
    const normalizedText = text
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim()
      .replace(/\s+/g, ' ');
    setCurrentText(normalizedText);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isTyping && currentMode === 'time' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping, currentMode, timeLeft]);

  // Calculate WPM and accuracy (correct logic)
  const calculateStats = useCallback(() => {
    if (!startTime) return;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    // Count correct characters only
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === currentText[i]) correctChars++;
    }
    const totalTyped = userInput.length;
    // WPM = (correct characters / 5) / time in minutes
    // Cap WPM at 300 (world record is ~216 WPM, but allow some buffer for edge cases)
    const calculatedWpm = timeElapsed > 0 ? (correctChars / 5) / timeElapsed : 0;
    const currentWpm = Math.min(300, Math.max(0, Math.round(calculatedWpm)));
    // Accuracy = (correct characters / total characters) * 100
    // Ensure accuracy is between 0 and 100
    const calculatedAccuracy = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 100;
    const currentAccuracy = Math.min(100, Math.max(0, Math.round(calculatedAccuracy)));
    setWpm(currentWpm);
    setAccuracy(currentAccuracy);
  }, [userInput, currentText, startTime]);

  // Enhanced handleInputChange to track keystrokes and error types
  // Track previous input to detect Grammarly/extension modifications
  const previousInputRef = useRef<string>('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const previousValue = previousInputRef.current;
    
    // Prevent input longer than current text
    if (value.length > currentText.length) {
      // Reset to previous value if extension tries to add extra characters
      if (inputRef.current) {
        inputRef.current.value = previousValue;
      }
      return;
    }
    
    // Detect if Grammarly or other extensions modified the text
    // If the change is not a simple append (new char at end) or single deletion,
    // it might be an extension modification
    const isSimpleAppend = value.length === previousValue.length + 1 && 
                           value.slice(0, -1) === previousValue;
    const isSimpleDelete = value.length === previousValue.length - 1 && 
                           value === previousValue.slice(0, -1);
    const isBackspaceDelete = value.length < previousValue.length && 
                              value === previousValue.slice(0, value.length);
    
    // If it's not a simple keystroke, check if it's a valid modification
    // (e.g., Grammarly correcting a word)
    if (!isSimpleAppend && !isSimpleDelete && !isBackspaceDelete && value !== previousValue) {
      // This might be an extension modification
      // Only accept if the new value matches the expected text better
      // or if it's a valid correction within the current word
      const currentWordEnd = Math.min(
        previousValue.length,
        (previousValue.lastIndexOf(' ') + 1) || 0
      );
      const modifiedPart = value.slice(currentWordEnd);
      const expectedPart = currentText.slice(currentWordEnd, value.length);
      
      // If the modification doesn't match expected text, reject it
      if (modifiedPart !== expectedPart && value.length <= currentText.length) {
        // Check if it's a valid single-character change (typo correction)
        let diffCount = 0;
        let diffIndex = -1;
        for (let i = 0; i < Math.min(value.length, previousValue.length); i++) {
          if (value[i] !== previousValue[i]) {
            diffCount++;
            if (diffIndex === -1) diffIndex = i;
          }
        }
        
        // If more than 1 character changed, it's likely an extension modification - reject it
        if (diffCount > 1 || (value.length !== previousValue.length && diffCount > 0)) {
          // Reset to previous value
          if (inputRef.current) {
            inputRef.current.value = previousValue;
            setUserInput(previousValue);
            setCurrentIndex(previousValue.length);
            previousInputRef.current = previousValue;
            return;
          }
        }
      }
    }
    
    // Update previous input reference
    previousInputRef.current = value;
    
    // If input is cleared, stop typing immediately
    if (value.length === 0) {
      setIsTyping(false);
      if (typingPauseTimeoutRef.current) {
        clearTimeout(typingPauseTimeoutRef.current);
      }
    } else {
    // Start typing if not already started
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      setStartTime(Date.now());
      setChartData([{ x: 0, y: 0, acc: 100 }]);
      }
      
      // Reset typing pause timeout on each keystroke
      if (typingPauseTimeoutRef.current) {
        clearTimeout(typingPauseTimeoutRef.current);
      }
      // Set isTyping to false after 2 seconds of inactivity (user paused)
      if (isTyping && value.length > 0) {
        typingPauseTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    }
    
    // Update user input immediately for responsive typing
    setUserInput(value);
    setCurrentIndex(value.length);
    
    // Recalculate errors and accuracy on every change
    let errorCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== currentText[i]) errorCount++;
    }
    setErrors(errorCount);
    // Calculate accuracy: (correct characters / total characters) * 100
    // If no input, show 100%. If all wrong, show 0% (not negative)
    const totalChars = value.length;
    const correctChars = totalChars - errorCount;
    const currentAcc = totalChars > 0 
      ? Math.max(0, Math.round((correctChars / totalChars) * 100))
      : 100;
    setAccuracy(currentAcc);
    // Debounce the heavy calculations to prevent lag during fast typing
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Calculate WPM and accuracy for this keystroke
      // WPM = (correct characters / 5) / time in minutes
      const timeElapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
      // Only count correct characters for WPM calculation
      // Cap WPM at 300 (world record is ~216 WPM, but allow some buffer for edge cases)
      const calculatedWpm = timeElapsed > 0 ? (correctChars / 5) / timeElapsed : 0;
      const currentWpm = Math.min(300, Math.max(0, Math.round(calculatedWpm)));
      // Update chart data only when necessary
      setChartData(prev => {
        const newChartData = [...prev, { x: value.length, y: currentWpm, acc: currentAcc }];
        return newChartData;
      });
      // Update keystroke stats (debounced to prevent lag)
      setKeystrokeStats(prev => {
        const keyCounts = { ...(prev.keyCounts || {}) };
        let total = prev.total;
        let correct = prev.correct;
        let incorrect = prev.incorrect;
        let extra = prev.extra;
        
        if (value.length > userInput.length) {
          let newChar = value[value.length - 1];
          // Normalize to uppercase for letters, keep others as is
          if (/^[a-zA-Z]$/.test(newChar)) newChar = newChar.toUpperCase();
          // Track all keys
          keyCounts[newChar] = (keyCounts[newChar] || 0) + 1;
          // --- Finger usage tracking ---
          const finger = keyToFinger[newChar] || 'other';
          // setFingerUsage(fu => ({ ...fu, [finger]: (fu[finger] || 0) + 1 })); // Removed as per edit hint
          total++;
          if (newChar === currentText[value.length - 1]) {
            correct++;
          } else {
            incorrect++;
          }
        } else if (value.length < userInput.length) {
          extra++;
        }
        
        return {
          total,
          correct,
          incorrect,
          extra,
          keyCounts,
        };
      });
      
      // Error types (debounced)
      if (value.length > userInput.length && value[value.length - 1] !== currentText[value.length - 1]) {
        const expected = currentText[value.length - 1];
        const actual = value[value.length - 1];
        setErrorTypes(prev => {
          if (/\p{P}/u.test(expected)) return { ...prev, punctuation: prev.punctuation + 1 };
          if (/[A-Za-z]/.test(expected) && expected.toLowerCase() === actual.toLowerCase() && expected !== actual) return { ...prev, case: prev.case + 1 };
          if (/[0-9]/.test(expected)) return { ...prev, number: prev.number + 1 };
          return { ...prev, other: prev.other + 1 };
        });
      }
    }, 50); // 50ms debounce for smooth typing
    
    // Check if test is complete
    if (value.length >= currentText.length || (currentMode === 'words' && value.trim().split(' ').length >= wordLimit)) {
      handleTestComplete();
    }
  };

  // Enhanced handleTestComplete to push a final WPM point and calculate consistency
  const handleTestComplete = () => {
    setIsTyping(false);
    calculateStats();
    setShowResults(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typingPauseTimeoutRef.current) clearTimeout(typingPauseTimeoutRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
      // Count correct characters only
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === currentText[i]) correctChars++;
      }
      const totalTyped = userInput.length;
      // WPM = (correct characters / 5) / time in minutes
      // Cap WPM at 300 (world record is ~216 WPM, but allow some buffer for edge cases)
      const calculatedFinalWpm = timeElapsed > 0 ? (correctChars / 5) / timeElapsed : 0;
      const finalWpm = Math.min(300, Math.max(0, Math.round(calculatedFinalWpm)));
      // Accuracy = (correct characters / total characters) * 100
      // Ensure accuracy is between 0 and 100
      const calculatedFinalAcc = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 100;
      const finalAcc = Math.min(100, Math.max(0, Math.round(calculatedFinalAcc)));
      // Compute final chart data
      const finalChartData = [...chartData];
      if (finalChartData.length === 0 || finalChartData[finalChartData.length - 1].x !== userInput.length) {
        finalChartData.push({ x: userInput.length, y: finalWpm, acc: finalAcc });
      }
      const finalKeystrokeStats = { ...keystrokeStats, keyCounts: { ...keystrokeStats.keyCounts } };
      const finalErrorTypes = { ...errorTypes };
      setTimeout(() => {
        setConsistency(() => {
          if (finalChartData.length >= 2) {
            const wpmValues = finalChartData.map(p => p.y);
            const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
            const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
            const stddev = Math.sqrt(variance);
            if (mean === 0) return 0;
            return Math.max(0, Math.min(100, Math.round(100 - (stddev / mean) * 100)));
          }
          return 0;
        });
      }, 0);
      updateStats({
        wpm: finalWpm,
        accuracy: finalAcc,
        errorTypes: finalErrorTypes,
        keystrokeStats: { keyCounts: { ...finalKeystrokeStats.keyCounts } },
      });
      // --- Gamification logic ---
      // Always award XP after a test, for both guests and signed-in users
      if (gamificationEnabled && typeof addXP === 'function') {
        // Award XP: 1 XP per word, bonus for high accuracy/speed
        let xpEarned = Math.round(correctChars / 5) + (finalAcc >= 98 ? 10 : 0) + (finalWpm >= 60 ? 10 : 0);
        if (xpEarned > 0) addXP(xpEarned);
        // Streak: Only increment once per day if accuracy >= 90
        // The incrementStreak function handles checking if we've already counted today
        if (finalAcc >= 90 && typeof incrementStreak === 'function') {
          incrementStreak(); // This will only increment if today's test hasn't been counted yet
        }
        // Note: We don't reset streak immediately on low accuracy - streak is based on daily activity
        // Badges: check and unlock
        if (finalWpm >= 60 && typeof addBadge === 'function') addBadge('Speedster');
        if (finalAcc >= 98 && typeof addBadge === 'function') addBadge('Accuracy Ace');
        
        // For streak badges: Check after incrementStreak updates state
        // incrementStreak only increments if today hasn't been counted yet
        // So we check badges after a brief delay to allow state to update
        if (finalAcc >= 90) {
          // Use setTimeout to check badges after incrementStreak has updated the state
          setTimeout(() => {
            // Re-read gamification state to get updated streak
            // Note: This closure captures the current gamification state
            // We need to check the actual updated value
            // For now, calculate expected: if this is first test today, streak increments
            // The incrementStreak function handles the logic, so we check what it would result in
            const currentStreak = gamification.streak;
            // Since incrementStreak was just called and accuracy >= 90,
            // if today wasn't counted, streak will be currentStreak + 1
            // But we can't know for sure without lastTestDate, so we check both possibilities
            const minExpectedStreak = currentStreak; // At minimum, current streak
            const maxExpectedStreak = currentStreak + 1; // At maximum, current streak + 1
            
            // Check with the higher value (worst case, we check twice but addBadge prevents duplicates)
            if (maxExpectedStreak >= 3 && typeof addBadge === 'function') addBadge('Streak Starter');
            if (maxExpectedStreak >= 5 && typeof addBadge === 'function') addBadge('Consistency King');
          }, 100); // Small delay to allow state update
        }
        // Add more badge logic as needed
      }
      // --- Leaderboard upsert ---
      if (user && user.id && user.id !== 'guest') {
        const wordCount = userInput.trim().split(/\s+/).length;
        // Save duration and timestamp for analytics filtering
        const duration = currentMode === 'time' ? timeLimit : wordLimit;
        const timestamp = new Date().toISOString();
        saveTestResultToSupabase({
          userId: user.id,
          wpm: finalWpm,
          accuracy: finalAcc,
          errors,
          time: currentMode === 'time' ? timeLimit - timeLeft : Math.floor((Date.now() - (startTime || 0)) / 1000),
          consistency,
          keystrokeStats: finalKeystrokeStats,
          errorTypes: finalErrorTypes,
          wordCount,
          duration,
          timestamp,
        });
      }
    }
  };

  // Enhanced resetTest to always reset WPM history and stats
  const resetTest = useCallback((newTimeLimit = undefined, skipFocus = false) => {
    setIsTyping(false);
    setTimeLeft(currentMode === 'time' ? (newTimeLimit ?? timeLimit) : 0);
    setUserInput('');
    setCurrentIndex(0);
    setErrors(0);
    setStartTime(null);
    setShowResults(false);
    setWpm(0);
    setAccuracy(100);
    setWpmHistory([{ t: 0, wpm: 0 }]);
    
    // Regenerate text with current options
    if (currentMode !== 'custom') {
      const newText = generateNewText(currentMode, difficulty, language);
      const modifiedText = modifyTextForOptions(newText, currentMode);
      // For coding/syntax mode, preserve original formatting
      if (currentMode === 'coding' || currentMode === 'syntax') {
        setCurrentText(modifiedText);
      } else {
        const normalizedText = modifiedText
          .split('\n')
          .map(line => line.trimEnd())
          .join('\n')
          .trim()
          .replace(/\s+/g, ' ');
        setCurrentText(normalizedText);
      }
    }
    setKeystrokeStats({ total: 0, correct: 0, incorrect: 0, extra: 0, keyCounts: {} });
    setErrorTypes({ punctuation: 0, case: 0, number: 0, other: 0 });
    setConsistency(null);
    setChartData([{ x: 0, y: 0, acc: 100 }]);
    // Reset line scrolling
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Clear any timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    if (typingPauseTimeoutRef.current) clearTimeout(typingPauseTimeoutRef.current);
    // Only focus input if skipFocus is false
    if (!skipFocus) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentMode, timeLimit, difficulty, language, includePunctuation, includeNumbers]);

  // Focus input when clicking on container
  const handleContainerClick = () => {
    if (inputRef.current && !showResults) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard shortcuts (Tab+Shift to reset, Escape to reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field (unless it's our typing area)
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isOurTextarea = target === inputRef.current;
      
      // Tab + Shift: Reset test (works anywhere)
      if (e.key === 'Tab' && e.shiftKey && !showResults) {
        e.preventDefault();
        resetTest();
        return;
      }
      
      // Escape: Reset test (only when in our typing area or not in any input)
      if (e.key === 'Escape' && (isOurTextarea || !isInInput) && !showResults) {
        e.preventDefault();
        resetTest();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, resetTest]);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close dropdowns when typing starts
  useEffect(() => {
    if (isTyping) {
      setOpenCategory(null);
      setOpenSetting(null);
    }
  }, [isTyping]);

  // WPM history tracking effect (per second, always push a point)
  useEffect(() => {
    if (!isTyping) return;
    let tick = 1;
    const interval = setInterval(() => {
      if (!isTyping) return;
      if (!startTime) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMinutes = elapsed / 60;
      // Count only correct characters for WPM
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === currentText[i]) correctChars++;
      }
      // Cap WPM at 300 (world record is ~216 WPM, but allow some buffer for edge cases)
      const calculatedWpm = elapsedMinutes > 0 ? (correctChars / 5) / elapsedMinutes : 0;
      const wpm = Math.min(300, Math.max(0, Math.round(calculatedWpm)));
      setChartData(prev => {
        // Only add new point if it's different from the last one
        if (prev.length === 0 || prev[prev.length - 1].y !== wpm) {
          return [...prev, { x: tick, y: wpm, acc: 100 }];
        }
        return prev;
      });
      tick++;
    }, 1000);
    return () => clearInterval(interval);
  }, [isTyping, startTime, userInput, currentText]);

  // Add a handler to set the typing content from the content library
  const handleContentSelect = useCallback((content: string) => {
    setCurrentMode('custom');
    setCurrentText(content);
    setShowResults(false);
    setIsTyping(false);
    setUserInput('');
    setCurrentIndex(0);
    setErrors(0);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setWpmHistory([{ t: 0, wpm: 0 }]);
    setKeystrokeStats({ total: 0, correct: 0, incorrect: 0, extra: 0, keyCounts: {} });
    if (typingPauseTimeoutRef.current) clearTimeout(typingPauseTimeoutRef.current);
    setErrorTypes({ punctuation: 0, case: 0, number: 0, other: 0 });
    setConsistency(null);
    setChartData([{ x: 0, y: 0, acc: 100 }]);
    setTimeLeft(0);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Listen to content library selection changes
  useEffect(() => {
    if (contentLibraryState.selected && contentLibraryState.selected.content) {
      handleContentSelect(contentLibraryState.selected.content);
    }
  }, [contentLibraryState.selected, handleContentSelect]);

  // Scroll the text display to keep the current character in view
  useEffect(() => {
    if (!textDisplayRef.current) return;
    const caretEl = textDisplayRef.current.querySelector('.current-caret');
    if (caretEl && caretEl instanceof HTMLElement) {
      const container = textDisplayRef.current;
      const caretRect = caretEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (caretRect.bottom > containerRect.bottom) {
        container.scrollTop += caretRect.bottom - containerRect.bottom + 8;
      } else if (caretRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - caretRect.top + 8;
      }
    }
  }, [currentIndex]);

  // Render character with styling and smooth animations (unused - kept for reference)
  // Note: This function is not currently used, but kept for potential future use
  // If used, ensure layoutIds are unique per instance
  const renderCharacter = (char: string, index: number) => {
    let className = 'transition-all duration-150 ease-out inline-block ';
    
    if (index < userInput.length) {
      // Typed characters
      if (userInput[index] === char) {
        className += 'text-foreground transform scale-105'; // Correct - slight scale up
      } else {
        className += 'text-red-500 bg-red-100'; // Incorrect - red, no pulse
      }
    } else if (index === userInput.length) {
      // Current character (caret)
      return (
        <motion.span
          key={index}
          style={{ position: 'relative', display: 'inline-block' }}
          className="current-caret"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.06, ease: 'easeOut' }}
        >
          <motion.span
            className="bg-primary text-primary-foreground transform scale-110"
            layoutId={`caret-char-render-${currentMode}`}
            transition={{ duration: 0.06, ease: 'easeOut' }}
          >
            {char}
          </motion.span>
          <motion.span
            className="cursor-blink"
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              width: '2px',
              height: '100%',
              background: 'hsl(var(--primary))', // theme primary
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
            layoutId={`caret-bar-render-${currentMode}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.06, ease: 'easeOut' }}
          />
        </motion.span>
      );
    } else {
      // Untyped characters
      className += 'text-foreground/60';
    }
    
    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  };

  // Helper for summary
  const modeLabel = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
  const durationLabel = currentMode === 'time' ? `${timeLimit}s` : `${wordLimit} words`;
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  // Helper to detect Indian/complex-script languages
  const complexScriptLanguages = [
    'hindi', 'kannada', 'tamil', 'telugu', 'bengali', 'marathi', 'urdu', 'gujarati', 'malayalam', 'punjabi', 'odia', 'assamese', 'maithili', 'santali', 'nepali', 'sinhala'
  ];

  const { state: gamification, addXP, incrementStreak, resetStreak, addBadge, setGamificationEnabled } = useGamification();
  const gamificationEnabled = gamification.gamificationEnabled;
  const { refreshLeaderboard } = useLeaderboard();

  // Helper: get a random sample from an object of arrays
  function getRandom(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Update generateNewText to handle ALL modes
  const generateNewText = (mode, difficulty, language) => {
    // Check subcategory content first (has content for most special modes)
    if (contentBySubcategory[mode] && contentBySubcategory[mode][difficulty]) {
      return getRandom(contentBySubcategory[mode][difficulty]);
    }
    
    // Handle specific modes
    switch (mode) {
      case 'words':
      case 'time':
        return sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || 
               sampleTextsByLanguageAndDifficulty['english']?.[difficulty] || '';
      
      case 'quote':
        return getRandom(contentByCategory.quote[difficulty]) || 
               sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || '';
      
      case 'coding':
        return getRandom(contentByCategory.coding[difficulty]) || 
               getRandom(contentBySubcategory.coding[difficulty]) || '';
      
      case 'syntax':
        return getRandom(contentBySubcategory.syntax[difficulty]) || '';
      
      case 'essay':
        return getRandom(contentBySubcategory.essay[difficulty]) || '';
      
      case 'zen':
      case 'zenwriting':
        return getRandom(contentBySubcategory.zen[difficulty]) || 
               getRandom(contentBySubcategory.zenwriting[difficulty]) || '';
      
      case 'notimer':
        return getRandom(contentBySubcategory.notimer[difficulty]) || 
               sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || '';
      
      case 'softtheme':
        return getRandom(contentBySubcategory.softtheme[difficulty]) || 
               getRandom(contentBySubcategory.zen[difficulty]) || '';
      
      case 'hardwords':
        return getRandom(contentBySubcategory.hardwords[difficulty]) || '';
      
      case 'god':
        return getRandom(contentBySubcategory.god[difficulty]) || 
               sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || '';
      
      case 'foreign': {
        // Pick a random non-English language sample for the selected difficulty
        const langs = Object.keys(sampleTextsByLanguageAndDifficulty).filter(l => l !== 'english');
        const randomLang = langs[Math.floor(Math.random() * langs.length)];
        return sampleTextsByLanguageAndDifficulty[randomLang]?.[difficulty] || 
               sampleTextsByLanguageAndDifficulty['english']?.[difficulty] || '';
      }
      
      case 'custom':
        // Handled in handleModeChange via content library
        return '';
      
      default:
        // Fallback to language-based text
        return sampleTextsByLanguageAndDifficulty[language]?.[difficulty] || 
               sampleTextsByLanguageAndDifficulty['english']?.[difficulty] || 
               'Start typing to begin the test.';
    }
  };

  // Update handleModeChange to support all subcategories
  const handleModeChange = (newMode) => {
    if (newMode === 'custom') {
      openOverlay('content-library');
      return;
    }

    setCurrentMode(newMode);
    setShowResults(false);
    setIsTyping(false);
    setUserInput('');
    setCurrentIndex(0);
    setErrors(0);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setWpmHistory([{ t: 0, wpm: 0 }]);
    setKeystrokeStats({ total: 0, correct: 0, incorrect: 0, extra: 0, keyCounts: {} });
    setErrorTypes({ punctuation: 0, case: 0, number: 0, other: 0 });
    setConsistency(null);
    setChartData([{ x: 0, y: 0, acc: 100 }]);
    setGodModeIndex(0);
    if (typingPauseTimeoutRef.current) clearTimeout(typingPauseTimeoutRef.current);
    // Close duration dropdown if switching to a non-time mode
    if (newMode !== 'time' && openSetting === 'duration') {
      setOpenSetting(null);
    }
    const newText = generateNewText(newMode, difficulty, language);
    const modifiedText = modifyTextForOptions(newText, newMode);
    // For coding/syntax mode, preserve original formatting and force punctuation/numbers
    if (newMode === 'coding' || newMode === 'syntax') {
      // Force include punctuation and numbers for coding mode
      setIncludePunctuation(true);
      setIncludeNumbers(true);
      setCurrentText(modifiedText);
    } else {
      const normalizedText = modifiedText
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim()
        .replace(/\s+/g, ' ');
      setCurrentText(normalizedText);
    }
    setTimeLeft(newMode === 'time' ? timeLimit : 0);
  };

  // Replace the categories bar rendering with the following structure:
  // Main categories and their subcategories
  const mainCategories = [
    {
      heading: 'Developers',
      subcategories: [
        { label: 'Coding', value: 'coding', type: 'mode' },
        { label: 'Custom', value: 'custom', type: 'mode' },
        { label: 'Syntax Challenges', value: 'syntax', type: 'mode' },
      ],
    },
    {
      heading: 'Students',
      subcategories: [
        { label: 'Words', value: 'words', type: 'mode' },
        { label: 'Timed', value: 'time', type: 'mode' },
        { label: 'Essay Builder', value: 'essay', type: 'mode' },
      ],
    },
    {
      heading: 'Writers',
      subcategories: [
        { label: 'Quotes', value: 'quote', type: 'mode' },
        { label: 'Custom', value: 'custom', type: 'mode' },
        { label: 'Zen Writing', value: 'zen', type: 'mode' },
      ],
    },
    {
      heading: 'Mindfulness',
      subcategories: [
        { label: 'Zen', value: 'zen', type: 'mode' },
        { label: 'No Timer', value: 'notimer', type: 'mode' },
        { label: 'Soft Theme Mode', value: 'softtheme', type: 'mode' },
      ],
    },
    {
      heading: 'Challenge Seekers',
      subcategories: [
        { label: 'Timed', value: 'time', type: 'mode' },
        { label: 'Hard Words', value: 'hardwords', type: 'mode' },
        { label: 'Foreign Language Practice', value: 'foreign', type: 'mode' },
      ],
    },
  ];

  // Add state for open category
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const categoryBarRef = useRef<HTMLDivElement>(null);
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);

  // Calculate dropdown position based on button click
  const handleCategoryClick = (categoryName: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openCategory === categoryName) {
      setOpenCategory(null);
      setDropdownPosition(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2, // Center of button
      });
      setOpenCategory(categoryName);
    }
  };

  const [godModeIndex, setGodModeIndex] = useState(0);

  const { user } = useAuth();

  async function saveTestResultToSupabase({
    userId,
    wpm,
    accuracy,
    errors,
    time,
    consistency,
    keystrokeStats,
    errorTypes,
    wordCount,
    duration,
    timestamp,
  }) {
    const testResult = {
      user_id: userId,
      wpm,
      accuracy,
      errors,
      time,
      consistency,
      keystroke_stats: keystrokeStats,
      error_types: errorTypes,
      wordCount,
      duration,
      timestamp,
    };
    // Debug print to inspect what is being saved
    console.log('Saving test result:', testResult);
    const { error, data } = await supabase.from('test_results').insert([testResult]);
    if (error) {
      console.error('Supabase test_results insert error:', error);
    } else {
      console.log('Supabase test_results insert success:', data);
      
      // Update leaderboard after successfully saving test result
      await updateLeaderboard(userId, wpm);
    }
  }

  // Function to update leaderboard for all timeframes
  async function updateLeaderboard(userId: string, wpm: number) {
    try {
      // Get user email and XP
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || null;
      
      // Get user's current XP from gamification
      const { data: gamificationData } = await supabase
        .from('user_gamification')
        .select('xp')
        .eq('user_id', userId)
        .maybeSingle();
      
      const xp = gamificationData?.xp || 0;
      
      // Update leaderboard for 'all' timeframe (always update best WPM)
      // First, check if entry exists and get current WPM
      const { data: existingAll } = await supabase
        .from('leaderboard')
        .select('wpm')
        .eq('user_id', userId)
        .eq('timeframe', 'all')
        .maybeSingle();
      
      const bestWpm = existingAll?.wpm ? Math.max(existingAll.wpm, wpm) : wpm;
      
      const { error: allError } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: userId,
          email: userEmail,
          wpm: bestWpm,
          xp: xp,
          timeframe: 'all',
        }, {
          onConflict: 'user_id,timeframe',
        });
      
      if (allError) {
        console.error('Error updating leaderboard (all):', allError);
      }
      
      // Update weekly leaderboard (always update - timeframe filtering is handled by the leaderboard query)
      const { data: existingWeekly } = await supabase
        .from('leaderboard')
        .select('wpm')
        .eq('user_id', userId)
        .eq('timeframe', 'weekly')
        .maybeSingle();
      
      if (true) { // Always update weekly leaderboard
        
        const bestWeeklyWpm = existingWeekly?.wpm ? Math.max(existingWeekly.wpm, wpm) : wpm;
        
        const { error: weeklyError } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: userId,
            email: userEmail,
            wpm: bestWeeklyWpm,
            xp: xp,
            timeframe: 'weekly',
          }, {
            onConflict: 'user_id,timeframe',
          });
        
        if (weeklyError) {
          console.error('Error updating leaderboard (weekly):', weeklyError);
        }
      }
      
      // Update monthly leaderboard (always update - timeframe filtering is handled by the leaderboard query)
      const { data: existingMonthly } = await supabase
        .from('leaderboard')
        .select('wpm')
        .eq('user_id', userId)
        .eq('timeframe', 'monthly')
        .maybeSingle();
      
      if (true) { // Always update monthly leaderboard
        
        const bestMonthlyWpm = existingMonthly?.wpm ? Math.max(existingMonthly.wpm, wpm) : wpm;
        
        const { error: monthlyError } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: userId,
            email: userEmail,
            wpm: bestMonthlyWpm,
            xp: xp,
            timeframe: 'monthly',
          }, {
            onConflict: 'user_id,timeframe',
          });
        
        if (monthlyError) {
          console.error('Error updating leaderboard (monthly):', monthlyError);
        }
      }
      
      // Update yearly leaderboard (always update - timeframe filtering is handled by the leaderboard query)
      const { data: existingYearly } = await supabase
        .from('leaderboard')
        .select('wpm')
        .eq('user_id', userId)
        .eq('timeframe', 'yearly')
        .maybeSingle();
      
      if (true) { // Always update yearly leaderboard
        
        const bestYearlyWpm = existingYearly?.wpm ? Math.max(existingYearly.wpm, wpm) : wpm;
        
        const { error: yearlyError } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: userId,
            email: userEmail,
            wpm: bestYearlyWpm,
            xp: xp,
            timeframe: 'yearly',
          }, {
            onConflict: 'user_id,timeframe',
          });
        
        if (yearlyError) {
          console.error('Error updating leaderboard (yearly):', yearlyError);
        }
      }
      
      // Refresh leaderboard in the UI
      if (refreshLeaderboard) {
        await refreshLeaderboard();
      }
    } catch (err) {
      console.error('Error updating leaderboard:', err);
    }
  };

  if (showResults) {
    return (
      <ResultScreen
        wpm={wpm}
        accuracy={accuracy}
        errors={errors}
        time={currentMode === 'time' ? timeLimit - timeLeft : Math.floor((Date.now() - (startTime || 0)) / 1000)}
        onRetry={() => resetTest()}
        keystrokeStats={keystrokeStats}
        errorTypes={errorTypes}
        timeGraphData={chartData}
        consistency={consistency}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar - Hides when typing */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
      <Navbar />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full pt-4 sm:pt-20 pb-8 px-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Category Bar - Desktop Only - Hides when typing */}
        <AnimatePresence>
          {!isTyping && (
          <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="hidden sm:flex w-full justify-center px-4 sm:px-6 mb-6"
              style={{ position: 'relative', zIndex: 10 }}
              ref={categoryBarRef}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm overflow-x-auto scrollbar-hide">
                {mainCategories.map((cat) => {
                  const isActive = openCategory === cat.heading;
                  const hasActiveSub = cat.subcategories.some(sub => currentMode === sub.value);
                  return (
                    <button
                      key={cat.heading}
                      onClick={(e) => handleCategoryClick(cat.heading, e)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive || hasActiveSub
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {cat.heading}
                    </button>
                  );
                })}
                {/* Duration Category */}
                {currentMode === 'time' && (
                  <button
                    onClick={(e) => handleCategoryClick('Duration', e)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      openCategory === 'Duration'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    Duration
                  </button>
                )}
                {/* Difficulty Category */}
                <button
                  onClick={(e) => handleCategoryClick('Difficulty', e)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    openCategory === 'Difficulty'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Difficulty
                </button>
                {/* Punctuation Toggle - Disabled for coding/syntax mode */}
                <button
                  onClick={() => {
                    if (currentMode !== 'coding' && currentMode !== 'syntax') {
                      setIncludePunctuation(!includePunctuation);
                      resetTest();
                    }
                  }}
                  disabled={currentMode === 'coding' || currentMode === 'syntax'}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    currentMode === 'coding' || currentMode === 'syntax'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    includePunctuation
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                  }`}
                  title={currentMode === 'coding' || currentMode === 'syntax' ? 'Punctuation is always included in coding mode' : ''}
                >
                  @ punctuation
                </button>
                {/* Numbers Toggle - Disabled for coding/syntax mode */}
                <button
                  onClick={() => {
                    if (currentMode !== 'coding' && currentMode !== 'syntax') {
                      setIncludeNumbers(!includeNumbers);
                      resetTest();
                    }
                  }}
                  disabled={currentMode === 'coding' || currentMode === 'syntax'}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    currentMode === 'coding' || currentMode === 'syntax'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    includeNumbers
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                  }`}
                  title={currentMode === 'coding' || currentMode === 'syntax' ? 'Numbers are always included in coding mode' : ''}
                >
                  # numbers
                </button>
              </div>
              {/* Category Dropdown - Using portal-like fixed positioning */}
              <AnimatePresence>
                {openCategory && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        setOpenCategory(null);
                        setDropdownPosition(null);
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="fixed z-50 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-xl p-4 min-w-[200px]"
                      style={
                        dropdownPosition
                          ? {
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                              transform: 'translateX(-50%)',
                            }
                          : { display: 'none' }
                      }
                    >
                      {(() => {
                        const selectedCat = mainCategories.find(c => c.heading === openCategory);
                        if (selectedCat) {
                          return (
                            <div className="flex flex-col gap-2">
                              {selectedCat.subcategories.map((sub) => (
                                <button
                                  key={sub.value}
                                  onClick={() => {
                                    handleModeChange(sub.value);
                                    setOpenCategory(null);
                                    setDropdownPosition(null);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm transition-colors text-left ${
                                    currentMode === sub.value
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                                  }`}
                                >
                                  {sub.label}
                                </button>
                              ))}
                            </div>
                          );
                        } else if (openCategory === 'Duration') {
                          return (
                            <div className="flex flex-col gap-2">
                              {[15, 30, 60, 120].map((sec) => (
                                <button
                                  key={sec}
                                  onClick={() => {
                                    setTimeLimit(sec);
                                    resetTest(sec);
                                    setOpenCategory(null);
                                    setDropdownPosition(null);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm transition-colors text-left ${
                                    timeLimit === sec
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                                  }`}
                                >
                                  {sec}s
                                </button>
                              ))}
                            </div>
                          );
                        } else if (openCategory === 'Difficulty') {
                          return (
                            <div className="flex flex-col gap-2">
                              {[
                                { label: 'Easy', value: 'short' },
                                { label: 'Classic', value: 'medium' },
                                { label: 'Epic', value: 'long' },
                                { label: 'Ultra', value: 'thicc' },
                              ].map((item) => (
                                <button
                                  key={item.value}
                                  onClick={() => {
                                    setDifficulty(item.value);
                                    resetTest();
                                    setOpenCategory(null);
                                    setDropdownPosition(null);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm transition-colors text-left ${
                                    difficulty === item.value
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: Clean Settings Button - Hides when typing */}
        <AnimatePresence>
          {!isTyping && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden w-full flex justify-center px-4 sm:px-6 mb-8"
              style={{ position: 'relative', zIndex: 10 }}
            >
              <div className="w-full max-w-md mx-auto">
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 text-foreground hover:bg-card/80 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {(() => {
                        const modeLabels: Record<string, string> = {
                          'time': 'Timed',
                          'words': 'Words',
                          'quote': 'Quotes',
                          'zen': 'Zen',
                          'coding': 'Coding',
                          'custom': 'Custom',
                          'syntax': 'Syntax',
                          'essay': 'Essay',
                          'notimer': 'No Timer',
                          'softtheme': 'Soft Theme',
                          'hardwords': 'Hard Words',
                          'foreign': 'Foreign',
                        };
                        return modeLabels[currentMode] || 'Settings';
                      })()}
                    </span>
                    {currentMode === 'time' && (
                      <span className="text-xs text-muted-foreground">• {timeLimit}s</span>
                    )}
                    {currentMode === 'words' && (
                      <span className="text-xs text-muted-foreground">• {wordLimit} words</span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Settings Drawer - Premium & Modern */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed bg-black/50 z-[60] sm:hidden"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, margin: 0, padding: 0 }}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 w-full max-w-sm bg-background border-l border-border z-[70] sm:hidden flex flex-col shadow-lg"
                style={{ 
                  top: 0, 
                  left: 'auto', 
                  bottom: 0, 
                  height: '100dvh',
                  minHeight: '100vh',
                  zIndex: 70, 
                  margin: 0, 
                  padding: 0,
                  paddingTop: 0,
                  marginTop: 0
                }}
              >
                {/* Header - Clean & Simple */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <h2 className="text-base font-medium text-foreground">Settings</h2>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-card/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content - Clean Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {[
              {
                heading: 'Developers',
                sub: [
                  { label: 'Coding', value: 'coding', type: 'mode' },
                  { label: 'Custom', value: 'custom', type: 'mode' },
                  { label: 'Syntax Challenges', value: 'syntax', type: 'mode' },
                ],
              },
              {
                heading: 'Students',
                sub: [
                  { label: 'Words', value: 'words', type: 'mode' },
                  { label: 'Timed', value: 'time', type: 'mode' },
                  { label: 'Essay Builder', value: 'essay', type: 'mode' },
                ],
              },
              {
                heading: 'Writers',
                sub: [
                  { label: 'Quotes', value: 'quote', type: 'mode' },
                  { label: 'Custom', value: 'custom', type: 'mode' },
                  { label: 'Zen Writing', value: 'zen', type: 'mode' },
                ],
              },
              {
                heading: 'Mindfulness',
                sub: [
                  { label: 'Zen', value: 'zen', type: 'mode' },
                  { label: 'No Timer', value: 'notimer', type: 'mode' },
                  { label: 'Soft Theme Mode', value: 'softtheme', type: 'mode' },
                ],
              },
              {
                heading: 'Challenge Seekers',
                sub: [
                  { label: 'Timed', value: 'time', type: 'mode' },
                  { label: 'Hard Words', value: 'hardwords', type: 'mode' },
                  { label: 'Foreign Language Practice', value: 'foreign', type: 'mode' },
                ],
              },
                  ].map((cat) => {
                    const isExpanded = mobileExpandedCategory === cat.heading;
                    const hasActive = cat.sub.some(item => {
                      if (item.type === 'mode') return currentMode === item.value;
                      if (item.type === 'duration') return timeLimit === Number(item.value);
                      if (item.type === 'difficulty') return difficulty === String(item.value);
                      return false;
                    });
              return (
                      <div key={cat.heading} className="rounded-lg overflow-hidden bg-card/50 border border-border/50">
                  <button
                          onClick={() => setMobileExpandedCategory(isExpanded ? null : cat.heading)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                            hasActive ? 'bg-card' : 'hover:bg-card/70'
                          }`}
                        >
                          <span className={`text-sm font-medium ${hasActive ? 'text-primary' : 'text-foreground'}`}>
                    {cat.heading}
                          </span>
                          <svg
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                  </button>
                        {isExpanded && (
                          <div className="px-2 py-2 space-y-1 bg-card/30">
                      {cat.sub.map((item) => {
                              let isActive = false;
                              if (item.type === 'mode') {
                                isActive = currentMode === item.value;
                              } else if (item.type === 'duration') {
                                isActive = timeLimit === Number(item.value);
                              } else if (item.type === 'difficulty') {
                                isActive = difficulty === String(item.value);
                              }
                        return (
                          <button
                            key={item.value}
                                  type="button"
                                  tabIndex={-1}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Blur FIRST to prevent keyboard from showing
                                    if (document.activeElement instanceof HTMLElement) {
                                      document.activeElement.blur();
                                    }
                                    // Also blur any input elements
                                    const inputs = document.querySelectorAll('input, textarea');
                                    inputs.forEach(input => {
                                      if (input instanceof HTMLElement) {
                                        input.blur();
                                      }
                                    });
                                    if (item.type === 'mode') {
                                      handleModeChange(String(item.value));
                                      setMobileExpandedCategory(null);
                                      if (item.value !== 'time') {
                                        setMobileDrawerOpen(false);
                                      }
                                    } else if (item.type === 'duration') {
                                      // Blur ALL inputs first to prevent keyboard
                                      const inputs = document.querySelectorAll('input, textarea');
                                      inputs.forEach(input => {
                                        if (input instanceof HTMLElement) {
                                          input.blur();
                                        }
                                      });
                                      // Prevent input from focusing
                                      if (inputRef.current) {
                                        inputRef.current.blur();
                                      }
                                      setTimeLimit(Number(item.value));
                                      setMobileExpandedCategory(null);
                                      setMobileDrawerOpen(false);
                                      // Reset test but skip focus to prevent keyboard
                                      setTimeout(() => {
                                        resetTest(Number(item.value), true);
                                        // Blur again after reset to be safe
                                        if (inputRef.current) {
                                          inputRef.current.blur();
                                        }
                                      }, 200);
                                    } else if (item.type === 'difficulty') {
                                      setDifficulty(String(item.value));
                                      resetTest();
                                      setMobileExpandedCategory(null);
                                      setMobileDrawerOpen(false);
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                    isActive
                                      ? 'bg-primary text-primary-foreground font-medium'
                                      : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
                                  }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                      </div>
              );
            })}

                  {/* Duration - Only for time mode */}
                  {currentMode === 'time' && (
                    <div className="rounded-lg overflow-hidden bg-card/50 border border-border/50">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-foreground mb-3">Duration</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {[15, 30, 60, 120].map((sec) => (
              <button
                              key={sec}
                              onClick={() => {
                                setTimeLimit(Number(sec));
                                resetTest(Number(sec));
                              }}
                              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                timeLimit === sec
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              {sec}s
              </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Punctuation & Numbers Toggles - Disabled for coding/syntax mode */}
                  {(currentMode !== 'coding' && currentMode !== 'syntax') && (
                    <div className="rounded-lg overflow-hidden bg-card/50 border border-border/50">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-foreground mb-3">Options</h3>
                        <div className="flex flex-col gap-2">
                <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIncludePunctuation(!includePunctuation);
                              resetTest();
                              setMobileDrawerOpen(false);
                              // Blur to prevent keyboard from showing
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                              }
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              includePunctuation
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <span>@</span>
                            <span>punctuation</span>
                </button>
              <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIncludeNumbers(!includeNumbers);
                              resetTest();
                              setMobileDrawerOpen(false);
                              // Blur to prevent keyboard from showing
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                              }
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              includeNumbers
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <span>#</span>
                            <span>numbers</span>
              </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Difficulty */}
                  <div className="rounded-lg overflow-hidden bg-card/50 border border-border/50">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-foreground mb-3">Difficulty</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                { label: 'Easy', value: 'short' },
                { label: 'Classic', value: 'medium' },
                { label: 'Epic', value: 'long' },
                { label: 'Ultra', value: 'thicc' },
                        ].map((item) => (
                <button
                  key={item.value}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDifficulty(String(item.value));
                              resetTest();
                              setMobileDrawerOpen(false);
                              // Blur to prevent keyboard from showing
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                              }
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              difficulty === String(item.value)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted'
                            }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
        </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Timer Display - Minimal & Clean */}
        {currentMode === 'time' && (
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center mb-4"
              >
            <span
                  className="text-5xl font-bold text-primary transition-all duration-300"
                  style={{ letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}
            >
            {timeLeft}
            </span>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Typing Area - Wide & Clean */}
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 flex flex-col items-center justify-center" style={{ maxWidth: '1600px' }}>
          {/* Language Selector - Minimal - Hides when typing */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center mb-8"
              >
            <button
                  className="flex items-center gap-2 text-foreground/60 hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-full bg-card/30 hover:bg-card/50 border border-border/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={() => setLangModalOpen(true)}
              tabIndex={0}
              style={{ userSelect: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0c2.21 0 4 4.03 4 9s-1.79 9-4 9-4-4.03-4-9 1.79-9 4-9z" /></svg>
              <span className="lowercase text-xs">{[...globalLanguages, ...indianLanguages].find(l => l.value === language)?.label || language}</span>
            </button>
              </motion.div>
            )}
          </AnimatePresence>
          {langModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLangModalOpen(false)}>
              <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-0 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center px-5 py-4 border-b border-border">
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-muted-foreground mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0c2.21 0 4 4.03 4 9s-1.79 9-4 9-4-4.03-4-9 1.79-9 4-9z' /></svg>
                  <input
                    type="text"
                    placeholder="Language..."
                    className="flex-1 bg-transparent outline-none text-foreground text-base font-mono placeholder-muted-foreground"
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                  />
                  <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setLangModalOpen(false)} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto py-2 px-0 scrollbar-hide" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
                  {/* Global languages */}
                  {globalLanguages.filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase())).map(l => (
                    <button
                      key={l.value}
                      className={`w-full text-left px-5 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 focus:bg-muted/50 transition-all duration-150 lowercase rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${language === l.value ? 'font-semibold text-primary bg-muted/70' : ''}`}
                      onClick={() => { setLanguage(l.value); setCurrentMode('words'); setLangModalOpen(false); setShowIndian(false); setLangSearch(""); }}
                      tabIndex={0}
                    >
                      {l.label}
                    </button>
                  ))}
                  {/* Divider for Indian languages */}
                  <div className="px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">Indian Languages</div>
                  {indianLanguages.filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase())).map(l => (
                    <button
                      key={l.value}
                      className={`w-full text-left px-5 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 focus:bg-muted/50 transition-all duration-150 lowercase rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${language === l.value ? 'font-semibold text-primary bg-muted/70' : ''}`}
                      onClick={() => { setLanguage(l.value); setCurrentMode('words'); setLangModalOpen(false); setShowIndian(false); setLangSearch(""); }}
                      tabIndex={0}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div 
            ref={containerRef}
            onClick={handleContainerClick}
            className="mb-6 relative cursor-text w-full"
            style={{ maxWidth: '100%', width: '100%' }}
          >
            {/* Text Display */}
            <div
              ref={textDisplayRef}
              className="w-full"
              style={{
                position: 'relative',
              }}
            >
              <TypingArea currentText={currentText} userInput={userInput} currentIndex={currentIndex} mode={currentMode} godModeIndex={godModeIndex} />
            </div>
            {/* Overlayed Transparent Textarea for Input */}
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              onKeyDown={(e) => {
                // Prevent backspace from going back in browser history
                if (e.key === 'Backspace' && userInput.length === 0) {
                  e.preventDefault();
                }
              }}
              className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-transparent outline-none resize-none border-none p-0 m-0"
              style={{ 
                zIndex: 5, 
                height: 'calc(2.5rem * 1.9 * 3 + 40px)', // Match typing area height (updated for larger font)
                color: 'transparent', 
                background: 'transparent', 
                overflow: 'hidden', 
                caretColor: 'transparent',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                lineHeight: '1.9',
                padding: '20px',
                whiteSpace: 'normal',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
              }}
              placeholder=""
              disabled={showResults}
              inputMode="text"
              aria-label="Typing input"
              tabIndex={0}
              rows={1}
            />
          </div>
          {/* Stats Display - Clean & Modern - Shows during typing */}
          {!showResults && (
            <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 w-full mx-auto flex-wrap px-4 mt-6 mb-4 sm:mb-6 pb-safe">
            <div className="text-center min-w-[70px] px-2 py-1.5">
              <div className="text-xl sm:text-2xl font-mono font-bold text-primary leading-tight">
                {typeof accuracy === 'number' && !isNaN(accuracy) ? Math.max(0, Math.min(100, accuracy)) : 100}%
            </div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Accuracy</div>
            </div>
            <div className="text-center min-w-[70px] px-2 py-1.5">
              <div className="text-xl sm:text-2xl font-mono font-bold text-red-400 leading-tight">
                {typeof errors === 'number' && !isNaN(errors) ? errors : 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Errors</div>
                  </div>
            {gamificationEnabled && gamification && (
              <div className="text-center min-w-[70px] px-2 py-1.5">
                <div className="text-xl sm:text-2xl font-mono font-bold text-primary leading-tight">
                  {gamification.streak && typeof gamification.streak === 'number' ? gamification.streak : 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Streak</div>
              </div>
            )}
            {gamificationEnabled && gamification && (
              <div className="text-center min-w-[70px] px-2 py-1.5">
                <div className="text-xl sm:text-2xl font-mono font-bold text-primary leading-tight">
                  {gamification.xp && typeof gamification.xp === 'number' ? gamification.xp : 0}
          </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">XP</div>
              </div>
            )}
          </div>
          )}
          {/* Reset Button - Clean & Minimal */}
          {!isTyping && (
          <div className="mt-6 flex justify-center w-full">
            <button
              onClick={() => resetTest()}
              disabled={showResults}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-card/50 rounded-lg border border-border/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Reset typing test"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Test</span>
              <span className="text-xs text-muted-foreground ml-1">(Tab + Shift)</span>
            </button>
          </div>
          )}
        </div>
      </div>
      {/* Footer - Hides when typing */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
      <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;