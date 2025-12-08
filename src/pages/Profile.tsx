import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { usePersonalization } from '../components/PersonalizationProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Keyboard, Bell, User as UserIcon, Award, Users, BookOpen, Rocket } from 'lucide-react';
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
function getAvgTestDuration(history: any[]) {
  if (!history.length) return 0;
  const total = history.reduce((sum: number, h: any) => sum + (h.time || 0), 0);
  return Math.round(total / history.length);
}
function getTotalWords(history: any[]) {
  return history.reduce((sum: number, h: any) => sum + (h.wordCount || 0), 0);
}
function getTopCategory(history: any[]) {
  const cat: Record<string, number> = {};
  history.forEach((h: any) => {
    // Check both direct property and keystroke_stats for testType
    const type = h.testType || (h.keystroke_stats?.testType) || 'General';
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
  let filtered = [...history];
  // Filter by duration (test length)
  if (duration !== 'all') {
    filtered = filtered.filter(h => String(h.duration) === String(duration));
  }
  // Filter by range (date)
  if (range !== 'all') {
    const now = new Date();
    let cutoff = null;
    if (range === 'day') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (range === 'week') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    if (range === 'month') cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (range === '3months') cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    if (cutoff) {
      filtered = filtered.filter(h => h.timestamp && new Date(h.timestamp) >= cutoff);
    }
  }
  return filtered;
}

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const { resetStats } = usePersonalization();
  const { state: gamificationState, setLeaderboard, setGamificationEnabled } = useGamification();
  const { refreshLeaderboard } = useLeaderboard();
  const navigate = useNavigate();
  // Filter state
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  // Tab state for analytics
  const [selectedTab, setSelectedTab] = useState<'overview' | 'advanced'>('overview');
  // Dialog state
  const [showDeleteProgress, setShowDeleteProgress] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Add state for advanced analytics tab
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('Speed Trends');
  // --- New: State for real per-test results ---
  const [testResults, setTestResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  // Fetch all per-test results from Supabase on mount/user change
  useEffect(() => {
    async function fetchResults() {
      if (!user || !user.id) return;
      setResultsLoading(true);
      const { data, error } = await supabase.from('test_results').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (!error && data) {
        // Normalize snake_case to camelCase for consistency
        const normalizedData = data.map((result: any) => ({
          ...result,
          keystrokeStats: result.keystroke_stats || result.keystrokeStats,
          errorTypes: result.error_types || result.errorTypes,
          wordCount: result.word_count || result.wordCount,
          testType: result.test_type || result.testType || (result.keystroke_stats?.testType) || (result.keystrokeStats?.testType),
        }));
        setTestResults(normalizedData);
      } else {
        setTestResults([]);
      }
      setResultsLoading(false);
    }
    if (user && user.id) fetchResults();
  }, [user && user.id]);

  // Redirect to home if not authenticated, but only after loading is complete
  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Prevent profile data flash for non-logged-in users
  if (loading) return null; // or a spinner if you prefer
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Account Found</h2>
          <p className="mb-6 text-gray-600">Please log in to access your profile and analytics.</p>
          <button
            className="bg-black text-white px-6 py-2 rounded font-semibold hover:bg-gray-800 transition"
            onClick={() => {
              // Try to open login modal if overlay system is available
              if (window.openOverlay) window.openOverlay('auth');
              else window.location.href = '/';
            }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Use testResults as the only source for analytics
  const history = testResults;
  // --- Use gamification state for level, XP, progress, streak, badges ---
  const level = gamificationState.level;
  const xp = gamificationState.xp;
  const progress = Math.min(100, Math.round((xp % 100)));
  const streak = gamificationState.streak;
  const badges = gamificationState.badges;
  // Restore filteredHistory for analytics and charts
  const filteredHistory = filterHistory(history, selectedDuration, selectedRange);
  // --- Use gamification state for level, XP, progress, streak, badges ---
  const bestWpm = getBestWpm(filteredHistory);
  const bestAccuracy = getBestAccuracy(filteredHistory);
  const avgWpm = getAvgTestDuration(filteredHistory);
  const totalTime = filteredHistory.reduce((sum: number, h: any) => sum + (h.time || 0), 0);
  const totalWords = filteredHistory.reduce((sum: number, h: any) => {
    if (h.wordCount) return sum + h.wordCount;
    if (h.userInput) return sum + Math.round(h.userInput.length / 5);
    return sum;
  }, 0);
  const mostActiveDay = filteredHistory.length > 0 ? getMostActiveDay(filteredHistory) : 'N/A';
  const topCategory = getTopCategory(filteredHistory);
  const typingRank = getTypingRank(avgWpm);
  // Robust stats for overview
  const testsStarted = history.length;
  const testsCompleted = filteredHistory.length;
  const totalWordsTyped = totalWords;
  const totalTimeTyping = totalTime;

  // Chart data for WPM/accuracy over time (filtered)
  const chartLabels = filteredHistory.map((h, i) => i + 1);
  const wpmData = filteredHistory.map(h => h.wpm || 0);
  const accData = filteredHistory.map(h => h.accuracy || 0);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#111',
        backgroundColor: 'rgba(34,34,34,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#333',
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#bbb',
        backgroundColor: 'rgba(180,180,180,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#bbb',
        borderWidth: 2,
      },
    ],
  };
  // Calculate max for Y axis with 10% headroom
  const maxY = Math.max(100, Math.ceil(Math.max(...wpmData, ...accData) * 1.1));
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#222', font: { size: 14 } } },
      tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff' },
    },
    scales: {
      x: { display: false, grid: { color: '#eee' }, ticks: { color: '#bbb' } },
      y: {
        display: true,
        min: 0,
        max: maxY,
        grid: { color: '#eee' },
        ticks: { color: '#bbb', font: { size: 12 } },
      },
    },
    elements: { line: { borderWidth: 2 }, point: { backgroundColor: '#333' } },
  };

  // --- Error Heatmap Aggregation ---
  // Aggregate key error counts from all filtered history
  const errorKeyStats: Record<string, number> = {};
  for (const session of filteredHistory) {
    // Handle both camelCase (from frontend) and snake_case (from Supabase)
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

  // QWERTY finger mapping (copy from Index.tsx)
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
  // Aggregate per-finger error data
  const fingerErrorStats: Record<string, number> = {};
  for (const [key, count] of Object.entries(errorKeyStats)) {
    const finger = keyToFinger[key] || 'Other';
    fingerErrorStats[finger] = (fingerErrorStats[finger] || 0) + count;
  }
  // Find most/least error finger
  const sortedFingers = Object.entries(fingerErrorStats).sort((a, b) => b[1] - a[1]);
  const mostErrorFinger = sortedFingers[0]?.[0] || '';
  const leastErrorFinger = sortedFingers[sortedFingers.length - 1]?.[0] || '';
  // Actionable insights
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

  // Filter button configs
  const durations = [
    { label: '15s', value: '15' },
    { label: '30s', value: '30' },
    { label: '60s', value: '60' },
    { label: '120s', value: '120' },
    { label: 'all', value: 'all' },
  ];
  const ranges = [
    { label: 'Last Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: '3 Months', value: '3months' },
    { label: 'All Time', value: 'all' },
  ];

  // Download certificate handler
  const handleDownloadCertificate = async () => {
    // Check if user has test data
    if (!testResults || testResults.length === 0) {
      alert('You need to complete at least one typing test to download a certificate.');
      return;
    }
    
    // Check if we have valid WPM and accuracy data
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
      const canvas = await html2canvas(certArea, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [600, 400] });
      pdf.addImage(imgData, 'PNG', 0, 0, 600, 400);
      pdf.save(`TypingThrust-Certificate-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    }
  };

  // Delete Progress handler
  async function handleDeleteProgress() {
    if (!user) return;
    setDeleting(true);
    // --- Immediately reset all frontend state ---
    await resetStats();
    if (window.localStorage) {
      window.localStorage.setItem('tt_gamification', JSON.stringify({ xp: 0, level: 1, badges: [], streak: 0 }));
    }
    if (setLeaderboard) setLeaderboard([]);
    if (setGamificationEnabled) setGamificationEnabled(false);
    // Show a blank state/loading spinner while backend deletes
    setTimeout(async () => {
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('test_results').delete().eq('user_id', user.id);
      await supabase.from('user_gamification').delete().eq('user_id', user.id);
      // Delete ALL leaderboard rows for this user (all timeframes)
      await supabase.from('leaderboard').delete().eq('user_id', user.id);
      if (refreshLeaderboard) await refreshLeaderboard();
      setDeleting(false);
      window.location.reload();
    }, 0);
  }

  // Delete Account handler
  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    // TODO: Call backend to delete Supabase account if needed
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error('Failed to delete account');
      // Delete analytics after account deletion
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('test_results').delete().eq('user_id', user.id);
      await supabase.from('user_gamification').delete().eq('user_id', user.id);
      setDeleting(false);
      // Log out and redirect
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleting(false);
      alert('Account deletion failed. Please try again or contact support.');
    }
  }

  // Consistency Score: 100 - (stddev of WPM / mean WPM) * 100, clamped 0-100
  let consistency = '-';
  if (filteredHistory.length > 1) {
    const wpmValues = filteredHistory.map(h => h.wpm || 0);
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
    const variance = wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmValues.length;
    const stddev = Math.sqrt(variance);
    if (mean > 0) {
      consistency = String(Math.max(0, Math.min(100, Math.round(100 - (stddev / mean) * 100))));
    }
  }

  // --- Advanced Analytics Tab Content ---
  // Helper: Error distribution by character
  const errorCharCounts: Record<string, number> = {};
  for (const session of filteredHistory) {
    // Handle both camelCase (from frontend) and snake_case (from Supabase)
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
          errorCharCounts[key] = (errorCharCounts[key] || 0) + Number(count);
        }
      }
    }
  }
  const errorCharLabels = Object.keys(errorCharCounts);
  const errorCharData = Object.values(errorCharCounts);
  const errorCharChartData = {
    labels: errorCharLabels,
    datasets: [
      {
        label: 'Errors',
        data: errorCharData,
        backgroundColor: '#bbb',
        borderColor: '#111',
        borderWidth: 1,
      },
    ],
  };
  const errorCharChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff' } },
    scales: { x: { grid: { color: '#eee' }, ticks: { color: '#bbb' } }, y: { grid: { color: '#eee' }, ticks: { color: '#bbb' }, beginAtZero: true } },
  };
  // Helper: Time per session
  const sessionTimes = filteredHistory.map(h => h.time || 0);
  const sessionTimeLabels = filteredHistory.map((h, i) => `Test ${i + 1}`);
  const sessionTimeChartData = {
    labels: sessionTimeLabels,
    datasets: [
      {
        label: 'Time (s)',
        data: sessionTimes,
        fill: true,
        backgroundColor: 'rgba(34,34,34,0.08)',
        borderColor: '#111',
        pointBackgroundColor: '#333',
        tension: 0.4,
      },
    ],
  };
  const sessionTimeChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff' } },
    scales: { x: { grid: { color: '#eee' }, ticks: { color: '#bbb' } }, y: { grid: { color: '#eee' }, ticks: { color: '#bbb' }, beginAtZero: true } },
  };
  // Helper: Consistency chart (WPM variance)
  const wpmVarianceLabels = filteredHistory.map((h, i) => i + 1);
  const wpmVarianceData = filteredHistory.map(h => h.wpm || 0);
  const wpmVarianceChartData = {
    labels: wpmVarianceLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmVarianceData,
        borderColor: '#111',
        backgroundColor: 'rgba(34,34,34,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#333',
        borderWidth: 2,
      },
    ],
  };
  const wpmVarianceChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff' } },
    scales: { x: { grid: { color: '#eee' }, ticks: { color: '#bbb' } }, y: { grid: { color: '#eee' }, ticks: { color: '#bbb' }, beginAtZero: true } },
  };
  // Helper: Category breakdown
  const categoryStats: Record<string, { wpm: number[] }> = {};
  for (const h of filteredHistory) {
    // Check both direct property and keystroke_stats for testType
    const cat = h.testType || (h.keystroke_stats?.testType) || 'General';
    if (!categoryStats[cat]) categoryStats[cat] = { wpm: [] };
    if (h.wpm) categoryStats[cat].wpm.push(h.wpm);
  }
  const categoryLabels = Object.keys(categoryStats);
  const categoryWpmData = categoryLabels.map(cat => {
    const arr = categoryStats[cat].wpm;
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  });
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Avg WPM',
        data: categoryWpmData,
        backgroundColor: '#bbb',
        borderColor: '#111',
        borderWidth: 1,
      },
    ],
  };
  const categoryChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#222', titleColor: '#fff', bodyColor: '#fff' } },
    scales: { x: { grid: { color: '#eee' }, ticks: { color: '#bbb' } }, y: { grid: { color: '#eee' }, ticks: { color: '#bbb' }, beginAtZero: true } },
  };

  // Robust aggregation of key counts for production
  const keyCharCounts: Record<string, number> = {};
  if (filteredHistory.length > 0) {
    for (const session of filteredHistory) {
      // Handle both camelCase (from frontend) and snake_case (from Supabase)
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
            keyCharCounts[key] = (keyCharCounts[key] || 0) + Number(count);
          }
        }
      }
    }
  }
  const keyCharLabels = Object.keys(keyCharCounts);
  const keyCharData = Object.values(keyCharCounts);
  const keyCharChartData = {
    labels: keyCharLabels,
    datasets: [
      {
        label: 'Key Presses',
        data: keyCharData,
        backgroundColor: '#bbb',
        borderColor: '#111',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Dynamic Navbar */}
      <Navbar />
      <div className="w-full flex flex-col gap-10 px-2 md:px-8 py-12">
        {/* Profile Header */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 w-full">
          {/* Redesigned Avatar & Info Card */}
          <div className="w-full md:w-1/4 flex flex-col items-center md:items-start">
            <div className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center md:items-start gap-4">
              <div className="flex flex-col items-center md:items-start w-full">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-24 h-24 rounded-full border border-gray-200 shadow-sm mb-2" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400 mb-2">
                    {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                  </div>
                )}
                <div className="text-xl font-extrabold text-gray-900 mb-1 text-center md:text-left break-all leading-tight">
                  {user.username || user.email || 'User'}
                </div>
                <div className="text-sm text-gray-500 mb-1 text-center md:text-left break-all">{user.email}</div>
                <div className="text-xs text-gray-400 mb-2 text-center md:text-left break-all">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not set'}</div>
              </div>
              {/* Level Progress Bar */}
              <div className="w-full flex flex-col items-center md:items-start my-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">Level {level}</span>
                  <span className="text-xs text-gray-400">{progress}% to next</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-gray-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">XP: <span className='text-gray-700'>{xp}</span></span>
                  <span className="text-xs text-gray-500">Streak: {streak}</span>
                </div>
              </div>
              {/* Badges Row (optional, if you want to show) */}
              {badges && badges.length > 0 && (
                <div className="flex flex-row gap-2 mt-2">
                  {badges.map(badge => (
                    <span key={badge} className="px-2 py-1 bg-gray-200 rounded-full text-xs font-semibold text-gray-700">{badge}</span>
                  ))}
                </div>
              )}
              <button
                onClick={logout}
                className="mt-4 px-6 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition text-base shadow-sm w-full"
              >
                Sign Out
              </button>
              <button
                onClick={handleDownloadCertificate}
                disabled={!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0}
                className={`mt-2 px-6 py-2 rounded-full font-semibold transition text-base shadow-sm w-full ${
                  (!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Download Certificate
              </button>
              <div className="mt-2 flex flex-row gap-2 w-full">
                <button
                  onClick={() => setShowDeleteProgress(true)}
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm flex-1"
                >
                  Delete Progress
                </button>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="px-4 py-2 rounded-full bg-red-900 text-white font-semibold hover:bg-red-800 transition text-sm flex-1"
                >
                  Delete Account
                </button>
              </div>
              {/* Delete Progress Dialog */}
              <AlertDialog open={showDeleteProgress} onOpenChange={setShowDeleteProgress}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your analytics, stats, and test history. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={deleting} onClick={handleDeleteProgress} className="bg-red-600 hover:bg-red-700">Delete Progress</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Delete Account Dialog */}
              <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all analytics. This cannot be undone. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={deleting} onClick={handleDeleteAccount} className="bg-red-900 hover:bg-red-800">Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {/* Hidden Certificate for download rendering */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
              <Certificate name={user.username || user.email || 'User'} wpm={bestWpm} accuracy={bestAccuracy} date={new Date().toLocaleDateString()} email={user.email || ''} />
            </div>
          </div>
          {/* Analytics Section with Tabs */}
          <div className="flex-1 flex flex-col gap-8 w-full">
            {/* Analytics Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-5 py-2 rounded-full font-semibold text-sm border transition-all duration-150 ${selectedTab === 'overview' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-5 py-2 rounded-full font-semibold text-sm border transition-all duration-150 ${selectedTab === 'advanced' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('advanced')}
              >
                Advanced Analytics
              </button>
            </div>
            {/* Tab Content */}
            {selectedTab === 'overview' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  {durations.map(d => (
                    <button
                      key={d.value}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-all duration-150 ${selectedDuration === d.value ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
                      onClick={() => setSelectedDuration(d.value)}
                    >
                      {d.label}
                    </button>
                  ))}
                  <span className="mx-2 text-gray-300">|</span>
                  {ranges.map(r => (
                    <button
                      key={r.value}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-all duration-150 ${selectedRange === r.value ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
                      onClick={() => setSelectedRange(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {/* Key Stats Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full">
                  <StatCard label="Best WPM" value={bestWpm} />
                  <StatCard label="Best Accuracy" value={bestAccuracy + '%'} />
                  <StatCard label="Average WPM" value={avgWpm} />
                  <StatCard label="Typing Streak" value={streak + ' day' + (streak !== 1 ? 's' : '')} />
                </div>
                {/* Progress Chart */}
                <div className="w-full bg-white rounded-2xl shadow p-6 border border-gray-100 flex flex-col items-center">
                  <div className="w-full flex flex-row items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">Progress Over Time</span>
                    <span className="text-xs text-gray-500">(WPM & Accuracy)</span>
                  </div>
                  <div className="w-full h-48">
                    {filteredHistory.length > 1 ? (
                      <Line data={chartData} options={chartOptions} style={{width:'100%',height:180}} />
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">Not enough data to show progress chart</span>
                    )}
                  </div>
                </div>
                {/* Milestones & Achievements */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
                  <StatCard label="Tests Started" value={testsStarted} />
                  <StatCard label="Tests Completed" value={testsCompleted} />
                  <StatCard label="Total Typing Time" value={formatTime(totalTimeTyping)} />
                  <StatCard label="Total Words Typed" value={totalWordsTyped} />
                  <StatCard label="Most Active Day" value={mostActiveDay} />
                  <StatCard label="Top Typing Category" value={topCategory} />
                  <StatCard label="Typing Rank" value={typingRank} />
                </div>
              </>
            )}
            {selectedTab === 'advanced' && (
              <div className="w-full bg-white rounded-2xl shadow p-6 md:p-10 border border-gray-100 flex flex-col gap-10 min-h-[300px]">
                {/* Top Title and Sub-navigation */}
                <div className="w-full flex flex-col gap-4">
                  <h1 className="text-3xl font-extrabold text-black mb-2 text-left" style={{fontFamily:'Inter, SF Pro, system-ui, sans-serif'}}>Advanced Analytics</h1>
                  {/* Sub-navigation Tabs */}
                  <div
                    className="flex flex-row gap-4 border-b border-gray-200 mb-6 overflow-x-auto flex-nowrap -mx-4 px-4 scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {['Speed Trends', 'Accuracy', 'Time Insights', 'Consistency', 'Category Breakdown'].map(tab => (
                      <button
                        key={tab}
                        className={`px-4 py-2 text-base font-medium rounded-t-lg focus:outline-none transition-colors duration-150 whitespace-nowrap ${activeAnalyticsTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveAnalyticsTab(tab)}
                        style={{fontFamily:'Inter, SF Pro, system-ui, sans-serif'}}
                      >
                        {tab}
                          </button>
                        ))}
                      </div>
                </div>
                {/* Key Metrics Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-2">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Best WPM</span>
                    <span className="text-2xl font-bold text-black">{bestWpm}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Lowest Accuracy</span>
                    <span className="text-2xl font-bold text-black">{Math.min(...filteredHistory.map(h => h.accuracy || 100))}%</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Total Tests</span>
                    <span className="text-2xl font-bold text-black">{filteredHistory.length}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Total Errors</span>
                    <span className="text-2xl font-bold text-black">{filteredHistory.reduce((sum, h) => sum + (h.errors || 0), 0)}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Consistency Score</span>
                    <span className="text-2xl font-bold text-black">{consistency === '-' ? '-' : `${consistency}%`}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-start">
                    <span className="text-xs text-gray-500 mb-1">Time Spent Typing</span>
                    <span className="text-2xl font-bold text-black">{formatTime(totalTimeTyping)}</span>
                  </div>
                </div>
                {/* Tab Content */}
                <div className="w-full mt-8">
                  {activeAnalyticsTab === 'Speed Trends' && (
                    <section className="w-full flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-black mb-2">Speed Trends</h2>
                      <div className="w-full h-72 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        {/* Line chart: WPM & Accuracy over time (black/gray lines) */}
                        {filteredHistory.length > 1 ? (
                          <Line data={chartData} options={{...chartOptions, elements: { line: { borderColor: '#111' }, point: { backgroundColor: '#333' } }, plugins: { legend: { labels: { color: '#222' } } }}} style={{ width: '100%', height: 260 }} />
                        ) : (
                          <span className="text-gray-400 text-sm">Not enough data to show trends</span>
                        )}
                      </div>
                    </section>
                  )}
                  {activeAnalyticsTab === 'Accuracy' && (
                    <section className="w-full flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-black mb-2">Accuracy - Error Distribution by Key</h2>
                      <div className="w-full h-72 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        {filteredHistory.length === 0 ? (
                          <span className="text-gray-400 text-sm">No tests in selected range. Try changing the filter above.</span>
                        ) : errorCharLabels.length > 0 ? (
                          <Bar data={errorCharChartData} options={errorCharChartOptions} style={{ width: '100%', height: 260 }} />
                        ) : (
                          <span className="text-gray-400 text-sm">No error data to show for these tests. Complete some typing tests to see error distribution.</span>
                        )}
                    </div>
                    </section>
                  )}
                  {activeAnalyticsTab === 'Time Insights' && (
                    <section className="w-full flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-black mb-2">Time Insights</h2>
                      <div className="w-full h-72 bg-white rounded-xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
                        {sessionTimes.length > 0 ? (
                          <Line data={sessionTimeChartData} options={sessionTimeChartOptions} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <span className="text-gray-400 text-sm">No session time data to show</span>
                        )}
                            </div>
                    </section>
                  )}
                  {activeAnalyticsTab === 'Consistency' && (
                    <section className="w-full flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-black mb-2">Consistency</h2>
                      <div className="w-full h-72 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        {wpmVarianceData.length > 1 ? (
                          <Line data={wpmVarianceChartData} options={wpmVarianceChartOptions} style={{ width: '100%', height: 260 }} />
                        ) : (
                          <span className="text-gray-400 text-sm">Not enough data to show consistency</span>
                        )}
                      </div>
                      <div className="mt-4 text-lg font-semibold text-black">Consistency Score: {consistency === '-' ? '-' : `${consistency}%`}</div>
                    </section>
                  )}
                  {activeAnalyticsTab === 'Category Breakdown' && (
                    <section className="w-full flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-black mb-2">Category Breakdown</h2>
                      <div className="w-full h-72 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        {categoryLabels.length > 0 ? (
                          <Bar data={categoryChartData} options={categoryChartOptions} style={{ width: '100%', height: 260 }} />
                        ) : (
                          <span className="text-gray-400 text-sm">No category data to show</span>
                        )}
                      </div>
                      <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {categoryLabels.map((cat, i) => (
                          <div key={cat} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
                            <span className="text-xs text-gray-500 mb-1">{cat}</span>
                            <span className="text-lg font-bold text-black">{categoryWpmData[i]} WPM</span>
                </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

// Card component for stats
function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
      <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
} 