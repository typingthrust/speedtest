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
  // Dark theme gradient: slate-700 (low) to cyan-500 (high)
  const getColor = (count: number) => {
    if (!count) return '#334155'; // slate-700
    if (count < maxCount * 0.3) return '#475569'; // slate-600
    if (count < maxCount * 0.6) return '#22d3ee'; // cyan-400
    if (count < maxCount * 0.9) return '#06b6d4'; // cyan-500
    return '#0891b2'; // cyan-600
  };
  const getTextColor = (bg: string) => {
    // If background is cyan (bright), use dark text
    if (bg === '#22d3ee' || bg === '#06b6d4' || bg === '#0891b2') return '#0f172a'; // slate-900
    // Otherwise, use light text for dark backgrounds
    return '#f1f5f9'; // slate-100
  };
  // Color legend for dark theme
  const legend = [
    { label: 'Low', color: '#334155' },
    { label: 'Medium', color: '#475569' },
    { label: 'High', color: '#22d3ee' },
    { label: 'Most', color: '#06b6d4' },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto mt-2 p-2 sm:p-4 bg-slate-800 rounded-2xl flex flex-col items-center">
      <div className="text-xs sm:text-sm font-semibold text-slate-300 mb-2">Key Press Heatmap</div>
      <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4 text-[10px] sm:text-xs text-slate-400 flex-wrap justify-center">
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
                  className="w-7 h-8 sm:w-10 sm:h-12 flex items-center justify-center rounded-lg font-bold text-xs sm:text-lg shadow-sm border border-slate-700 transition-all"
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
      <span className="text-2xl font-bold text-slate-200">protype</span>
      <span className="text-xs text-slate-400 font-mono tracking-widest">typing test</span>
    </div>
    <nav className="flex gap-4 text-slate-400 text-sm font-semibold">
      <a href="#" className="hover:underline">About</a>
      <a href="#" className="hover:underline">GitHub</a>
      <a href="#" className="hover:underline">Contact</a>
    </nav>
  </header>
);
// Footer
const ResultFooter = () => (
  <footer className="w-full text-center text-xs text-slate-400 py-4 mt-4">
    &copy; {new Date().getFullYear()} protype &mdash; inspired by Monkeytype
  </footer>
);

