import { usePersonalization } from '../PersonalizationProvider';
import React from 'react';

interface Stats {
  wpm?: number;
  accuracy?: number;
  history?: any[];
  timeTyping?: number;
  testsStarted?: number;
  testsCompleted?: number;
  level?: number;
  progress?: number;
}

export function PerTestAnalyticsSection({ currentTestData, heading, subheading }: { currentTestData: any; heading: string; subheading: string }) {
  const wpm = currentTestData?.wpm || 0;
  const accuracy = currentTestData?.accuracy || 0;
  const errors = currentTestData?.errors || 0;
  const time = currentTestData?.time || 0;

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800 rounded-xl shadow border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-slate-100 mb-1">{heading}</h2>
      <p className="text-sm text-slate-400 mb-6">{subheading}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{wpm}</div>
          <div className="text-xs text-slate-400 mt-1">WPM</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{accuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">Accuracy</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{errors}</div>
          <div className="text-xs text-slate-400 mt-1">Errors</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-100">{time}s</div>
          <div className="text-xs text-slate-400 mt-1">Time</div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsSection() {
  const { state } = usePersonalization();
  const stats = (state.stats || {}) as Stats;
  const wpm = stats.wpm ?? 0;
  const accuracy = stats.accuracy ?? 100;
  const testsTaken = stats.history?.length ?? 0;
  const timeTyping = stats.timeTyping ?? 0;
  const testsStarted = stats.testsStarted ?? 0;
  const testsCompleted = stats.testsCompleted ?? 0;
  const level = stats.level ?? 1;
  const progress = stats.progress ?? 0;

  return (
    <section className="w-full min-h-[40vh] bg-slate-900 flex flex-col items-center px-2 sm:px-8 py-8 gap-8">
      <header className="w-full max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-2">All-Time Analytics</h1>
        <p className="text-lg text-slate-400">Your complete typing journey. Stats and insights across all your tests.</p>
      </header>
      {/* Stats Cards */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{wpm}</div>
          <div className="text-xs text-slate-400 mt-1">WPM</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{accuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">Accuracy</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{testsTaken}</div>
          <div className="text-xs text-slate-400 mt-1">Tests</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{testsStarted}</div>
          <div className="text-xs text-slate-400 mt-1">Tests Started</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{testsCompleted}</div>
          <div className="text-xs text-slate-400 mt-1">Tests Completed</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-700">
          <div className="text-3xl font-mono font-bold text-primary">{timeTyping}s</div>
          <div className="text-xs text-slate-400 mt-1">Time Typing</div>
        </div>
      </div>
      {/* Analytics Breakdown (mock for now) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col gap-2">
          <div className="text-lg font-bold text-slate-100 mb-2">WPM Trend</div>
          <div className="h-24 flex items-center justify-center text-slate-400">(WPM chart here)</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col gap-2">
          <div className="text-lg font-bold text-slate-100 mb-2">Accuracy Trend</div>
          <div className="h-24 flex items-center justify-center text-slate-400">(Accuracy chart here)</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col gap-2">
          <div className="text-lg font-bold text-slate-100 mb-2">Most Active Day</div>
          <div className="h-12 flex items-center justify-center text-slate-400">(Most active day here)</div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col gap-2">
          <div className="text-lg font-bold text-slate-100 mb-2">Typing Streak</div>
          <div className="h-12 flex items-center justify-center text-slate-400">(Typing streak here)</div>
        </div>
      </div>
    </section>
  );
} 