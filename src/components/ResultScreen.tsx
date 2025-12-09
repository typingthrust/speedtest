import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { RotateCcw, Copy, TrendingUp, Target, Clock, Zap, Hash, AlertCircle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface ResultScreenProps {
  wpm: number;
  accuracy: number;
  errors: number;
  time: number;
  onRetry: () => void;
  keystrokeStats?: { total: number; correct: number; incorrect: number; extra: number; keyCounts?: Record<string, number> };
  errorTypes?: Record<string, number>;
  timeGraphData?: Array<{ x: number; y: number; acc?: number }>;
  consistency?: number | null;
}

// Performance rating based on WPM and accuracy
function getPerformanceRating(wpm: number, accuracy: number): { grade: string; label: string; color: string } {
  const score = (wpm * 0.6) + (accuracy * 0.4);
  if (score >= 90) return { grade: 'S', label: 'Exceptional', color: 'text-emerald-400' };
  if (score >= 75) return { grade: 'A', label: 'Excellent', color: 'text-primary' };
  if (score >= 60) return { grade: 'B', label: 'Good', color: 'text-blue-400' };
  if (score >= 45) return { grade: 'C', label: 'Average', color: 'text-amber-400' };
  if (score >= 30) return { grade: 'D', label: 'Needs Work', color: 'text-orange-400' };
  return { grade: 'F', label: 'Keep Practicing', color: 'text-red-400' };
}

// Circular progress component
const CircularProgress: React.FC<{ value: number; max: number; size?: number; label: string; color: string }> = ({ 
  value, max, size = 120, label, color 
}) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={color}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-100">{value}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
};

// Stat card component
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue?: string; highlight?: boolean }> = ({
  icon, label, value, subValue, highlight
}) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-slate-800/50'}`}>
    <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'}`}>
      {icon}
    </div>
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-primary' : 'text-slate-200'}`}>
        {value}
        {subValue && <span className="text-sm text-slate-500 ml-1">{subValue}</span>}
      </div>
    </div>
  </div>
);

