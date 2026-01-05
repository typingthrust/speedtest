import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
// Profile page with theme-adaptive charts
import { useAuth } from '../components/AuthProvider';
import { usePersonalization } from '../components/PersonalizationProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Keyboard, Bell, User as UserIcon, Award, Users, BookOpen, Rocket, TrendingUp, Target, Clock, Zap, BarChart3, Activity } from 'lucide-react';
import { ExpandableTabs } from '../components/ui/expandable-tabs';
import type { OverlayType } from '../components/OverlayProvider';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Title, Tooltip, Legend);
import Navbar from '../components/Navbar';
import Certificate from '../components/Certificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import KeyboardHeatmap from '../components/KeyboardHeatmap';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useGamification } from '../components/GamificationProvider';
import { useLeaderboard } from '../components/LeaderboardProvider';
import { useOverlay } from '../components/OverlayProvider';
import { useTheme } from '../components/ThemeProvider';

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

const navbarTabs = [
  { title: 'Gamification', icon: Award },
  { title: 'Leaderboard', icon: Users },
  { title: 'Content', icon: BookOpen },
  { title: 'Growth', icon: Rocket },
];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getWpmGraphData(history: any[]) {
  return history
    .filter((h) => h.wpm && h.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h, i) => ({ x: i, y: h.wpm }));
}