// Data-driven AI analysis function with real insights
function analyzePerformance({ keystrokeStats, errorTypes, wpm, accuracy, consistency, timeGraphData, errors, time }) {
  const insights: string[] = [];
  const actionableTips: string[] = [];
  
  // 1. Calculate actual error rate
  const errorRate = time > 0 ? (errors / time) : 0;
  const charsPerSecond = wpm > 0 ? (wpm * 5) / 60 : 0;
  
  // 2. Analyze accuracy patterns
  if (accuracy < 50) {
    insights.push(`Your accuracy is ${accuracy}%, which is quite low. Focus on slowing down and typing correctly rather than speed.`);
    actionableTips.push('Practice typing slowly and accurately first. Speed will come naturally with muscle memory.');
  } else if (accuracy < 80) {
    insights.push(`Your accuracy is ${accuracy}%. Aim for 90%+ by focusing on correct keystrokes.`);
    actionableTips.push('Try reducing your speed by 20% and focus on hitting the right keys. Accuracy should improve.');
  } else if (accuracy < 95) {
    insights.push(`Good accuracy at ${accuracy}%! You're on the right track.`);
    actionableTips.push('You\'re close to excellent accuracy. Focus on the remaining error-prone characters.');
  } else {
    insights.push(`Excellent accuracy at ${accuracy}%! Your typing precision is great.`);
  }
  
  // 3. Analyze speed vs accuracy trade-off
  if (wpm > 0 && accuracy > 0) {
    const speedAccuracyRatio = wpm / accuracy;
    if (speedAccuracyRatio > 1.2 && accuracy < 90) {
      insights.push(`You're typing fast (${wpm} WPM) but making many errors. Slow down 15-20% to improve accuracy.`);
      actionableTips.push('Try a "accuracy-first" practice: type at 70% of your current speed and focus on zero errors.');
    } else if (speedAccuracyRatio < 0.8 && accuracy > 95) {
      insights.push(`You have great accuracy but can work on speed. Your current pace is ${wpm} WPM.`);
      actionableTips.push('Gradually increase speed while maintaining accuracy. Aim for 5-10 WPM improvement per week.');
    }
  }
  
  // 4. Analyze error patterns from actual data
  if (errorTypes) {
    const totalErrors = (errorTypes.punctuation || 0) + (errorTypes.case || 0) + (errorTypes.number || 0) + (errorTypes.other || 0);
    if (totalErrors > 0) {
      const punctuationPct = ((errorTypes.punctuation || 0) / totalErrors) * 100;
      const casePct = ((errorTypes.case || 0) / totalErrors) * 100;
      const numberPct = ((errorTypes.number || 0) / totalErrors) * 100;
      
      if (punctuationPct > 30) {
        insights.push(`${Math.round(punctuationPct)}% of your errors are punctuation-related.`);
        actionableTips.push('Practice typing sentences with commas, periods, and quotes. Focus on shift key combinations.');
      }
      if (casePct > 25) {
        insights.push(`${Math.round(casePct)}% of errors involve case sensitivity (uppercase/lowercase).`);
        actionableTips.push('Pay attention to capital letters at sentence starts and proper nouns. Practice shift key timing.');
      }
      if (numberPct > 20) {
        insights.push(`${Math.round(numberPct)}% of errors are with numbers.`);
        actionableTips.push('Practice typing numbers on the top row. Numbers require different finger positioning.');
      }
    }
  }
  
  // 5. Analyze consistency from graph data
  if (timeGraphData && timeGraphData.length >= 3) {
    const wpmValues = timeGraphData.map(d => d.y).filter(v => !isNaN(v) && isFinite(v));
    if (wpmValues.length >= 3) {
      const firstThird = wpmValues.slice(0, Math.floor(wpmValues.length / 3));
      const lastThird = wpmValues.slice(-Math.floor(wpmValues.length / 3));
      const avgStart = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
      const avgEnd = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
      
      if (avgEnd > avgStart * 1.15) {
        insights.push('You improved your speed throughout the test - great warm-up effect!');
        actionableTips.push('Try a 30-second warm-up before tests to start at your best speed.');
      } else if (avgEnd < avgStart * 0.85) {
        insights.push('Your speed decreased during the test, suggesting fatigue or loss of focus.');
        actionableTips.push('Build typing stamina with longer practice sessions. Take breaks to maintain focus.');
      }
    }
  }
  
  // 6. Analyze most problematic keys from actual keyCounts
  if (keystrokeStats && keystrokeStats.keyCounts) {
    const keyEntries = Object.entries(keystrokeStats.keyCounts as Record<string, number>)
      .filter(([char]) => char && char.trim() && char.length === 1)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    
    if (keyEntries.length > 0) {
      const topProblemKeys = keyEntries.slice(0, 3).map(([key]) => key);
      if (topProblemKeys.length > 0) {
        insights.push(`Most problematic keys: ${topProblemKeys.join(', ').toUpperCase()}. These account for most of your errors.`);
        actionableTips.push(`Focus practice on these specific keys: ${topProblemKeys.join(', ').toUpperCase()}. Use targeted exercises.`);
      }
    }
  }
  
  // 7. Time-based insights
  if (time > 0) {
    if (errorRate > 2) {
      insights.push(`You're making ${errorRate.toFixed(1)} errors per second. This is quite high.`);
      actionableTips.push('Slow down and focus on accuracy. Aim for less than 1 error per second.');
    } else if (errorRate > 1) {
      insights.push(`Error rate: ${errorRate.toFixed(1)} per second. Room for improvement.`);
    }
  }
  
  // 8. Consistency analysis
  if (consistency !== null && consistency !== undefined) {
    if (consistency < 60) {
      insights.push(`Your consistency is ${consistency}% - your speed varies a lot during typing.`);
      actionableTips.push('Practice maintaining steady rhythm. Use a metronome app to practice consistent pacing.');
    } else if (consistency < 80) {
      insights.push(`Consistency: ${consistency}%. Good, but can be more steady.`);
      actionableTips.push('Focus on maintaining the same pace throughout. Avoid rushing or slowing down.');
    } else {
      insights.push(`Excellent consistency at ${consistency}%! You maintain steady speed.`);
    }
  }
  
  // 9. Overall performance tier
  if (wpm >= 60 && accuracy >= 95) {
    insights.push('You\'re in the advanced tier! Excellent speed and accuracy combination.');
  } else if (wpm >= 40 && accuracy >= 90) {
    insights.push('Solid intermediate performance. Keep practicing to reach advanced levels.');
  } else if (wpm < 30) {
    actionableTips.push('Start with basic typing exercises. Focus on home row keys and proper finger placement.');
  }
  
  // Ensure we always have at least one insight
  if (insights.length === 0) {
    insights.push('Keep practicing regularly to see detailed insights about your typing patterns.');
  }
  if (actionableTips.length === 0) {
    actionableTips.push('Practice daily for 10-15 minutes to see steady improvement.');
  }
  
  // Get most mistyped characters for display
  let mistypedChars: string[] = [];
  if (keystrokeStats && keystrokeStats.keyCounts) {
    mistypedChars = Object.entries(keystrokeStats.keyCounts as Record<string, number>)
      .filter(([char]) => char && char.trim() && char.length === 1)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([key]) => key.toUpperCase());
  }
  
  return {
    insights: insights.slice(0, 4), // Limit to 4 most relevant insights
    actionableTips: actionableTips.slice(0, 3), // Top 3 actionable tips
    mistypedChars,
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
  
  // Robust Y-axis bounds calculation - handles any data range without overflow
  const allY = [...wpmData, ...accData].filter(v => !isNaN(v) && isFinite(v) && v >= 0);
  let yMin = 0;
  let yMax = 100;
  
  if (allY.length > 0) {
    const dataMin = Math.min(...allY);
    const dataMax = Math.max(...allY);
    const range = dataMax - dataMin;
    
    // For very high values, use percentage-based padding
    // For normal values, use fixed padding
    let padding: number;
    if (dataMax > 500) {
      // For very high values (like 1000+), use 20% padding
      padding = dataMax * 0.2;
    } else if (dataMax > 100) {
      // For medium-high values, use 15% padding
      padding = dataMax * 0.15;
    } else {
      // For normal values, use at least 10 units or 15% of range
      padding = Math.max(10, range > 0 ? range * 0.15 : dataMax * 0.15);
    }
    
    // Set minimum (never below 0)
    yMin = Math.max(0, Math.floor(dataMin - Math.min(padding * 0.5, dataMin)));
    
    // Set maximum with generous padding - always round up to next nice number
    const rawMax = dataMax + padding;
    // Round up to a "nice" number for better readability
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const normalized = rawMax / magnitude;
    let niceMax: number;
    if (normalized <= 1) niceMax = 1 * magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;
    
    yMax = Math.ceil(niceMax);
    
    // Ensure minimum range for readability
    if (yMax - yMin < 20 && dataMax < 100) {
      const center = (yMax + yMin) / 2;
      yMin = Math.max(0, Math.floor(center - 15));
      yMax = Math.ceil(center + 15);
    }
  }
  
  // Format function for Y-axis labels (handles large numbers)
  const formatYLabel = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return Math.round(value).toString();
  };
  // Chart.js dataset config (line-only, no fill)
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#22d3ee', // cyan-400
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2.5,
        clip: true, // Clip to chart area
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#94a3b8', // slate-400
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2.5,
        clip: true, // Clip to chart area
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Generous padding to ensure labels never get cut off
    layout: { 
      padding: { 
        top: 20, 
        bottom: 35, // Extra padding for X-axis labels and title
        left: yMax > 100 ? 35 : 30, // More padding for large Y-axis numbers
        right: 30 // Padding to prevent right-side overflow
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { 
        enabled: true, 
        backgroundColor: '#1e293b', // slate-800
        titleColor: '#f1f5f9', // slate-100
        bodyColor: '#f1f5f9', // slate-100
        borderColor: '#475569', // slate-600
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)}`;
          }
        }
      },
      title: { display: false },
    },
    // Don't clip - let labels render in padding area
    clip: false,
    // Interaction settings
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    // Animation settings for smooth rendering
    animation: {
      duration: 0, // Disable animation for better performance
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        bounds: 'data', // Keep bounds within data range
        ticks: { 
          color: '#94a3b8', // slate-400
          font: { size: 10, family: 'ui-monospace, monospace' }, // Monospace for alignment
          maxTicksLimit: 7, // Limit to prevent crowding
          padding: 10, // Generous padding from chart edge
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          autoSkipPadding: 15, // More space between visible labels
          stepSize: undefined, // Let Chart.js calculate optimal step
          callback: function(value: any, index: number, ticks: any[]) {
            // Smart label display - show first, last, and evenly spaced middle labels
            const labels = this.chart.data.labels as number[];
            if (labels.length <= 8) {
              return value; // Show all if few points
            }
            // Show first, last, and every nth in between
            if (index === 0 || index === labels.length - 1) {
              return value;
            }
            const step = Math.ceil(labels.length / 6);
            return index % step === 0 ? value : '';
          }
        },
        title: { 
          display: true, 
          text: 'Time (s)', 
          color: '#94a3b8', // slate-400
          font: { size: 11, weight: '500' },
          padding: { top: 12, bottom: 0 }
        },
        min: 0,
        offset: false, // Keep labels aligned
      },
      y: {
        grid: { display: false, drawBorder: false },
        bounds: 'ticks', // Keep bounds within tick range
        ticks: { 
          color: '#94a3b8', // slate-400
          font: { size: 10, family: 'ui-monospace, monospace' }, // Monospace for alignment
          maxTicksLimit: 6, // Reduced for large numbers
          padding: 12, // Generous padding from chart edge
          stepSize: undefined, // Let Chart.js calculate optimal step
          callback: function(value: number) {
            // Format large numbers nicely
            return formatYLabel(value);
          }
        },
        title: { 
          display: true, 
          text: 'WPM / Accuracy', 
          color: '#94a3b8', // slate-400
          font: { size: 11, weight: '500' },
          padding: { left: 0, right: 12 }
        },
        min: yMin,
        max: yMax,
        // Strict bounds enforcement
        afterBuildTicks: (scale: any) => {
          // Filter ticks to ensure they're within bounds
          scale.ticks = scale.ticks.filter((tick: any) => {
            const val = tick.value;
            return val >= yMin && val <= yMax;
          });
        },
        afterDataLimits: (scale: any) => {
          // Enforce strict bounds - never exceed
          scale.min = Math.max(0, yMin);
          scale.max = yMax;
          // Add small buffer to ensure data points don't touch edges
          const buffer = (scale.max - scale.min) * 0.02;
          scale.max = scale.max + buffer;
        },
        afterSetDimensions: (scale: any) => {
          // Ensure scale dimensions account for padding
          scale.width = scale.width - 60; // Account for left padding
        },
      },
    },
    elements: {
      line: { borderWidth: 2.5 },
      point: { radius: 2 },
    },
  };

  // AI Feedback with real data analysis
  const aiFeedback = analyzePerformance({ 
    keystrokeStats, 
    errorTypes, 
    wpm, 
    accuracy, 
    consistency,
    timeGraphData,
    errors,
    time,
  });

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
        borderColor: '#22d3ee', // cyan-400
        backgroundColor: 'rgba(34, 211, 238, 0.1)', // cyan-400 with opacity
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: miniChartAcc,
        borderColor: '#06b6d4', // cyan-500
        backgroundColor: 'rgba(6, 182, 212, 0.1)', // cyan-500 with opacity
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-between p-0 transition-colors">
      <Navbar />
      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto flex flex-col gap-3 px-1 sm:px-4 py-4">
        {/* Key Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 bg-slate-800 rounded-xl shadow border border-slate-700 p-3 text-center">
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-1">WPM</div>
            <div className="text-2xl font-extrabold text-cyan-400">{wpm}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-1">Accuracy</div>
            <div className="text-2xl font-extrabold text-cyan-400">{accuracy}%</div>
            </div>
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-1">Errors</div>
            <div className="text-2xl font-extrabold text-red-400">{errors}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-1">Time</div>
            <div className="text-2xl font-extrabold text-slate-100">{formatTime(time)}</div>
            </div>
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-1">Consistency</div>
            <div className="text-2xl font-extrabold text-slate-100">{consistencyDisplay}</div>
          </div>
        </section>

        {/* Chart & AI Analysis */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex-1 bg-slate-800 rounded-xl shadow border border-slate-700 p-4 flex flex-col min-h-[280px]">
            <div className="text-base font-bold text-slate-100 mb-3">WPM / Accuracy</div>
            <div 
              className="w-full flex-1 flex items-center justify-center relative" 
              style={{ 
                minHeight: '240px',
                maxHeight: '400px',
                overflow: 'visible', // Allow labels to render in padding area
              }}
            >
              {timeGraphData && timeGraphData.length >= 2 ? (
                <div 
                  className="w-full h-full relative" 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible', // Critical: allow labels to render
                  }}
                >
                  <Line 
                    data={chartData} 
                    options={chartOptions} 
                    style={{
                      width: '100%', 
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                </div>
              ) : (
                <span className="text-slate-400 text-sm">No data</span>
              )}
            </div>
          </div>
          <div className="flex-1 bg-slate-800 rounded-xl shadow border border-slate-700 p-4 flex flex-col min-h-[280px]">
            <div className="text-base font-bold text-slate-100 mb-2">Performance Insights</div>
            {progressFeedback && (
              <div className="text-sm text-slate-200 font-semibold mb-3 pb-2 border-b border-slate-700">{progressFeedback}</div>
            )}
            {aiFeedback.insights.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Analysis</div>
                {aiFeedback.insights.map((insight, i) => (
                  <div key={i} className="text-slate-300 text-xs leading-relaxed pl-2 border-l-2 border-cyan-500">
                    {insight}
                  </div>
                ))}
              </div>
            )}
            {aiFeedback.actionableTips.length > 0 && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-700">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Actionable Tips</div>
                {aiFeedback.actionableTips.map((tip, i) => (
                  <div key={i} className="text-slate-200 text-xs leading-relaxed pl-2 border-l-2 border-cyan-400">
                    • {tip}
                  </div>
                ))}
              </div>
            )}
            {aiFeedback.mistypedChars.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-700 text-xs">
                <span className="text-slate-400">Focus on these keys: </span>
                <span className="font-mono font-bold text-cyan-400">{aiFeedback.mistypedChars.join(', ')}</span>
              </div>
            )}
          </div>
        </section>

        {/* Heatmap & Error Breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
            <div className="md:col-span-2 flex-1 bg-slate-800 rounded-xl shadow border border-slate-700 p-4 flex flex-col items-center">
              <KeyboardHeatmap keyStats={keystrokeStats.keyCounts} />
          </div>
        )}
        {errorTypes && (
            <div className="flex-1 bg-slate-800 rounded-xl shadow border border-slate-700 p-4 flex flex-col items-center">
              <div className="text-xs font-semibold text-slate-100 mb-2">Error Breakdown</div>
              <div className="flex flex-row flex-wrap gap-2 w-full justify-center mb-2">
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-red-400">{errorTypes.punctuation || 0}</span>
                  <span className="text-xs text-slate-400">Punctuation</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-red-400">{errorTypes.case || 0}</span>
                  <span className="text-xs text-slate-400">Case</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-red-400">{errorTypes.number || 0}</span>
                  <span className="text-xs text-slate-400">Number</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-red-400">{errorTypes.other || 0}</span>
                  <span className="text-xs text-slate-400">Other</span>
                </div>
              </div>
              {keystrokeStats && keystrokeStats.keyCounts && Object.keys(keystrokeStats.keyCounts).length > 0 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-slate-400 mb-1">Most Mistyped Characters</div>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full text-[11px] sm:text-xs text-slate-200">
                      <thead>
                        <tr className="bg-slate-700 border-b border-slate-600">
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
                            <tr key={char} className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}>
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
            className="bg-cyan-500 text-slate-900 hover:bg-cyan-400 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
          aria-label="Try Again"
        >
          Try Again
        </button>
          <button
            onClick={handleShare}
            className="bg-slate-800 text-slate-100 hover:bg-slate-700 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
            aria-label="Share"
          >
            Share
          </button>
        </section>
        {showToast && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-slate-900 px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-semibold transition-all">Result copied to clipboard!</div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ResultScreen; 