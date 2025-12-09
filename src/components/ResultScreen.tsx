import React, { useState, useMemo, useEffect } from 'react';
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
import { useTheme } from './ThemeProvider';

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
  if (score >= 90) return { grade: 'S', label: 'Exceptional', color: 'text-primary' };
  if (score >= 75) return { grade: 'A', label: 'Excellent', color: 'text-primary' };
  if (score >= 60) return { grade: 'B', label: 'Good', color: 'text-primary' };
  if (score >= 45) return { grade: 'C', label: 'Average', color: 'text-primary' };
  if (score >= 30) return { grade: 'D', label: 'Needs Work', color: 'text-primary' };
  return { grade: 'F', label: 'Keep Practicing', color: 'text-primary' };
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
            strokeWidth="4"
            fill="none"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className="text-primary"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
          </div>
      </div>
    </div>
  );
};

// Stat card component
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue?: string; highlight?: boolean }> = ({
  icon, label, value, subValue, highlight
}) => (
  <div className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}>
    <div className={`p-1.5 sm:p-2 rounded ${highlight ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-base sm:text-lg font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
        {subValue && <span className="text-xs sm:text-sm text-muted-foreground ml-1">{subValue}</span>}
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
  const { theme } = useTheme();
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [theme]);

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

  // Helper to convert HSL to hex
  const hslToHex = (hsl: string): string => {
    // Handle format: "217 91% 60%" or "hsl(217 91% 60%)"
    let h = 0, s = 0, l = 0;
    
    if (hsl.includes('hsl')) {
      // Format: hsl(217 91% 60%)
      const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
      if (match) {
        h = parseInt(match[1]);
        s = parseInt(match[2]);
        l = parseInt(match[3]);
      }
      } else {
      // Format: 217 91% 60%
      const parts = hsl.trim().split(/\s+/);
      if (parts.length >= 3) {
        h = parseInt(parts[0]);
        s = parseInt(parts[1]);
        l = parseInt(parts[2]);
      }
    }
    
    if (h === 0 && s === 0 && l === 0) return '#22d3ee'; // fallback
    
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  };

  // Get theme colors from CSS variables
  const getThemeColor = (varName: string, fallback: string = '#22d3ee') => {
    if (typeof window !== 'undefined') {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (value) {
        // If it's already a hex color, return it
        if (value.startsWith('#')) return value;
        // If it's RGB/RGBA, convert to hex
        if (value.startsWith('rgb')) {
          const rgbMatch = value.match(/\d+/g);
          if (rgbMatch && rgbMatch.length >= 3) {
            const r = parseInt(rgbMatch[0]);
            const g = parseInt(rgbMatch[1]);
            const b = parseInt(rgbMatch[2]);
            return `#${[r, g, b].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            }).join('')}`;
          }
        }
        // If it's HSL format (like "217 91% 60%"), convert to hex
        if (value.match(/\d+\s+\d+%\s+\d+%/) || value.includes('hsl')) {
          return hslToHex(value);
        }
        return value;
      }
    }
    return fallback;
  };

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number = 0.1) => {
    // Handle both hex and rgb formats
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // If already rgba, extract RGB and apply new alpha
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      const rgbMatch = hex.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
      }
    }
    return `rgba(34, 211, 238, ${alpha})`;
  };

  const primaryColor = getThemeColor('--primary', '#22d3ee');
  const mutedColor = getThemeColor('--muted-foreground', '#94a3b8');
  const cardBg = getThemeColor('--card', '#1e293b');
  const foreground = getThemeColor('--foreground', '#f1f5f9');
  const borderColor = getThemeColor('--border', '#475569');
  const background = getThemeColor('--background', '#0f172a');

  // Chart configuration
  const chartData = useMemo(() => {
    if (!timeGraphData || timeGraphData.length < 2) return null;
    // Ensure primaryColor is valid - handle both hex and rgb
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) 
      ? primaryColor 
      : '#22d3ee';
    const fillColor = hexToRgba(validPrimaryColor, 0.2);
    return {
      labels: timeGraphData.map(d => d.x),
    datasets: [
      {
        label: 'WPM',
          data: timeGraphData.map(d => d.y),
          borderColor: validPrimaryColor,
          backgroundColor: fillColor,
          fill: true,
        tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: validPrimaryColor,
          pointHoverBorderColor: validPrimaryColor,
          pointHoverBorderWidth: 2,
        borderWidth: 2.5,
          borderJoinStyle: 'round' as const,
          borderCapStyle: 'round' as const,
      },
    ],
  };
  }, [timeGraphData, primaryColor]);

  const chartOptions = useMemo(() => {
    const allY = timeGraphData?.map(d => d.y).filter(v => !isNaN(v) && isFinite(v)) || [];
    const maxY = allY.length > 0 ? Math.ceil(Math.max(...allY) * 1.2) : 100;
    
    // Ensure colors are valid - handle both hex and rgb formats
    const validCardBg = cardBg && (cardBg.startsWith('#') || cardBg.startsWith('rgb')) ? cardBg : '#1e293b';
    const validBorderColor = borderColor && (borderColor.startsWith('#') || borderColor.startsWith('rgb')) ? borderColor : '#475569';
    const validForeground = foreground && (foreground.startsWith('#') || foreground.startsWith('rgb')) ? foreground : '#f1f5f9';
    const validMutedColor = mutedColor && (mutedColor.startsWith('#') || mutedColor.startsWith('rgb')) ? mutedColor : '#94a3b8';
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const gridColor = hexToRgba(validBorderColor, 0.15);
    
    return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
        tooltip: { 
          enabled: true, 
          backgroundColor: validCardBg, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5, 
          titleColor: validForeground, 
          bodyColor: validForeground,
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 11 },
          padding: 12,
          displayColors: false,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              return `WPM: ${context.parsed.y}`;
            }
          }
        } 
    },
    scales: {
      x: {
          display: true, 
          grid: { display: false, color: 'transparent' }, 
          ticks: { color: validMutedColor, font: { size: 10 }, maxTicksLimit: 8 }, 
          border: { display: false, color: 'transparent' },
      },
      y: {
          display: true, 
          grid: { 
            color: gridColor, 
            drawBorder: false,
            lineWidth: 1,
          }, 
          ticks: { 
            color: validMutedColor, 
            font: { size: 10 }, 
            maxTicksLimit: 5,
            padding: 8,
          }, 
          border: { display: false, color: 'transparent' }, 
          min: 0, 
          max: maxY,
        },
      },
      interaction: { intersect: false, mode: 'index' as const },
      animation: { duration: 800, easing: 'easeOutQuart' as const },
    };
  }, [timeGraphData, cardBg, borderColor, foreground, mutedColor, primaryColor]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          
          {/* Header with Grade */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-card border border-border">
              <span className="text-2xl sm:text-3xl font-bold text-primary">{performance.grade}</span>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">{performance.label}</span>
            </div>
          </div>

          {/* Low accuracy warning */}
          {isLowAccuracy && (
            <div className="flex items-center justify-center gap-2 mb-6 text-foreground bg-card border border-border rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">Focus on accuracy before speed. Slow down and aim for 90%+</span>
            </div>
          )}

          {/* Main Stats - Circular Progress */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-6 sm:mb-8">
            <CircularProgress value={wpm} max={150} size={120} label="WPM" color="text-primary" />
            <CircularProgress value={accuracy} max={100} size={120} label="ACC %" color="text-primary" />
            {consistencyValue !== null && (
              <CircularProgress value={consistencyValue} max={100} size={120} label="CONS %" color="text-primary" />
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
            <div className="bg-card rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Performance Over Time</span>
              </div>
              <div className="h-[160px] sm:h-[180px] border border-primary/20 rounded-lg p-2">
                <Line key={chartKey} data={chartData} options={chartOptions} />
              </div>
          </div>
        )}

          {/* Error Analysis */}
          {(topErrorKeys.length > 0 || (errorTypes && Object.values(errorTypes).some(v => v > 0))) && (
            <div className="bg-card rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Error Analysis</span>
                </div>
              <div className="space-y-4">
                {/* Problem Keys */}
                {topErrorKeys.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Problem Keys</div>
                    <div className="flex flex-wrap gap-2">
                      {topErrorKeys.map(({ key, count }) => (
                        <div key={key} className="flex flex-col items-center group">
                          <div className="w-10 h-10 bg-muted/50 hover:bg-muted border border-border hover:border-primary/30 rounded-lg flex items-center justify-center text-foreground font-mono font-semibold text-base transition-all cursor-default">
                            {key}
                </div>
                          <span className="text-xs text-muted-foreground mt-1.5 font-medium">{count}</span>
                </div>
                      ))}
                </div>
              </div>
                )}
                {/* Error Types */}
                {errorTypes && Object.values(errorTypes).some(v => v > 0) && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Error Types</div>
                    <div className="flex flex-wrap gap-2">
                      {errorTypes.punctuation > 0 && (
                        <div className="px-3 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-xs sm:text-sm border border-border transition-all">
                          <span className="text-muted-foreground">Punctuation:</span>
                          <span className="text-foreground ml-1.5 font-semibold">{errorTypes.punctuation}</span>
                        </div>
                      )}
                      {errorTypes.case > 0 && (
                        <div className="px-3 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-xs sm:text-sm border border-border transition-all">
                          <span className="text-muted-foreground">Case:</span>
                          <span className="text-foreground ml-1.5 font-semibold">{errorTypes.case}</span>
                        </div>
                      )}
                      {errorTypes.number > 0 && (
                        <div className="px-3 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-xs sm:text-sm border border-border transition-all">
                          <span className="text-muted-foreground">Numbers:</span>
                          <span className="text-foreground ml-1.5 font-semibold">{errorTypes.number}</span>
                        </div>
                      )}
                  </div>
                </div>
              )}
              </div>
          </div>
        )}

      {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <button
          onClick={onRetry}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-sm sm:text-base font-semibold transition-all"
        >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          Try Again
        </button>
          <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-card hover:bg-muted text-foreground rounded-lg text-sm sm:text-base font-semibold transition-all border border-border"
          >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              {copied ? 'Copied!' : 'Copy Result'}
          </button>
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card text-foreground px-4 py-2 rounded-xl shadow-xl border border-border text-sm font-medium z-50">
          Result copied to clipboard!
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ResultScreen; 
