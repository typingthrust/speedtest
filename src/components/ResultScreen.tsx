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
  // Color legend for black/grey
  const legend = [
    { label: 'Low', color: '#e5e7eb' },
    { label: 'Medium', color: '#bdbdbd' },
    { label: 'High', color: '#333333' },
    { label: 'Most', color: '#000000' },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto mt-2 p-2 sm:p-4 bg-white rounded-2xl shadow flex flex-col items-center">
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
                  style={{ background: color, color: color === '#000000' ? '#fff' : (count ? '#111' : '#9ca3af') }}
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
        borderColor: '#4a4a4a',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#c4c4c4',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 32, bottom: 24, left: 32, right: 32 } }, // More padding to prevent overflow
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#bdbdbd', font: { size: 12 } },
        title: { display: true, text: 'Time (s)', color: '#bdbdbd', font: { size: 12 } },
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#bdbdbd', font: { size: 12 } },
        title: { display: true, text: 'WPM / Accuracy', color: '#bdbdbd', font: { size: 12 } },
        min: yMin,
        max: yMax,
      },
    },
    elements: {
      line: { borderWidth: 2 },
      point: { radius: 0 },
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

  // --- LAYOUT REFACTOR START ---
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-between p-0 transition-colors">
      <Navbar />
      {/* Main Content */}
      <main className="flex flex-col items-center justify-center w-full flex-1 px-1 sm:px-2 max-w-6xl mx-auto overflow-hidden">
        {/* Stats Card */}
        <div className="w-full flex justify-center mt-4 mb-4 sm:mt-8 sm:mb-6">
          <div className="bg-white rounded-2xl shadow border border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-2xl w-full p-4 sm:p-6">
            <div className="flex flex-col items-center flex-1">
              <span className="uppercase text-gray-500 text-xs font-bold tracking-widest mb-1">wpm</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">{wpm}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="uppercase text-gray-500 text-xs font-bold tracking-widest mb-1">accuracy</span>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{accuracy}%</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="uppercase text-gray-500 text-xs font-bold tracking-widest mb-1">errors</span>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{errors}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="uppercase text-gray-500 text-xs font-bold tracking-widest mb-1">time</span>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{formatTime(time)}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="uppercase text-gray-500 text-xs font-bold tracking-widest mb-1">consistency</span>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{consistencyDisplay}</span>
            </div>
          </div>
        </div>
        {/* Chart and Analysis */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Chart Section */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 flex flex-col items-center justify-center p-0 min-w-0 min-h-[180px] sm:min-h-[240px]">
            <div className="w-full h-40 sm:h-60 flex items-center justify-center" style={{padding: 0, margin: 0}}>
              {timeGraphData && timeGraphData.length >= 2 ? (
                <Line data={chartData} options={chartOptions} style={{width: '100%', height: '150px', maxHeight: '220px'}} />
              ) : (
                <span className="text-gray-400 text-sm">No data</span>
              )}
            </div>
          </div>
          {/* AI Analysis Section (redesigned) */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 flex flex-col items-start justify-center p-4 sm:p-6 min-w-0 w-full animate-fade-in min-h-[180px] sm:min-h-[260px]">
            <div className="w-full mb-2">
              <span className="text-lg sm:text-xl font-bold text-gray-900 block mb-1">AI Analysis</span>
              {progressFeedback && (
                <div className="text-sm sm:text-base text-gray-800 font-semibold mb-2">{progressFeedback}</div>
              )}
              {aiFeedback.suggestions.length > 0 && (
                <ul className="space-y-1 sm:space-y-2 mt-2">
                  {aiFeedback.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-gray-700 text-xs sm:text-sm pl-2 border-l-4 border-gray-200">{s}</li>
                  ))}
                </ul>
              )}
              {aiFeedback.mistypedWords.length > 0 && (
                <div className="mt-2 sm:mt-4 text-xs text-gray-500">Most mistyped: <span className="font-mono text-gray-900">{aiFeedback.mistypedWords.join(', ')}</span></div>
              )}
              {aiFeedback.errorSummary.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">Most errors: <span className="text-gray-900">{aiFeedback.errorSummary[0]}</span></div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Heatmap and Error Breakdown below, side by side on desktop */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 px-1 sm:px-2 max-w-6xl mx-auto">
        {/* Keyboard Heatmap Section (single border) */}
        {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow p-2 sm:p-4 flex flex-col items-center">
              <KeyboardHeatmap keyStats={keystrokeStats.keyCounts} />
            </div>
          </div>
        )}
        {errorTypes && (
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow border border-gray-200 flex flex-col items-center p-2 sm:p-4">
              <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Error Breakdown</div>
              {/* Error Type Bars */}
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-6 text-xs sm:text-base w-full justify-center mb-2 sm:mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-bold text-red-500">{errorTypes.punctuation || 0}</span>
                  <span className="text-xs text-gray-500">Punctuation</span>
                  <div className="w-10 sm:w-12 h-2 bg-gray-100 rounded-full mt-1">
                    <div className="h-2 bg-red-400 rounded-full" style={{width: `${Math.min(100, (errorTypes.punctuation || 0) * 4)}%`}} />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-bold text-blue-500">{errorTypes.case || 0}</span>
                  <span className="text-xs text-gray-500">Case</span>
                  <div className="w-10 sm:w-12 h-2 bg-gray-100 rounded-full mt-1">
                    <div className="h-2 bg-blue-400 rounded-full" style={{width: `${Math.min(100, (errorTypes.case || 0) * 4)}%`}} />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-bold text-green-500">{errorTypes.number || 0}</span>
                  <span className="text-xs text-gray-500">Number</span>
                  <div className="w-10 sm:w-12 h-2 bg-gray-100 rounded-full mt-1">
                    <div className="h-2 bg-green-400 rounded-full" style={{width: `${Math.min(100, (errorTypes.number || 0) * 4)}%`}} />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">{errorTypes.other || 0}</span>
                  <span className="text-xs text-gray-500">Other</span>
                  <div className="w-10 sm:w-12 h-2 bg-gray-100 rounded-full mt-1">
                    <div className="h-2 bg-gray-400 rounded-full" style={{width: `${Math.min(100, (errorTypes.other || 0) * 4)}%`}} />
                  </div>
                </div>
              </div>
              {/* Most Mistyped Characters/Words Table */}
              {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-gray-500 mb-1">Most Mistyped Characters</div>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full text-[11px] sm:text-xs text-gray-900">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1 text-left font-semibold">Char</th>
                          <th className="px-2 py-1 text-left font-semibold">Mistypes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(keystrokeStats.keyCounts)
                          .sort((a, b) => (b[1] as number) - (a[1] as number))
                          .slice(0, 8)
                          .map(([char, count]) => (
                            <tr key={char} className="border-b border-gray-100">
                              <td className="px-2 py-1 font-mono">{char}</td>
                              <td className="px-2 py-1">{count}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center mt-4 sm:mt-6 mb-2 w-full px-1">
        <button
          onClick={onRetry}
          className="bg-gray-900 text-white hover:bg-gray-700 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
          aria-label="Try Again"
        >
          Try Again
        </button>
        {onShare && (
          <button
            onClick={onShare}
            className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
            aria-label="Share"
          >
            Share
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
            aria-label="Save"
          >
            Save
          </button>
        )}
      </div>
      <ResultFooter />
      <Footer />
    </div>
  );
};

export default ResultScreen; 