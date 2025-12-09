import React, { useState, useRef, useEffect } from 'react';
import '../App.css';

const sampleText = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.";

function calculateWPM(chars: number, seconds: number) {
  if (seconds === 0) return 0;
  return Math.round((chars / 5) / (seconds / 60));
}

function calculateAccuracy(correct: number, total: number) {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

export default function Widget() {
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTyping && startTime && userInput !== sampleText) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTyping, startTime, userInput]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
      setIsTyping(true);
    }
    if (userInput === sampleText) {
      setIsTyping(false);
    }
  }, [userInput, startTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (userInput === sampleText) return;
    setUserInput(value);
    setCurrentIndex(value.length);
    // Count errors
    let err = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== sampleText[i]) err++;
    }
    setErrors(err);
  };

  const renderCharacter = (char: string, index: number) => {
    let className = 'transition-all duration-150 ease-out inline-block ';
    if (index < userInput.length) {
      if (userInput[index] === char) {
        className += 'text-slate-200 transform scale-105';
      } else {
        className += 'text-red-400 transform scale-110';
      }
    } else if (index === currentIndex) {
      return (
        <span key={index} style={{ position: 'relative', display: 'inline-block' }}>
          <span className="bg-primary text-slate-900 transform scale-110">{char === ' ' ? '\u00A0' : char}</span>
          <span
            className="cursor-blink"
            style={{
              position: 'absolute',
              left: '100%', top: 0,
              width: '2px',
              height: '100%',
              background: 'hsl(var(--primary))',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          />
        </span>
      );
    } else {
      className += 'text-slate-400';
    }
    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  };

  // Analytics (live)
  const timeElapsed = timer;
  const charsTyped = userInput.length;
  const wpm = calculateWPM(charsTyped, timeElapsed);
  const accuracy = calculateAccuracy(charsTyped - errors, charsTyped);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background" style={{ minHeight: 320, minWidth: 320 }}>
      <div className="w-full max-w-xl mx-auto p-4 rounded-xl shadow border border-border bg-card">
        <h2 className="text-xl font-bold text-foreground mb-4 text-center">Typing Test</h2>
        <div className="mb-4 text-lg font-mono bg-muted rounded p-4 min-h-[64px] text-foreground" style={{ wordBreak: 'break-word' }}>
          {sampleText.split('').map((char, index) => renderCharacter(char, index))}
        </div>
        <input
          ref={inputRef}
          className="w-full border border-border bg-muted text-foreground rounded p-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Start typing..."
          autoFocus
          disabled={userInput === sampleText}
        />
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-base font-medium text-foreground bg-muted border border-border rounded-lg p-3">
          <div><span className="text-primary">WPM:</span> {isNaN(wpm) || !isFinite(wpm) ? 0 : wpm}</div>
          <div><span className="text-primary">Accuracy:</span> {isNaN(accuracy) || !isFinite(accuracy) ? 100 : accuracy}%</div>
          <div><span className="text-primary">Time:</span> {timeElapsed}s</div>
          <div><span className="text-primary">Errors:</span> {errors}</div>
        </div>
      </div>
    </div>
  );
} 