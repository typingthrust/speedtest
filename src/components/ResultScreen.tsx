import React from 'react';
import { ChartContainer } from './ui/chart';
import { useEffect, useState } from 'react';
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
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);
import { usePersonalization } from './PersonalizationProvider';
import Navbar from './Navbar';
import Footer from './Footer';

interface ResultScreenProps {
  wpm: number;
  accuracy: number;
  errors: number;
  time: number;
  onRetry: () => void;
  keystrokeStats?: { total: number; correct: number; incorrect: number; extra: number; keyCounts?: Record<string, number> };
  errorTypes?: Record<string, number>;
  fingerUsage?: Record<string, number>;
  timeGraphData?: Array<{ x: number; y: number; acc?: number }>;
  consistency?: number | null;
  onShare?: () => void;
  onSave?: () => void;
}

// Keyboard heatmap placeholder component
const KeyboardHeatmap = ({ keyStats }: { keyStats: Record<string, number> }) => {
  const keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];
  // Find max count for gradient
  const maxCount = Math.max(1, ...Object.values(keyStats));
  // Black/grey gradient: light grey (#f3f4f6), medium grey (#bdbdbd), dark grey (#333), black (#000)
  const getColor = (count: number) => {
    if (!count) return '#f3f4f6'; // lightest
    if (count < maxCount * 0.3) return '#e5e7eb'; // light grey
    if (count < maxCount * 0.6) return '#bdbdbd'; // medium grey
    if (count < maxCount * 0.9) return '#333333'; // dark grey
    return '#000000'; // black
  };
  const getTextColor = (bg: string) => {
    // If background is dark grey or black, use white
    if (bg === '#333333' || bg === '#000000') return '#fff';
    // Otherwise, use dark grey for contrast
    return '#111';
  };
  // Color legend for black/grey
  const legend = [
    { label: 'Low', color: '#e5e7eb' },
    { label: 'Medium', color: '#bdbdbd' },
    { label: 'High', color: '#333333' },
    { label: 'Most', color: '#000000' },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto mt-2 p-2 sm:p-4 bg-white rounded-2xl flex flex-col items-center">
      <div className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">Key Press Heatmap</div>
      <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4 text-[10px] sm:text-xs text-gray-400 flex-wrap justify-center">
        {legend.map(l => (
          <span key={l.label} className="flex items-center"><span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded mr-1" style={{background:l.color}}></span>{l.label}</span>
        ))}
      </div>
      <div className="space-y-1 sm:space-y-2 w-full">
        {keys.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-3 w-full">
            {row.map(k => {
              const count = keyStats[k] || 0;
              const color = getColor(count);
              return (
                <div
                  key={k}
                  title={`${k}: ${count} presses`}
                  className="w-7 h-8 sm:w-10 sm:h-12 flex items-center justify-center rounded-lg font-bold text-xs sm:text-lg shadow-sm border border-gray-200 transition-all"
                  style={{ background: color, color: getTextColor(color) }}
                >
                  {k}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Header
const ResultHeader = () => (
  <header className="w-full flex justify-between items-center px-8 pt-6 pb-2">
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-gray-700">protype</span>
      <span className="text-xs text-gray-400 font-mono tracking-widest">typing test</span>
    </div>
    <nav className="flex gap-4 text-gray-400 text-sm font-semibold">
      <a href="#" className="hover:underline">About</a>
      <a href="#" className="hover:underline">GitHub</a>
      <a href="#" className="hover:underline">Contact</a>
    </nav>
  </header>
);
// Footer
const ResultFooter = () => (
  <footer className="w-full text-center text-xs text-gray-400 py-4 mt-4">
    &copy; {new Date().getFullYear()} protype &mdash; inspired by Monkeytype
  </footer>
);

// Smarter AI analysis function
function analyzePerformance({ keystrokeStats, errorTypes, wpm, accuracy, consistency }) {
  // 1. Find most mistyped words (from keystrokeStats if available)
  let mistypedWords = [];
  if (keystrokeStats && typeof keystrokeStats.mistypedWords === 'object' && keystrokeStats.mistypedWords !== null) {
    mistypedWords = Object.entries(keystrokeStats.mistypedWords as Record<string, number>)
      .filter(([, v]) => typeof v === 'number')
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([word]) => word);
  }
  // Fallback: use keyCounts for most mistyped letters
  if (mistypedWords.length === 0 && keystrokeStats && typeof keystrokeStats.keyCounts === 'object' && keystrokeStats.keyCounts !== null) {
    mistypedWords = Object.entries(keystrokeStats.keyCounts as Record<string, number>)
      .filter(([, v]) => typeof v === 'number')
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([key]) => key);
  }
  // 2. Error type summary
  const errorSummary = [];
  if (errorTypes) {
    if (errorTypes.punctuation) errorSummary.push(`Punctuation: ${errorTypes.punctuation}`);
    if (errorTypes.case) errorSummary.push(`Case: ${errorTypes.case}`);
    if (errorTypes.number) errorSummary.push(`Numbers: ${errorTypes.number}`);
    if (errorTypes.other) errorSummary.push(`Other: ${errorTypes.other}`);
  }
  // 3. Suggestions
  const suggestions = [];
  if (accuracy < 90) suggestions.push('Focus on accuracy, especially for common words.');
  if (errorTypes && errorTypes.punctuation > 0) suggestions.push('Review punctuation rules and practice sentences with punctuation.');
  if (errorTypes && errorTypes.case > 0) suggestions.push('Pay attention to uppercase and lowercase letters.');
  if (wpm < 40) suggestions.push('Try to increase your typing speed with regular practice.');
  if (consistency && consistency < 80) suggestions.push('Work on maintaining a steady pace throughout the test.');
  if (suggestions.length === 0) suggestions.push('Great job! Keep practicing to improve even more.');
  return {
    mistypedWords,
    errorSummary,
    suggestions,
  };
}

// Helper to format seconds as mm:ss
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Helper to display printable or special key names
const getDisplayChar = (char: string) => {
  if (char === ' ') return 'Space';
  if (char === '') return '?';
  if (/^\s+$/.test(char)) return 'Whitespace';
  if (char.length === 1 && char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) return char;
  return '?';
};

const ResultScreen: React.FC<ResultScreenProps> = ({
  wpm,
  accuracy,
  errors,
  time,
  onRetry,
  keystrokeStats,
  errorTypes,
  fingerUsage,
  timeGraphData,
  consistency,
  onShare,
  onSave,
}) => {
  // Fade-in animation for chart
  const [showChart, setShowChart] = useState(false);
  useEffect(() => {
    setShowChart(false);
    const timeout = setTimeout(() => setShowChart(true), 350);
    return () => clearTimeout(timeout);
  }, [timeGraphData]);

  // Consistency calculation (percentage)
  let consistencyDisplay = '-';
  if (timeGraphData && timeGraphData.length >= 2) {
    const wpmValues = timeGraphData.map(p => p.y);
    if (wpmValues.length >= 2) {
      const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
      const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
      const stddev = Math.sqrt(variance);
      let score = 0;
      if (mean === 0) {
        score = 0;
      } else if (stddev === 0) {
        score = 100;
      } else {
        score = Math.max(0, Math.min(100, Math.round((1 - stddev / mean) * 100)));
      }
      consistencyDisplay = `${score}%`;
    }
  }

  // Collect keyStats for heatmap (from keystrokeStats.keyCounts or fallback)
  const keyStats = (keystrokeStats && typeof keystrokeStats.keyCounts === 'object' ? keystrokeStats.keyCounts : {}) as Record<string, number>;

  // Prepare Chart.js data
  const chartLabels = timeGraphData ? timeGraphData.map((d, i) => d.x) : [];
  const wpmData = timeGraphData ? timeGraphData.map(d => d.y) : [];
  const accData = timeGraphData ? timeGraphData.map(d => d.acc ?? 100) : [];
  // Dynamic Y-axis min/max for better curve
  const allY = [...wpmData, ...accData];
  const yMin = Math.max(0, Math.min(...allY) - 5);
  const yMax = Math.min(100, Math.max(...allY) + 5);
  // Chart.js dataset config (line-only, no fill)
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#111', // darker line
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#888', // grey line
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2.5,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 12, bottom: 12, left: 12, right: 12 } }, // less padding
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff', borderColor: '#444', borderWidth: 1 },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#888', font: { size: 12 } },
        title: { display: true, text: 'Time (s)', color: '#888', font: { size: 12 } },
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#888', font: { size: 12 } },
        title: { display: true, text: 'WPM / Accuracy', color: '#888', font: { size: 12 } },
        min: yMin,
        max: yMax,
      },
    },
    elements: {
      line: { borderWidth: 2.5 },
      point: { radius: 2 },
    },
  };

  // AI Feedback
  const aiFeedback = analyzePerformance({ keystrokeStats, errorTypes, wpm, accuracy, consistency });

  // Add personalization state for history-based feedback
  const { state: personalizationState } = usePersonalization();
  const history = personalizationState?.stats?.history || [];
  // Compute previous and average stats
  const prevSession = history.length > 1 ? history[history.length - 2] : null;
  const avgWpm = history.length > 0 ? Math.round(history.reduce((sum, t) => sum + t.wpm, 0) / history.length) : null;
  const avgAccuracy = history.length > 0 ? Math.round(history.reduce((sum, t) => sum + t.accuracy, 0) / history.length) : null;
  // Prepare mini chart data for WPM/accuracy over time
  const miniChartLabels = history.map((h, i) => i + 1);
  const miniChartWpm = history.map(h => h.wpm);
  const miniChartAcc = history.map(h => h.accuracy);
  const miniChartData = {
    labels: miniChartLabels,
    datasets: [
      {
        label: 'WPM',
        data: miniChartWpm,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: miniChartAcc,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2,
      },
    ],
  };
  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
    elements: { line: { borderWidth: 2 } },
  };
  // Motivational feedback
  let progressFeedback = '';
  if (prevSession) {
    const wpmDelta = wpm - prevSession.wpm;
    const accDelta = accuracy - prevSession.accuracy;
    if (wpmDelta > 0 && accDelta > 0) progressFeedback = `Great job! Your speed and accuracy both improved since your last session (+${wpmDelta} WPM, +${accDelta}% accuracy).`;
    else if (wpmDelta > 0) progressFeedback = `Nice! Your speed improved by ${wpmDelta} WPM compared to your last session.`;
    else if (accDelta > 0) progressFeedback = `Your accuracy improved by ${accDelta}% compared to your last session.`;
    else if (wpmDelta < 0 || accDelta < 0) progressFeedback = `Keep going! Review your mistakes and try to beat your last session next time.`;
  } else if (history.length > 1) {
    progressFeedback = `Keep practicing to see your progress over time!`;
  }

  // Add a simple toast state for share feedback
  const [showToast, setShowToast] = useState(false);

  // In the ResultScreen component, define the share handler
  const handleShare = () => {
    const summary = `Typing Test Result:\nWPM: ${wpm}\nAccuracy: ${accuracy}%\nErrors: ${errors}\nTime: ${formatTime(time)}\nConsistency: ${consistencyDisplay}`;
    navigator.clipboard.writeText(summary).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-between p-0 transition-colors">
      <Navbar />
      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto flex flex-col gap-3 px-1 sm:px-4 py-4">
        {/* Key Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 bg-white rounded-xl shadow border border-gray-100 p-3 text-center">
          <div>
            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">WPM</div>
            <div className="text-2xl font-extrabold text-gray-900">{wpm}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">Accuracy</div>
            <div className="text-2xl font-extrabold text-gray-900">{accuracy}%</div>
            </div>
          <div>
            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">Errors</div>
            <div className="text-2xl font-extrabold text-gray-900">{errors}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">Time</div>
            <div className="text-2xl font-extrabold text-gray-900">{formatTime(time)}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">Consistency</div>
            <div className="text-2xl font-extrabold text-gray-900">{consistencyDisplay}</div>
          </div>
        </section>

        {/* Chart & AI Analysis */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex-1 bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-col items-center min-h-[180px]">
            <div className="w-full h-32 sm:h-40 flex items-center justify-center">
              {timeGraphData && timeGraphData.length >= 2 ? (
                <Line data={chartData} options={chartOptions} style={{width: '100%', height: '100%'}} />
              ) : (
                <span className="text-gray-400 text-sm">No data</span>
              )}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-col min-h-[180px]">
            <div className="text-base font-bold text-gray-900 mb-1">AI Insights</div>
              {progressFeedback && (
              <div className="text-sm text-gray-800 font-semibold mb-2">{progressFeedback}</div>
              )}
              {aiFeedback.suggestions.length > 0 && (
              <ul className="space-y-1 mt-2">
                  {aiFeedback.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-gray-700 text-xs pl-2 border-l-4 border-gray-200">{s}</li>
                  ))}
                </ul>
              )}
              {aiFeedback.mistypedWords.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">Most mistyped: <span className="font-mono text-gray-900">{aiFeedback.mistypedWords.join(', ')}</span></div>
              )}
              {aiFeedback.errorSummary.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">Most errors: <span className="text-gray-900">{aiFeedback.errorSummary[0]}</span></div>
              )}
            </div>
        </section>

        {/* Heatmap & Error Breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
            <div className="md:col-span-2 flex-1 bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-col items-center">
              <KeyboardHeatmap keyStats={keystrokeStats.keyCounts} />
          </div>
        )}
        {errorTypes && (
            <div className="flex-1 bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-col items-center">
              <div className="text-xs font-semibold text-gray-900 mb-2">Error Breakdown</div>
              <div className="flex flex-row flex-wrap gap-2 w-full justify-center mb-2">
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-gray-900">{errorTypes.punctuation || 0}</span>
                  <span className="text-xs text-gray-500">Punctuation</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-gray-900">{errorTypes.case || 0}</span>
                  <span className="text-xs text-gray-500">Case</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-gray-900">{errorTypes.number || 0}</span>
                  <span className="text-xs text-gray-500">Number</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-gray-900">{errorTypes.other || 0}</span>
                  <span className="text-xs text-gray-500">Other</span>
                </div>
              </div>
              {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-gray-500 mb-1">Most Mistyped Characters</div>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full text-[11px] sm:text-xs text-gray-900">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-2 py-1 text-left font-semibold">Char</th>
                          <th className="px-2 py-1 text-left font-semibold">Mistypes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(keystrokeStats.keyCounts)
                          .filter(([char]) => char && char.trim() && char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126)
                          .sort((a, b) => (b[1] as number) - (a[1] as number))
                          .slice(0, 8)
                          .map(([char, count], idx) => (
                            <tr key={char} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                              <td className="px-2 py-1 font-mono">{getDisplayChar(char)}</td>
                              <td className="px-2 py-1">{count}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}
        </section>

      {/* Action Buttons */}
        <section className="flex flex-row flex-wrap gap-2 sm:gap-4 justify-center mt-4 mb-2 w-full">
        <button
          onClick={onRetry}
            className="bg-gray-900 text-white hover:bg-gray-700 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
          aria-label="Try Again"
        >
          Try Again
        </button>
          <button
            onClick={handleShare}
            className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
            aria-label="Share"
          >
            Share
          </button>
        </section>
        {showToast && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-semibold transition-all">Result copied to clipboard!</div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ResultScreen; 