const ResultScreen: React.FC<ResultScreenProps> = ({
  wpm,
  accuracy,
  errors,
  time,
  onRetry,
  keystrokeStats,
  errorTypes,
  timeGraphData,
  consistency,
}) => {
  const [copied, setCopied] = useState(false);

  // Calculate metrics
  // Use the wpm prop directly as it's already calculated correctly with correctChars
  // Only recalculate if keystrokeStats is available and different from prop
  const rawWpm = useMemo(() => {
    // Use wpm prop directly - it's already calculated correctly
    // Cap WPM at 300 (world record is ~216 WPM, but allow some buffer for edge cases)
    if (wpm > 0 && wpm <= 300) {
      return wpm;
    }
    // Fallback: calculate from keystrokeStats using CORRECT characters only
    if (keystrokeStats && time > 0 && keystrokeStats.correct !== undefined) {
      const calculatedWpm = (keystrokeStats.correct / 5) / (time / 60);
      return Math.min(300, Math.max(0, Math.round(calculatedWpm)));
    }
    return 0;
  }, [keystrokeStats, time, wpm]);

  const consistencyValue = useMemo(() => {
    if (consistency !== null && consistency !== undefined) return consistency;
    if (timeGraphData && timeGraphData.length >= 2) {
      const wpmValues = timeGraphData.map(p => p.y).filter(v => !isNaN(v) && isFinite(v));
      if (wpmValues.length >= 2) {
        const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
        const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
        const stddev = Math.sqrt(variance);
        if (mean === 0) return 0;
        if (stddev === 0) return 100;
        return Math.max(0, Math.min(100, Math.round((1 - stddev / mean) * 100)));
      }
    }
    return null;
  }, [consistency, timeGraphData]);

  const charsBreakdown = useMemo(() => {
    if (keystrokeStats) {
      return {
        correct: keystrokeStats.correct || 0,
        incorrect: keystrokeStats.incorrect || 0,
        extra: keystrokeStats.extra || 0,
        total: keystrokeStats.total || 0,
      };
    }
    return { correct: 0, incorrect: errors, extra: 0, total: 0 };
  }, [keystrokeStats, errors]);

  const performance = getPerformanceRating(wpm, accuracy);
  const isLowAccuracy = accuracy < 60;

  // Chart configuration
  const chartData = useMemo(() => {
    if (!timeGraphData || timeGraphData.length < 2) return null;
    return {
      labels: timeGraphData.map(d => d.x),
      datasets: [
        {
          label: 'WPM',
          data: timeGraphData.map(d => d.y),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  }, [timeGraphData]);

  const chartOptions = useMemo(() => {
    const allY = timeGraphData?.map(d => d.y).filter(v => !isNaN(v) && isFinite(v)) || [];
    const maxY = allY.length > 0 ? Math.ceil(Math.max(...allY) * 1.2) : 100;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1 } },
      scales: {
        x: { display: true, grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 8 }, border: { display: false } },
        y: { display: true, grid: { color: 'rgba(100, 116, 139, 0.1)' }, ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 5 }, border: { display: false }, min: 0, max: maxY },
      },
      interaction: { intersect: false, mode: 'index' as const },
      animation: { duration: 800, easing: 'easeOutQuart' as const },
    };
  }, [timeGraphData]);

  // Copy result
  const handleCopy = () => {
    const text = `TypingThrust Result\n━━━━━━━━━━━━━━━━━━━\nWPM: ${wpm} | Accuracy: ${accuracy}%\nRaw: ${rawWpm} | Errors: ${errors}\nTime: ${time}s | Grade: ${performance.grade}\n━━━━━━━━━━━━━━━━━━━\ntypingthrust.com`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Top error keys
  const topErrorKeys = useMemo(() => {
    if (!keystrokeStats?.keyCounts) return [];
    return Object.entries(keystrokeStats.keyCounts)
      .filter(([k]) => k && k.length === 1)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([key, count]) => ({ key: key.toUpperCase(), count: count as number }));
  }, [keystrokeStats]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          
          {/* Header with Grade */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 ${performance.color}`}>
              <span className="text-3xl font-black">{performance.grade}</span>
              <span className="text-sm font-medium text-slate-400">{performance.label}</span>
            </div>
          </div>

          {/* Low accuracy warning */}
          {isLowAccuracy && (
            <div className="flex items-center justify-center gap-2 mb-6 text-amber-400 bg-amber-400/10 rounded-xl px-4 py-3 border border-amber-400/20">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Focus on accuracy before speed. Slow down and aim for 90%+</span>
            </div>
          )}

          {/* Main Stats - Circular Progress */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <CircularProgress value={wpm} max={150} size={140} label="WPM" color="text-primary" />
            <CircularProgress value={accuracy} max={100} size={140} label="ACC %" color="text-emerald-400" />
            {consistencyValue !== null && (
              <CircularProgress value={consistencyValue} max={100} size={140} label="CONS %" color="text-violet-400" />
            )}
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard icon={<Zap className="w-4 h-4" />} label="Raw WPM" value={rawWpm} />
            <StatCard icon={<Target className="w-4 h-4" />} label="Errors" value={errors} highlight={errors === 0} />
            <StatCard icon={<Clock className="w-4 h-4" />} label="Time" value={`${time}s`} />
            <StatCard icon={<Hash className="w-4 h-4" />} label="Characters" value={charsBreakdown.total} subValue={`(${charsBreakdown.correct}/${charsBreakdown.incorrect})`} />
          </div>

          {/* Performance Graph */}
          {chartData && (
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-300">Performance Over Time</span>
              </div>
              <div className="h-[180px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Error Analysis */}
          {(topErrorKeys.length > 0 || (errorTypes && Object.values(errorTypes).some(v => v > 0))) && (
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-700/50">
              <div className="text-sm font-medium text-slate-300 mb-4">Error Analysis</div>
              <div className="flex flex-wrap gap-6">
                {/* Problem Keys */}
                {topErrorKeys.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Problem Keys</div>
                    <div className="flex gap-2">
                      {topErrorKeys.map(({ key, count }) => (
                        <div key={key} className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 font-mono font-bold">
                            {key}
                          </div>
                          <span className="text-xs text-slate-500 mt-1">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Error Types */}
                {errorTypes && Object.values(errorTypes).some(v => v > 0) && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Error Types</div>
                    <div className="flex gap-3">
                      {errorTypes.punctuation > 0 && (
                        <div className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm">
                          <span className="text-slate-400">Punctuation:</span>
                          <span className="text-red-400 ml-1 font-semibold">{errorTypes.punctuation}</span>
                        </div>
                      )}
                      {errorTypes.case > 0 && (
                        <div className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm">
                          <span className="text-slate-400">Case:</span>
                          <span className="text-red-400 ml-1 font-semibold">{errorTypes.case}</span>
                        </div>
                      )}
                      {errorTypes.number > 0 && (
                        <div className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm">
                          <span className="text-slate-400">Numbers:</span>
                          <span className="text-red-400 ml-1 font-semibold">{errorTypes.number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-slate-900 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold transition-all border border-slate-700 hover:border-slate-600"
            >
              <Copy className="w-5 h-5" />
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-100 px-4 py-2 rounded-xl shadow-xl border border-slate-700 text-sm font-medium z-50">
          Result copied to clipboard!
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ResultScreen;
