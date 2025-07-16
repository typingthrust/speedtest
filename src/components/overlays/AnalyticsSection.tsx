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
    <section className="w-full min-h-[40vh] bg-[#181B23] flex flex-col items-center px-2 sm:px-8 py-8 gap-8">
      <header className="w-full max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">All-Time Analytics</h1>
        <p className="text-lg text-gray-400">Your complete typing journey. Stats and insights across all your tests.</p>
      </header>
      {/* Stats Cards */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-blue-400">{wpm}</div>
          <div className="text-xs text-gray-400 mt-1">WPM</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-green-400">{accuracy}%</div>
          <div className="text-xs text-gray-400 mt-1">Accuracy</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-yellow-400">{testsTaken}</div>
          <div className="text-xs text-gray-400 mt-1">Tests</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-purple-400">{testsStarted}</div>
          <div className="text-xs text-gray-400 mt-1">Tests Started</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-pink-400">{testsCompleted}</div>
          <div className="text-xs text-gray-400 mt-1">Tests Completed</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center shadow-xl border border-white/10">
          <div className="text-3xl font-mono font-bold text-cyan-400">{timeTyping}s</div>
          <div className="text-xs text-gray-400 mt-1">Time Typing</div>
        </div>
      </div>
      {/* Analytics Breakdown (mock for now) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-2">
          <div className="text-lg font-bold text-white mb-2">WPM Trend</div>
          <div className="h-24 flex items-center justify-center text-gray-400">(WPM chart here)</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-2">
          <div className="text-lg font-bold text-white mb-2">Accuracy Trend</div>
          <div className="h-24 flex items-center justify-center text-gray-400">(Accuracy chart here)</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-2">
          <div className="text-lg font-bold text-white mb-2">Most Active Day</div>
          <div className="h-12 flex items-center justify-center text-gray-400">(Most active day here)</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-2">
          <div className="text-lg font-bold text-white mb-2">Typing Streak</div>
          <div className="h-12 flex items-center justify-center text-gray-400">(Typing streak here)</div>
        </div>
      </div>
    </section>
  );
} 