function getMostActiveDay(history: any[]) {
  const dayCounts: Record<string, number> = {};
  history.forEach((h: any) => {
    if (h.timestamp) {
      const day = new Date(h.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });
  return Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}

function getTypingStreak(history: any[]) {
  const sorted = history
    .filter((h: any) => h.timestamp)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  let streak = 0;
  if (sorted.length > 0) {
    let currentDate = new Date();
    let consecutiveDays = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toDateString();
      const hasTest = sorted.some((h: any) => new Date(h.timestamp).toDateString() === dateStr);
      if (hasTest) {
        consecutiveDays++;
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
    streak = consecutiveDays;
  }
  return streak;
}

function getBestWpm(history: any[]) {
  return history.length > 0 ? Math.max(...history.map((h: any) => h.wpm || 0)) : 0;
}
function getBestAccuracy(history: any[]) {
  return history.length > 0 ? Math.max(...history.map((h: any) => h.accuracy || 0)) : 0;
}
function getAvgWpm(history: any[]) {
  if (!history.length) return 0;
  const total = history.reduce((sum: number, h: any) => sum + (h.wpm || 0), 0);
  return Math.round(total / history.length);
}
function getTotalWords(history: any[]) {
  return history.reduce((sum: number, h: any) => sum + (h.wordCount || 0), 0);
}
function getTopCategory(history: any[]) {
  const validCategories = [
    'Coding',
    'Syntax Challenges',
    'Custom',
    'Words',
    'Timed',
    'Essay Builder',
    'Quotes',
    'Zen Writing',
    'No Timer',
    'Hard Words',
    'Foreign Language Practice',
  ];
  
  const cat: Record<string, number> = {};
  history.forEach((h: any) => {
    // Try multiple sources: testType (already normalized), keystroke_stats.testType, test_type
    let type = h.testType || null;
    
    // If testType is not set, try to get it from keystroke_stats
    if (!type) {
      const keystrokeStats = h.keystroke_stats || h.keystrokeStats || {};
      // Handle case where keystroke_stats might be a string
      let parsedStats = keystrokeStats;
      if (typeof keystrokeStats === 'string') {
        try {
          parsedStats = JSON.parse(keystrokeStats);
        } catch (e) {
          parsedStats = {};
        }
      }
      type = parsedStats.testType || h.test_type || null;
    }
    
    // Validate category - only use if it's in our valid categories list
    if (!type || !validCategories.includes(type)) {
      type = 'General';
    }
    
    cat[type] = (cat[type] || 0) + 1;
  });
  return Object.entries(cat).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
}
function getTypingRank(avgWpm: number) {
  if (avgWpm < 30) return 'Beginner';
  if (avgWpm < 60) return 'Intermediate';
  return 'Pro';
}

// Helper to filter history by duration and range
function filterHistory(history: any[], duration: string, range: string) {
  if (!history || history.length === 0) return [];
  
  let filtered = [...history];
  
  if (duration !== 'all') {
    filtered = filtered.filter(h => {
      const hDuration = h.duration || h.time || 0;
      return String(hDuration) === String(duration);
    });
  }
  
  if (range !== 'all') {
    const now = new Date();
    let cutoff = null;
    if (range === 'day') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (range === 'week') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    if (range === 'month') cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (range === '3months') cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    
    if (cutoff) {
      filtered = filtered.filter(h => {
        const dateStr = h.timestamp || h.created_at;
        if (!dateStr) return false;
        try {
          const testDate = new Date(dateStr);
          return testDate >= cutoff;
        } catch (e) {
          return false;
        }
      });
    }
  }
  
  return filtered;
}

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const { resetStats } = usePersonalization();
  const { state: gamificationState, setLeaderboard, setGamificationEnabled } = useGamification();
  const { refreshLeaderboard } = useLeaderboard();
  const { openOverlay } = useOverlay();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'advanced'>('overview');
  const [showDeleteProgress, setShowDeleteProgress] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('Speed Trends');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [theme]);

  const fetchResults = async () => {
    if (!user || !user.id) {
      setTestResults([]);
      setResultsLoading(false);
      return;
    }
      setResultsLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching test results:', error);
        setTestResults([]);
      } else if (data && data.length > 0) {
        const normalizedData = data.map((result: any) => {
          // Parse keystroke_stats if it's a string (JSONB from Supabase)
          let keystrokeStats: any = {};
          if (result.keystroke_stats) {
            if (typeof result.keystroke_stats === 'string') {
              try {
                keystrokeStats = JSON.parse(result.keystroke_stats);
              } catch (e) {
                // If JSON parsing fails, try to extract testType from string directly
                try {
                  const testTypeMatch = result.keystroke_stats.match(/"testType"\s*:\s*"([^"]+)"/);
                  if (testTypeMatch && testTypeMatch[1]) {
                    keystrokeStats = { testType: testTypeMatch[1] };
                  } else {
                    keystrokeStats = {};
                  }
                } catch (e2) {
                  keystrokeStats = {};
                }
              }
            } else {
              keystrokeStats = result.keystroke_stats;
            }
          }
          
          // Extract testType with improved logic
          let testType = null;
          
          // Try multiple sources in order of reliability
          if (keystrokeStats && keystrokeStats.testType) {
            testType = keystrokeStats.testType;
          } else if (result.test_type) {
            testType = result.test_type;
          } else if (result.testType) {
            testType = result.testType;
          }
          
          // Validate testType against valid categories
          const validCategories = [
            'Coding', 'Syntax Challenges', 'Custom', 'Words', 'Timed',
            'Essay Builder', 'Quotes', 'Zen Writing', 'No Timer',
            'Hard Words', 'Foreign Language Practice'
          ];
          
          if (testType && validCategories.includes(testType)) {
            // Valid category, use it
          } else if (testType) {
            // Invalid category, log for debugging
            console.warn('Invalid testType found:', testType, 'in result:', result.id);
            testType = 'General';
          } else {
            // No category found, default to General
            testType = 'General';
          }
          
          return {
            ...result,
            keystrokeStats: keystrokeStats,
            keystroke_stats: keystrokeStats, // Keep both formats for compatibility
            errorTypes: result.error_types || result.errorTypes || {},
            wordCount: result.word_count || result.wordCount || 0,
            testType: testType, // Always set a valid category
            timestamp: result.timestamp || result.created_at || new Date().toISOString(),
            duration: result.duration || (result.time || 0),
            wpm: result.wpm || 0,
            accuracy: result.accuracy || 0,
            errors: result.errors || 0,
            time: result.time || 0,
          };
        });
        // Debug: Log category distribution
        const categoryCounts: Record<string, number> = {};
        normalizedData.forEach((r: any) => {
          categoryCounts[r.testType] = (categoryCounts[r.testType] || 0) + 1;
        });
        console.log('Test results by category:', categoryCounts);
        console.log('Total test results:', normalizedData.length);
        
        setTestResults(normalizedData);
      } else {
        setTestResults([]);
      }
    } catch (err) {
      console.error('Exception fetching test results:', err);
      setTestResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [user?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchResults();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Helper functions - must be defined before useMemo hooks
  const hslToHex = (hsl: string): string => {
    try {
      let h = 0, s = 0, l = 0;
      
      // Handle hsl() format: "hsl(217, 91%, 60%)"
      if (hsl.includes('hsl(')) {
        const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/i);
        if (match) {
          h = parseFloat(match[1]);
          s = parseFloat(match[2]);
          l = parseFloat(match[3]);
        }
      } 
      // Handle space-separated format: "217 91% 60%"
      else {
        const match = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
        if (match) {
          h = parseFloat(match[1]);
          s = parseFloat(match[2]);
          l = parseFloat(match[3]);
        } else {
          // Try splitting by spaces and removing % signs
          const parts = hsl.trim().split(/\s+/);
          if (parts.length >= 3) {
            h = parseFloat(parts[0]);
            s = parseFloat(parts[1].replace('%', ''));
            l = parseFloat(parts[2].replace('%', ''));
          }
        }
      }
      
      // Validate values
      if (isNaN(h) || isNaN(s) || isNaN(l)) {
        return '#22d3ee'; // fallback
      }
      
      // Normalize values
      h = h % 360;
      s = Math.max(0, Math.min(100, s)) / 100;
      l = Math.max(0, Math.min(100, l)) / 100;
      
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
    } catch (error) {
      console.warn('Error converting HSL to hex:', hsl, error);
      return '#22d3ee'; // fallback
    }
  };

  const hexToRgba = (hex: string, alpha: number = 0.1) => {
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      const rgbMatch = hex.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
      }
    }
    return `rgba(34, 211, 238, ${alpha})`;
  };

  const getThemeColor = (varName: string, fallback: string = '#22d3ee') => {
    if (typeof window !== 'undefined') {
      try {
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
          // If it's HSL format (like "217 91% 60%" or "hsl(217, 91%, 60%)"), convert to hex
          if (value.match(/\d+\s+\d+%\s+\d+%/) || value.includes('hsl')) {
            const converted = hslToHex(value);
            // Return converted value (hslToHex handles fallback internally)
            if (converted && converted.startsWith('#')) {
              return converted;
            }
          }
          // If it's a valid hex-like string, return it
          if (/^[0-9A-Fa-f]{6}$/.test(value.replace(/#/g, ''))) {
            return value.startsWith('#') ? value : `#${value}`;
          }
        }
      } catch (error) {
        console.warn(`Error reading CSS variable ${varName}:`, error);
      }
    }
    return fallback;
  };
  
  // Theme colors - use state and useLayoutEffect to ensure CSS variables are read after theme is applied
  const [primaryColor, setPrimaryColor] = useState('#22d3ee');
  const [mutedColor, setMutedColor] = useState('#94a3b8');
  const [cardBg, setCardBg] = useState('#1e293b');
  const [foreground, setForeground] = useState('#f1f5f9');
  const [borderColor, setBorderColor] = useState('#475569');

  useLayoutEffect(() => {
    // Read CSS variables after theme is applied
    const updateColors = () => {
      setPrimaryColor(getThemeColor('--primary', '#22d3ee'));
      setMutedColor(getThemeColor('--muted-foreground', '#94a3b8'));
      setCardBg(getThemeColor('--card', '#1e293b'));
      setForeground(getThemeColor('--foreground', '#f1f5f9'));
      setBorderColor(getThemeColor('--border', '#475569'));
    };
    
    // Small delay to ensure CSS variables are updated by ThemeProvider
    const timeoutId = setTimeout(updateColors, 10);
    updateColors(); // Also call immediately
    
    return () => clearTimeout(timeoutId);
  }, [theme]);

  // Calculate derived data - safe to call even if user/testResults not available
  const history = testResults || [];
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    return filterHistory(history, selectedDuration, selectedRange);
  }, [history, selectedDuration, selectedRange]);

  const dataForCharts = useMemo(() => filteredHistory.length > 0 ? filteredHistory : history, [filteredHistory, history]);
  const chartLabels = useMemo(() => dataForCharts.map((h, i) => i + 1), [dataForCharts]);
  const wpmData = useMemo(() => dataForCharts.map(h => Math.max(0, h.wpm || 0)), [dataForCharts]);
  const accData = useMemo(() => dataForCharts.map(h => Math.max(0, Math.min(100, h.accuracy || 0))), [dataForCharts]);
  
  const chartData = useMemo(() => {
    if (!chartLabels.length || !wpmData.length || !accData.length) {
      return {
        labels: [],
        datasets: [
          { label: 'WPM', data: [], borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.15)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
          { label: 'Accuracy', data: [], borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.15)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
        ],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const validMutedColor = mutedColor && (mutedColor.startsWith('#') || mutedColor.startsWith('rgb')) ? mutedColor : '#94a3b8';
    const wpmFillColor = hexToRgba(validPrimaryColor, 0.15);
    const accFillColor = hexToRgba(validMutedColor, 0.15);
    
    return {
    labels: chartLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
          borderColor: validPrimaryColor,
          backgroundColor: wpmFillColor,
        fill: true,
        tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: validPrimaryColor,
          pointHoverBorderColor: validPrimaryColor,
          borderWidth: 2.5,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
      },
      {
        label: 'Accuracy',
        data: accData,
          borderColor: validMutedColor,
          backgroundColor: accFillColor,
        fill: true,
        tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: validMutedColor,
          pointHoverBorderColor: validMutedColor,
        borderWidth: 2,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
      },
    ],
  };
  }, [chartLabels, wpmData, accData, primaryColor, mutedColor]);

  const maxY = useMemo(() => {
    if (wpmData.length === 0 || accData.length === 0) return 100;
    const maxWpm = Math.max(...wpmData);
    const maxAcc = Math.max(...accData);
    return Math.max(100, Math.ceil(Math.max(maxWpm, maxAcc) * 1.1));
  }, [wpmData, accData]);

  const chartOptions = useMemo(() => {
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
        legend: { 
          display: true, 
          labels: { 
            color: validMutedColor, 
            font: { size: 12 },
            usePointStyle: true,
            padding: 12,
          } 
        },
        tooltip: { 
          enabled: true, 
          backgroundColor: validCardBg, 
          titleColor: validForeground, 
          bodyColor: validForeground, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
    },
    scales: {
        x: { 
          display: false, 
          grid: { display: false, color: 'transparent' }, 
          ticks: { color: validMutedColor } 
        },
      y: {
        display: true,
        min: 0,
        max: maxY,
          grid: { 
            color: gridColor,
            drawBorder: false,
            lineWidth: 1,
          },
          ticks: { 
            color: validMutedColor, 
            font: { size: 11 },
            padding: 8,
          },
          border: { display: false },
        },
      },
      interaction: { intersect: false, mode: 'index' as const },
      animation: { duration: 800, easing: 'easeOutQuart' as const },
    };
  }, [cardBg, borderColor, foreground, mutedColor, primaryColor, maxY]);

  const errorKeyStats: Record<string, number> = {};
  for (const session of filteredHistory) {
    const keystrokeStats = session.keystrokeStats || session.keystroke_stats;
    if (keystrokeStats && keystrokeStats.keyCounts) {
      let keyCounts = keystrokeStats.keyCounts;
      if (typeof keyCounts === 'string') {
        try {
          keyCounts = JSON.parse(keyCounts);
        } catch (e) {
          keyCounts = {};
        }
      }
      if (keyCounts && typeof keyCounts === 'object') {
        for (const [key, count] of Object.entries(keyCounts)) {
        errorKeyStats[key] = (errorKeyStats[key] || 0) + Number(count);
        }
      }
    }
  }

  const keyToFinger: Record<string, string> = {
    Q: 'Left Pinky', W: 'Left Ring', E: 'Left Middle', R: 'Left Index', T: 'Left Index',
    A: 'Left Pinky', S: 'Left Ring', D: 'Left Middle', F: 'Left Index', G: 'Left Index',
    Z: 'Left Pinky', X: 'Left Ring', C: 'Left Middle', V: 'Left Index', B: 'Left Index',
    Y: 'Right Index', U: 'Right Index', I: 'Right Middle', O: 'Right Ring', P: 'Right Pinky',
    H: 'Right Index', J: 'Right Index', K: 'Right Middle', L: 'Right Ring',
    N: 'Right Index', M: 'Right Index',
    '1': 'Left Pinky', '2': 'Left Ring', '3': 'Left Middle', '4': 'Left Index', '5': 'Left Index',
    '6': 'Right Index', '7': 'Right Index', '8': 'Right Middle', '9': 'Right Ring', '0': 'Right Pinky',
    '-': 'Right Pinky', '=': 'Right Pinky',
    '[': 'Right Pinky', ']': 'Right Pinky', '\\': 'Right Pinky',
    ';': 'Right Ring', "'": 'Right Pinky', ',': 'Right Middle', '.': 'Right Ring', '/': 'Right Pinky',
    '`': 'Left Pinky',
    ' ': 'Thumb',
  };
  const fingerOrder = [
    'Left Pinky', 'Left Ring', 'Left Middle', 'Left Index', 'Thumb', 'Right Index', 'Right Middle', 'Right Ring', 'Right Pinky'
  ];
  const fingerErrorStats: Record<string, number> = {};
  for (const [key, count] of Object.entries(errorKeyStats)) {
    const finger = keyToFinger[key] || 'Other';
    fingerErrorStats[finger] = (fingerErrorStats[finger] || 0) + count;
  }
  const sortedFingers = Object.entries(fingerErrorStats).sort((a, b) => b[1] - a[1]);
  const mostErrorFinger = sortedFingers[0]?.[0] || '';
  const leastErrorFinger = sortedFingers[sortedFingers.length - 1]?.[0] || '';
  const insights: string[] = [];
  if (mostErrorFinger && fingerErrorStats[mostErrorFinger] > 0) {
    insights.push(`You make the most errors with your ${mostErrorFinger}. Try targeted practice for this finger.`);
  }
  if (leastErrorFinger && fingerErrorStats[leastErrorFinger] > 0 && mostErrorFinger !== leastErrorFinger) {
    insights.push(`Your ${leastErrorFinger} is your most accurate finger. Great job!`);
  }
  const punctuationErrors = Object.keys(errorKeyStats).filter(k => /[.,;:'"!?\-()\[\]{}]/.test(k)).reduce((sum, k) => sum + errorKeyStats[k], 0);
  if (punctuationErrors > 0) {
    insights.push('Punctuation keys are a common source of errors. Consider practicing punctuation-heavy texts.');
  }

  const durations = [
    { label: '15s', value: '15' },
    { label: '30s', value: '30' },
    { label: '60s', value: '60' },
    { label: '120s', value: '120' },
    { label: 'All', value: 'all' },
  ];
  const ranges = [
    { label: 'Today', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: '3 Months', value: '3months' },
    { label: 'All Time', value: 'all' },
  ];

  const handleDownloadCertificate = async () => {
    if (!testResults || testResults.length === 0) {
      alert('You need to complete at least one typing test to download a certificate.');
      return;
    }
    if (!bestWpm || bestWpm === 0) {
      alert('You need to complete at least one typing test with valid results to download a certificate.');
      return;
    }
    const certArea = document.getElementById('certificate-download-area');
    if (!certArea) {
      alert('Certificate could not be generated. Please try again.');
      return;
    }
    try {
      // Wait a moment to ensure certificate is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get actual dimensions including all content
      const rect = certArea.getBoundingClientRect();
      
      // Optimized canvas settings for smaller file size and better quality
      const canvas = await html2canvas(certArea, { 
        scale: 1.2, // Reduced scale for smaller file
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });
      
      // Convert to JPEG with good compression (0.80 = 80% quality, good balance)
      const imgData = canvas.toDataURL('image/jpeg', 0.80);
      
      // Use A4 landscape dimensions (297mm x 210mm) - exact match
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      
      // Create optimized PDF with compression
      const pdf = new jsPDF({ 
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true
      });
      
      // Add image directly to fill PDF (certificate is already A4 sized)
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Save with optimized filename
      pdf.save(`TypingThrust-Certificate-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    }
  };

  async function handleDeleteProgress() {
    if (!user || !user.id) return;
    setDeleting(true);
    await resetStats();
    if (window.localStorage) {
      window.localStorage.setItem('tt_gamification', JSON.stringify({ xp: 0, level: 1, badges: [], streak: 0 }));
    }
    if (setLeaderboard) setLeaderboard([]);
    if (setGamificationEnabled) setGamificationEnabled(false);
    setTimeout(async () => {
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('test_results').delete().eq('user_id', user.id);
      await supabase.from('user_gamification').delete().eq('user_id', user.id);
      await supabase.from('leaderboard').delete().eq('user_id', user.id);
      if (refreshLeaderboard) await refreshLeaderboard();
      setDeleting(false);
      window.location.reload();
    }, 0);
  }

  async function handleDeleteAccount() {
    if (!user || !user.id) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error('Failed to delete account');
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('test_results').delete().eq('user_id', user.id);
      await supabase.from('user_gamification').delete().eq('user_id', user.id);
      setDeleting(false);
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleting(false);
      alert('Account deletion failed. Please try again or contact support.');
    }
  }

  const consistency = useMemo(() => {
    if (filteredHistory.length <= 1) return '-';
    const wpmValues = filteredHistory.map(h => h.wpm || 0);
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
    const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
    const stddev = Math.sqrt(variance);
    if (mean > 0) {
      return String(Math.max(0, Math.min(100, Math.round(100 - (stddev / mean) * 100))));
    }
    return '-';
  }, [filteredHistory]);

  const errorCharCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const session of filteredHistory) {
      const keystrokeStats = session.keystrokeStats || session.keystroke_stats;
      if (keystrokeStats && keystrokeStats.keyCounts) {
        let keyCounts = keystrokeStats.keyCounts;
        if (typeof keyCounts === 'string') {
          try {
            keyCounts = JSON.parse(keyCounts);
          } catch (e) {
            keyCounts = {};
          }
        }
        if (keyCounts && typeof keyCounts === 'object') {
          for (const [key, count] of Object.entries(keyCounts)) {
            counts[key] = (counts[key] || 0) + Number(count);
          }
        }
      }
    }
    return counts;
  }, [filteredHistory]);
  
  const sortedErrorEntries = useMemo(() => {
    return Object.entries(errorCharCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30);
  }, [errorCharCounts]);
  
  const errorCharLabels = useMemo(() => sortedErrorEntries.map(([key]) => key), [sortedErrorEntries]);
  const errorCharData = useMemo(() => sortedErrorEntries.map(([, count]) => count), [sortedErrorEntries]);
  
  const errorCharChartData = useMemo(() => {
    if (!errorCharLabels.length || !errorCharData.length) {
      return {
        labels: [],
        datasets: [{ label: 'Errors', data: [], backgroundColor: '#22d3ee', borderColor: '#22d3ee', borderWidth: 0, borderRadius: 8 }],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const maxValue = Math.max(...errorCharData);
    
    // Create gradient colors based on value (darker for higher values)
    const backgroundColors = errorCharData.map((value: number) => {
      const opacity = 0.6 + (value / maxValue) * 0.4; // Range from 0.6 to 1.0
      return hexToRgba(validPrimaryColor, opacity);
    });
    
    return {
      labels: errorCharLabels,
      datasets: [
        {
          label: 'Errors',
          data: errorCharData,
          backgroundColor: backgroundColors,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex' as const,
          maxBarThickness: 40,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    };
  }, [errorCharLabels, errorCharData, primaryColor]);

  const errorCharChartOptions = useMemo(() => {
    const validCardBg = cardBg && (cardBg.startsWith('#') || cardBg.startsWith('rgb')) ? cardBg : '#1e293b';
    const validBorderColor = borderColor && (borderColor.startsWith('#') || borderColor.startsWith('rgb')) ? borderColor : '#475569';
    const validForeground = foreground && (foreground.startsWith('#') || foreground.startsWith('rgb')) ? foreground : '#f1f5f9';
    const validMutedColor = mutedColor && (mutedColor.startsWith('#') || mutedColor.startsWith('rgb')) ? mutedColor : '#94a3b8';
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const gridColor = hexToRgba(validBorderColor, 0.1);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 5,
          right: 5,
        }
      },
      plugins: { 
        legend: { display: false }, 
        tooltip: { 
          enabled: true, 
          backgroundColor: validCardBg, 
          titleColor: validForeground, 
          bodyColor: validForeground, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5,
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 13, weight: 'normal' as const },
          callbacks: {
            label: (context: any) => {
              return `${context.parsed.y} error${context.parsed.y !== 1 ? 's' : ''}`;
            },
            title: (context: any) => {
              return `Key: "${context[0].label}"`;
            }
          }
        } 
      },
      scales: { 
        x: { 
          grid: { 
            color: gridColor, 
            display: true,
            drawBorder: false,
            lineWidth: 1,
          }, 
          ticks: { 
            color: validMutedColor,
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 0,
            padding: 8,
          },
          border: { display: false },
        }, 
        y: { 
          grid: { 
            color: gridColor, 
            display: true,
            drawBorder: false,
            lineWidth: 1,
          }, 
          ticks: { 
            color: validMutedColor,
            font: { size: 11 },
            stepSize: 1,
            padding: 10,
          },
          beginAtZero: true,
          border: { display: false },
        } 
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const,
      },
    };
  }, [cardBg, borderColor, foreground, mutedColor, primaryColor]);

  const sessionTimes = useMemo(() => {
    // Use duration (test setting) if available, otherwise use time (actual time taken)
    // Duration shows the test setting (15s, 30s, 60s, 120s), time shows actual completion time
    return filteredHistory.map(h => {
      // Prefer duration (test setting) over time (actual completion time) for Time Insights
      const timeValue = h.duration || h.time || 0;
      const numValue = Math.max(0, Number(timeValue));
      return numValue;
    });
  }, [filteredHistory]);
  
  const sessionTimeLabels = useMemo(() => filteredHistory.map((h, i) => `Test ${i + 1}`), [filteredHistory]);
  
  // Calculate max Y value with proper padding to prevent flat lines at top
  const sessionTimeMax = useMemo(() => {
    if (sessionTimes.length === 0) return 100;
    const validTimes = sessionTimes.filter(t => t > 0);
    if (validTimes.length === 0) return 100;
    const maxValue = Math.max(...validTimes);
    // Add 20% padding above max value and round to nearest 5 for cleaner scale
    const paddedMax = Math.ceil(maxValue * 1.2 / 5) * 5;
    return Math.max(100, paddedMax); // Minimum 100 for visibility
  }, [sessionTimes]);
  
  const sessionTimeChartData = useMemo(() => {
    if (!sessionTimeLabels.length || !sessionTimes.length) {
      return {
        labels: [],
        datasets: [{ label: 'Time (s)', data: [], fill: true, backgroundColor: 'rgba(34, 211, 238, 0.15)', borderColor: '#22d3ee', tension: 0, borderWidth: 2.5 }],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const fillColor = hexToRgba(validPrimaryColor, 0.15);
    
    // Use smooth curve interpolation for proper curve rendering
    return {
    labels: sessionTimeLabels,
    datasets: [
      {
        label: 'Time (s)',
        data: sessionTimes,
        fill: true,
          backgroundColor: fillColor,
          borderColor: validPrimaryColor,
          pointBackgroundColor: validPrimaryColor,
          pointBorderColor: validPrimaryColor,
          pointRadius: 0, // Hide points for cleaner look
          pointHoverRadius: 5,
          pointHoverBackgroundColor: validPrimaryColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        tension: 0.4, // Smooth curve interpolation
          borderWidth: 2.5,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
          stepped: false, // Ensure smooth curves, not stepped
          spanGaps: false, // Don't connect across gaps
          cubicInterpolationMode: 'monotone' as const, // Monotone interpolation prevents flat segments and overshooting
      },
    ],
  };
  }, [sessionTimeLabels, sessionTimes, primaryColor]);

  const sessionTimeChartOptions = useMemo(() => {
    const validCardBg = cardBg && (cardBg.startsWith('#') || cardBg.startsWith('rgb')) ? cardBg : '#1e293b';
    const validBorderColor = borderColor && (borderColor.startsWith('#') || borderColor.startsWith('rgb')) ? borderColor : '#475569';
    const validForeground = foreground && (foreground.startsWith('#') || foreground.startsWith('rgb')) ? foreground : '#f1f5f9';
    const validMutedColor = mutedColor && (mutedColor.startsWith('#') || mutedColor.startsWith('rgb')) ? mutedColor : '#94a3b8';
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const gridColor = hexToRgba(validBorderColor, 0.15);
    
    // Calculate step size based on max value for clean Y-axis labels
    const stepSize = sessionTimeMax <= 60 ? 10 : sessionTimeMax <= 120 ? 20 : Math.ceil(sessionTimeMax / 6);
    
    return {
    responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        tooltip: { 
          enabled: true, 
          backgroundColor: validCardBg, 
          titleColor: validForeground, 
          bodyColor: validForeground, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5,
          padding: 12,
          cornerRadius: 8,
        } 
      },
      scales: { 
        x: { 
          grid: { color: gridColor, display: false }, 
          ticks: { color: validMutedColor, font: { size: 10 } },
          border: { display: false },
        }, 
        y: { 
          grid: { color: gridColor, drawBorder: false }, 
          ticks: { 
            color: validMutedColor, 
            font: { size: 10 }, 
            padding: 8,
            stepSize: stepSize,
            maxTicksLimit: 8,
            precision: 0, // No decimal places for time
          }, 
          beginAtZero: true,
          max: sessionTimeMax, // Set explicit max to prevent flat lines
          suggestedMax: sessionTimeMax, // Suggest max for better scaling
          border: { display: false },
        } 
      },
      interaction: { intersect: false, mode: 'index' as const },
      animation: { duration: 800, easing: 'easeOutQuart' as const },
    };
  }, [cardBg, borderColor, foreground, mutedColor, primaryColor, sessionTimeMax]);

  const wpmVarianceLabels = useMemo(() => filteredHistory.map((h, i) => i + 1), [filteredHistory]);
  const wpmVarianceData = useMemo(() => filteredHistory.map(h => h.wpm || 0), [filteredHistory]);
  const wpmVarianceChartData = useMemo(() => {
    if (!wpmVarianceLabels.length || !wpmVarianceData.length) {
      return {
        labels: [],
        datasets: [{ label: 'WPM', data: [], borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.15)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5 }],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const fillColor = hexToRgba(validPrimaryColor, 0.15);
    return {
    labels: wpmVarianceLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmVarianceData,
          borderColor: validPrimaryColor,
          backgroundColor: fillColor,
        fill: true,
        tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: validPrimaryColor,
          pointHoverBorderColor: validPrimaryColor,
          borderWidth: 2.5,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
      },
    ],
  };
  }, [wpmVarianceLabels, wpmVarianceData, primaryColor]);

  const wpmVarianceChartOptions = useMemo(() => {
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
          titleColor: validForeground, 
          bodyColor: validForeground, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5,
          padding: 12,
          cornerRadius: 8,
        } 
      },
      scales: { 
        x: { 
          grid: { color: gridColor, display: false }, 
          ticks: { color: validMutedColor, font: { size: 10 } },
          border: { display: false },
        }, 
        y: { 
          grid: { color: gridColor, drawBorder: false }, 
          ticks: { color: validMutedColor, font: { size: 10 }, padding: 8 }, 
          beginAtZero: true,
          border: { display: false },
        } 
      },
      interaction: { intersect: false, mode: 'index' as const },
      animation: { duration: 800, easing: 'easeOutQuart' as const },
    };
  }, [cardBg, borderColor, foreground, mutedColor, primaryColor]);

  // Map of actual categories that exist in the app
  const validCategories = [
    'Coding',
    'Syntax Challenges',
    'Custom',
    'Words',
    'Timed',
    'Essay Builder',
    'Quotes',
    'Zen Writing',
    'No Timer',
    'Hard Words',
    'Foreign Language Practice',
  ];

  const categoryStats = useMemo(() => {
    const stats: Record<string, { wpm: number[] }> = {};
    for (const h of filteredHistory) {
      // Try multiple sources for category with improved extraction
      let cat: string | null = null;
      
      // 1. First try: testType from normalized data (most reliable)
      if (h.testType && typeof h.testType === 'string' && h.testType !== 'General') {
        cat = h.testType;
      }
      
      // 2. Second try: Extract from keystroke_stats
      if (!cat) {
        const keystrokeStats = h.keystroke_stats || h.keystrokeStats || {};
        let parsedStats = keystrokeStats;
        
        // Handle string format (JSONB from Supabase)
        if (typeof keystrokeStats === 'string') {
          try {
            parsedStats = JSON.parse(keystrokeStats);
          } catch (e) {
            // If parsing fails, try to extract testType directly from string
            try {
              const match = keystrokeStats.match(/"testType"\s*:\s*"([^"]+)"/);
              if (match && match[1]) {
                cat = match[1];
              }
            } catch (e2) {
              parsedStats = {};
            }
          }
        }
        
        // Extract testType from parsed stats
        if (!cat && parsedStats && typeof parsedStats === 'object') {
          cat = parsedStats.testType || parsedStats.test_type || null;
        }
      }
      
      // 3. Third try: Check other possible fields
      if (!cat) {
        cat = h.test_type || h.testType || null;
      }
      
      // 4. Validate and normalize category name
      if (cat) {
        // Normalize common variations
        const normalizedCat = cat.trim();
        if (validCategories.includes(normalizedCat)) {
          cat = normalizedCat;
        } else {
          // Try case-insensitive match
          const found = validCategories.find(c => c.toLowerCase() === normalizedCat.toLowerCase());
          if (found) {
            cat = found;
          } else {
            cat = null; // Invalid category, will default to General
          }
        }
      }
      
      // 5. Default to General only if no valid category found
      if (!cat || !validCategories.includes(cat)) {
        cat = 'General';
      }
      
      // Initialize category if it doesn't exist
      if (!stats[cat]) {
        stats[cat] = { wpm: [] };
      }
      
      // Add WPM to category stats
      if (h.wpm && typeof h.wpm === 'number' && h.wpm > 0) {
        stats[cat].wpm.push(h.wpm);
      }
    }
    
    // Debug: Log category distribution
    if (Object.keys(stats).length > 0) {
      console.log('Category breakdown:', Object.keys(stats).map(cat => ({
        category: cat,
        count: stats[cat].wpm.length,
        avgWpm: Math.round(stats[cat].wpm.reduce((a, b) => a + b, 0) / stats[cat].wpm.length)
      })));
    }
    
    return stats;
  }, [filteredHistory]);

  const categoryLabels = useMemo(() => Object.keys(categoryStats), [categoryStats]);
  const categoryWpmData = useMemo(() => {
    return categoryLabels.map(cat => {
      const arr = categoryStats[cat].wpm;
      return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    });
  }, [categoryLabels, categoryStats]);

  const categoryChartData = useMemo(() => {
    if (!categoryLabels.length || !categoryWpmData.length) {
      return {
        labels: [],
        datasets: [{ label: 'Avg WPM', data: [], backgroundColor: '#22d3ee', borderColor: 'transparent', borderWidth: 0, borderRadius: 8 }],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const maxValue = Math.max(...categoryWpmData);
    
    // Create gradient colors based on value (darker for higher values)
    const backgroundColors = categoryWpmData.map((value: number) => {
      const opacity = 0.6 + (value / maxValue) * 0.4; // Range from 0.6 to 1.0
      return hexToRgba(validPrimaryColor, opacity);
    });
    
    return {
      labels: categoryLabels,
      datasets: [
        {
          label: 'Avg WPM',
          data: categoryWpmData,
          backgroundColor: backgroundColors,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex' as const,
          maxBarThickness: 50,
          categoryPercentage: 0.7,
          barPercentage: 0.85,
        },
      ],
    };
  }, [categoryLabels, categoryWpmData, primaryColor]);

  const categoryChartOptions = useMemo(() => {
    const validCardBg = cardBg && (cardBg.startsWith('#') || cardBg.startsWith('rgb')) ? cardBg : '#1e293b';
    const validBorderColor = borderColor && (borderColor.startsWith('#') || borderColor.startsWith('rgb')) ? borderColor : '#475569';
    const validForeground = foreground && (foreground.startsWith('#') || foreground.startsWith('rgb')) ? foreground : '#f1f5f9';
    const validMutedColor = mutedColor && (mutedColor.startsWith('#') || mutedColor.startsWith('rgb')) ? mutedColor : '#94a3b8';
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    const gridColor = hexToRgba(validBorderColor, 0.1);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 5,
          right: 5,
        }
      },
      plugins: { 
        legend: { display: false }, 
        tooltip: { 
          enabled: true, 
          backgroundColor: validCardBg, 
          titleColor: validForeground, 
          bodyColor: validForeground, 
          borderColor: validPrimaryColor, 
          borderWidth: 1.5,
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 13, weight: 'normal' as const },
          callbacks: {
            label: (context: any) => {
              return `Average: ${context.parsed.y} WPM`;
            },
            title: (context: any) => {
              return context[0].label;
            }
          }
        } 
      },
      scales: { 
        x: { 
          grid: { 
            color: gridColor, 
            display: true,
            drawBorder: false,
            lineWidth: 1,
          }, 
          ticks: { 
            color: validMutedColor, 
            font: { size: 11 },
            padding: 8,
          },
          border: { display: false },
        }, 
        y: { 
          grid: { 
            color: gridColor, 
            drawBorder: false,
            lineWidth: 1,
          }, 
          ticks: { 
            color: validMutedColor, 
            font: { size: 11 }, 
            padding: 10,
          }, 
          beginAtZero: true,
          border: { display: false },
        } 
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const,
      },
    };
  }, [cardBg, borderColor, foreground, mutedColor, primaryColor]);

  const keyCharCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (filteredHistory.length > 0) {
      for (const session of filteredHistory) {
        const keystrokeStats = session.keystrokeStats || session.keystroke_stats;
        if (keystrokeStats && keystrokeStats.keyCounts) {
          let keyCounts = keystrokeStats.keyCounts;
          if (typeof keyCounts === 'string') {
            try {
              keyCounts = JSON.parse(keyCounts);
            } catch (e) {
              keyCounts = {};
            }
          }
          if (keyCounts && typeof keyCounts === 'object') {
            for (const [key, count] of Object.entries(keyCounts)) {
              counts[key] = (counts[key] || 0) + Number(count);
            }
          }
        }
      }
    }
    return counts;
  }, [filteredHistory]);

  const keyCharLabels = useMemo(() => Object.keys(keyCharCounts), [keyCharCounts]);
  const keyCharData = useMemo(() => Object.values(keyCharCounts), [keyCharCounts]);
  const keyCharChartData = useMemo(() => {
    if (!keyCharLabels.length || !keyCharData.length) {
      return {
        labels: [],
        datasets: [{ label: 'Key Presses', data: [], backgroundColor: '#22d3ee', borderColor: '#22d3ee', borderWidth: 1, borderRadius: 4 }],
      };
    }
    const validPrimaryColor = primaryColor && (primaryColor.startsWith('#') || primaryColor.startsWith('rgb')) ? primaryColor : '#22d3ee';
    return {
    labels: keyCharLabels,
    datasets: [
      {
        label: 'Key Presses',
        data: keyCharData,
          backgroundColor: validPrimaryColor,
          borderColor: validPrimaryColor,
        borderWidth: 1,
          borderRadius: 4,
      },
    ],
  };
  }, [keyCharLabels, keyCharData, primaryColor]);

  // Calculate stats needed by functions - must be before early returns
  const bestWpm = useMemo(() => getBestWpm(filteredHistory), [filteredHistory]);
  const bestAccuracy = useMemo(() => getBestAccuracy(filteredHistory), [filteredHistory]);
  const avgWpm = useMemo(() => getAvgWpm(filteredHistory), [filteredHistory]);
  const level = useMemo(() => gamificationState.level, [gamificationState.level]);
  const xp = useMemo(() => gamificationState.xp, [gamificationState.xp]);
  const progress = useMemo(() => Math.min(100, Math.round((xp % 100))), [xp]);
  const streak = useMemo(() => gamificationState.streak, [gamificationState.streak]);
  const badges = useMemo(() => gamificationState.badges, [gamificationState.badges]);
  const totalTime = useMemo(() => filteredHistory.reduce((sum: number, h: any) => sum + (h.time || 0), 0), [filteredHistory]);
  const totalWords = useMemo(() => filteredHistory.reduce((sum: number, h: any) => {
    if (h.wordCount) return sum + h.wordCount;
    if (h.userInput) return sum + Math.round(h.userInput.length / 5);
    return sum;
  }, 0), [filteredHistory]);
  const mostActiveDay = useMemo(() => filteredHistory.length > 0 ? getMostActiveDay(filteredHistory) : 'N/A', [filteredHistory]);
  const topCategory = useMemo(() => getTopCategory(filteredHistory), [filteredHistory]);
  const typingRank = useMemo(() => getTypingRank(avgWpm), [avgWpm]);
  const testsStarted = useMemo(() => history.length, [history.length]);
  const testsCompleted = useMemo(() => filteredHistory.length, [filteredHistory.length]);
  const totalWordsTyped = useMemo(() => totalWords, [totalWords]);
  const totalTimeTyping = useMemo(() => totalTime, [totalTime]);

  // Final safety check - should never happen due to early returns, but just in case
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-xl shadow-md text-center border border-border">
          <h2 className="text-2xl font-bold mb-4 text-foreground">No Account Found</h2>
          <p className="mb-6 text-muted-foreground">Please log in to access your profile and analytics.</p>
          <button
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            onClick={() => openOverlay('auth')}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pt-8 pb-4 sm:pt-6 sm:pb-6">
        {/* Minimal Header - No Boxes */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 mb-6">
            {/* User Info - Clean & Minimal */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user?.avatar_url || user?.user_metadata?.avatar_url} 
                    alt="avatar" 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg sm:text-xl font-semibold text-primary flex-shrink-0">
                    {(user?.username || user?.user_metadata?.username) ? (user?.username || user?.user_metadata?.username)?.[0]?.toUpperCase() : (user?.email ? user?.email[0]?.toUpperCase() : '?')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {(user?.username || user?.user_metadata?.username) || (user?.email ? user.email.split('@')[0] : 'User')}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap mt-1">
                    <span className="text-xs text-muted-foreground">Level {level}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{xp} XP</span>
                    {badges && badges.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-primary">{badges.length} badges</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Minimal */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    (!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0)
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  Cert
                </button>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Out
                </button>
              </div>
            </div>

            {/* Progress Bar - Minimal */}
            <div className="w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Level {level} → {level + 1}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Key Stats - Minimal Horizontal Layout */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Best</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{bestWpm || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Acc</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{bestAccuracy || 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Avg</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{avgWpm || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Days</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{streak}</div>
            </div>
          </div>
        </div>

        {/* Minimal Filters - Single Row */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Duration:</span>
            {durations.map(d => (
              <button
                key={d.value}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  selectedDuration === d.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setSelectedDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className="text-xs text-muted-foreground">Range:</span>
            {ranges.map(r => (
              <button
                key={r.value}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  selectedRange === r.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setSelectedRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Tabs */}
        <div className="mb-4 border-b border-border/30">
          <div className="flex gap-0">
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'advanced'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedTab('advanced')}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* Progress Chart - Minimal */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Progress Over Time</h2>
              <div className="h-64 sm:h-72 rounded-lg bg-background/30 p-2">
                {filteredHistory.length > 1 ? (
                  <Line key={chartKey} data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Complete more tests to see your progress
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats - Minimal Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Tests</div>
                <div className="text-base font-bold text-foreground">{testsCompleted}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Time</div>
                <div className="text-base font-bold text-foreground">{formatTime(totalTimeTyping)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Words</div>
                <div className="text-base font-bold text-foreground">{totalWordsTyped > 1000 ? `${(totalWordsTyped/1000).toFixed(1)}k` : totalWordsTyped}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Rank</div>
                <div className="text-base font-bold text-foreground">{typingRank}</div>
              </div>
              <div className="text-center hidden sm:block">
                <div className="text-xs text-muted-foreground mb-1">Day</div>
                <div className="text-base font-bold text-foreground truncate text-xs">{mostActiveDay}</div>
              </div>
              <div className="text-center hidden sm:block">
                <div className="text-xs text-muted-foreground mb-1">Category</div>
                <div className="text-base font-bold text-foreground truncate text-xs">{topCategory}</div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'advanced' && (
          <div className="space-y-4">
            {/* Advanced Analytics Sub-tabs - Minimal */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {['Speed Trends', 'Accuracy', 'Time Insights', 'Consistency', 'Category Breakdown'].map(tab => (
                <button
                  key={tab}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeAnalyticsTab === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveAnalyticsTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Advanced Analytics Content - Minimal */}
            <div>
              {activeAnalyticsTab === 'Speed Trends' && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Speed Trends</h2>
                  <div className="h-64 sm:h-72 w-full rounded-lg bg-background/30 p-2">
                    {history.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No tests completed yet
                      </div>
                    ) : dataForCharts.length > 1 ? (
                      <Line key={chartKey} data={chartData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Complete more tests to see trends
                      </div>
                    )}
                  </div>
                  </div>
              )}

              {activeAnalyticsTab === 'Accuracy' && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Error Distribution by Key</h2>
                  <div className="h-64 sm:h-72 w-full rounded-lg bg-background/30 p-2">
                    {history.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No tests completed yet
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No tests in selected range
                      </div>
                    ) : errorCharLabels.length > 0 && errorCharData.length > 0 ? (
                      <Bar key={chartKey} data={errorCharChartData} options={errorCharChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No error data available
                      </div>
                    )}
                  </div>
                </div>
                  )}

              {activeAnalyticsTab === 'Time Insights' && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Time Insights</h2>
                  <div className="h-64 sm:h-72 w-full rounded-lg bg-background/30 p-2">
                    {sessionTimes.length > 0 ? (
                      <Line key={chartKey} data={sessionTimeChartData} options={sessionTimeChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No session time data
                      </div>
                    )}
                  </div>
                </div>
                  )}

              {activeAnalyticsTab === 'Consistency' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground">Consistency</h2>
                    <div className="text-sm font-semibold text-primary">
                      {consistency === '-' ? '-' : `${consistency}%`}
                    </div>
                  </div>
                  <div className="h-64 sm:h-72 w-full rounded-lg bg-background/30 p-2">
                    {wpmVarianceData.length > 1 ? (
                      <Line key={chartKey} data={wpmVarianceChartData} options={wpmVarianceChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Not enough data
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeAnalyticsTab === 'Category Breakdown' && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h2>
                  <div className="h-64 sm:h-72 w-full mb-3 rounded-lg bg-background/30 p-2">
                    {categoryLabels.length > 0 ? (
                      <Bar key={chartKey} data={categoryChartData} options={categoryChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No category data
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categoryLabels.map((cat, i) => (
                      <div key={cat} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1 truncate">{cat}</div>
                        <div className="text-sm font-bold text-primary">{categoryWpmData[i]} WPM</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Minimal Bottom */}
        <div className="mt-6 pt-4 border-t border-border/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Account management</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteProgress(true)}
                className="px-2.5 py-1 rounded text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete Progress
              </button>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="px-2.5 py-1 rounded text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog open={showDeleteProgress} onOpenChange={setShowDeleteProgress}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete All Progress?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete all your analytics, stats, and test history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="bg-muted text-foreground border-border hover:bg-muted/80">Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={handleDeleteProgress} className="bg-red-600 hover:bg-red-700 text-white">
                Delete Progress
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete your account and all analytics. This cannot be undone. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="bg-muted text-foreground border-border hover:bg-muted/80">Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden Certificate */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <Certificate name={(user?.username || user?.user_metadata?.username) || user?.email || 'User'} wpm={bestWpm} accuracy={bestAccuracy} date={new Date().toLocaleDateString()} email={user?.email || ''} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

