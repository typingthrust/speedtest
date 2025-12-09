import React, { useState, useEffect } from 'react';
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
  const cat: Record<string, number> = {};
  history.forEach((h: any) => {
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
        const normalizedData = data.map((result: any) => ({
          ...result,
          keystrokeStats: result.keystroke_stats || result.keystrokeStats || {},
          errorTypes: result.error_types || result.errorTypes || {},
          wordCount: result.word_count || result.wordCount || 0,
          testType: result.test_type || result.testType || (result.keystroke_stats?.testType) || (result.keystrokeStats?.testType) || 'General',
          timestamp: result.timestamp || result.created_at || new Date().toISOString(),
          duration: result.duration || (result.time || 0),
          wpm: result.wpm || 0,
          accuracy: result.accuracy || 0,
          errors: result.errors || 0,
          time: result.time || 0,
        }));
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

  if (loading || resultsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading profile data...</div>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <div className="bg-slate-800 p-8 rounded-xl shadow-md text-center border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">No Account Found</h2>
          <p className="mb-6 text-slate-400">Please log in to access your profile and analytics.</p>
          <button
            className="bg-cyan-500 text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition"
            onClick={() => openOverlay('auth')}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const history = testResults;
  const level = gamificationState.level;
  const xp = gamificationState.xp;
  const progress = Math.min(100, Math.round((xp % 100)));
  const streak = gamificationState.streak;
  const badges = gamificationState.badges;
  const filteredHistory = filterHistory(history, selectedDuration, selectedRange);
  const bestWpm = getBestWpm(filteredHistory);
  const bestAccuracy = getBestAccuracy(filteredHistory);
  const avgWpm = getAvgWpm(filteredHistory);
  const totalTime = filteredHistory.reduce((sum: number, h: any) => sum + (h.time || 0), 0);
  const totalWords = filteredHistory.reduce((sum: number, h: any) => {
    if (h.wordCount) return sum + h.wordCount;
    if (h.userInput) return sum + Math.round(h.userInput.length / 5);
    return sum;
  }, 0);
  const mostActiveDay = filteredHistory.length > 0 ? getMostActiveDay(filteredHistory) : 'N/A';
  const topCategory = getTopCategory(filteredHistory);
  const typingRank = getTypingRank(avgWpm);
  const testsStarted = history.length;
  const testsCompleted = filteredHistory.length;
  const totalWordsTyped = totalWords;
  const totalTimeTyping = totalTime;

  const dataForCharts = filteredHistory.length > 0 ? filteredHistory : history;
  const chartLabels = dataForCharts.map((h, i) => i + 1);
  const wpmData = dataForCharts.map(h => Math.max(0, h.wpm || 0));
  const accData = dataForCharts.map(h => Math.max(0, Math.min(100, h.accuracy || 0)));
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#22d3ee',
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#94a3b8',
        borderWidth: 2,
      },
    ],
  };
  const maxY = wpmData.length > 0 && accData.length > 0 
    ? Math.max(100, Math.ceil(Math.max(...wpmData, ...accData) * 1.1))
    : 100;
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#94a3b8', font: { size: 14 } } },
      tooltip: { enabled: true, backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', borderColor: '#475569', borderWidth: 1 },
    },
    scales: {
      x: { display: false, grid: { color: '#475569' }, ticks: { color: '#94a3b8' } },
      y: {
        display: true,
        min: 0,
        max: maxY,
        grid: { color: '#475569' },
        ticks: { color: '#94a3b8', font: { size: 12 } },
      },
    },
    elements: { line: { borderWidth: 2 }, point: { backgroundColor: '#22d3ee' } },
  };

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

  async function handleDeleteProgress() {
    if (!user) return;
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
    if (!user) return;
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

  const errorCharCounts: Record<string, number> = {};
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
          errorCharCounts[key] = (errorCharCounts[key] || 0) + Number(count);
        }
      }
    }
  }
  
  const sortedErrorEntries = Object.entries(errorCharCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30);
  
  const errorCharLabels = sortedErrorEntries.map(([key]) => key);
  const errorCharData = sortedErrorEntries.map(([, count]) => count);
  
  const errorCharChartData = {
    labels: errorCharLabels,
    datasets: [
      {
        label: 'Errors',
        data: errorCharData,
        backgroundColor: '#22d3ee',
        borderColor: '#06b6d4',
        borderWidth: 1,
      },
    ],
  };
  const errorCharChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        enabled: true, 
        backgroundColor: '#1e293b', 
        titleColor: '#f1f5f9', 
        bodyColor: '#f1f5f9', 
        borderColor: '#475569', 
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            return `Errors: ${context.parsed.y}`;
          }
        }
      } 
    },
    scales: { 
      x: { 
        grid: { color: '#475569', display: true }, 
        ticks: { 
          color: '#94a3b8',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
        title: {
          display: true,
          text: 'Keys',
          color: '#94a3b8',
        }
      }, 
      y: { 
        grid: { color: '#475569', display: true }, 
        ticks: { 
          color: '#94a3b8',
          font: { size: 11 },
          stepSize: 1,
        },
        beginAtZero: true,
        title: {
          display: true,
          text: 'Error Count',
          color: '#94a3b8',
        }
      } 
    },
  };
  const sessionTimes = filteredHistory.map(h => h.time || 0);
  const sessionTimeLabels = filteredHistory.map((h, i) => `Test ${i + 1}`);
  const sessionTimeChartData = {
    labels: sessionTimeLabels,
    datasets: [
      {
        label: 'Time (s)',
        data: sessionTimes,
        fill: true,
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderColor: '#22d3ee',
        pointBackgroundColor: '#22d3ee',
        tension: 0.4,
      },
    ],
  };
  const sessionTimeChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', borderColor: '#475569', borderWidth: 1 } },
    scales: { x: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' }, beginAtZero: true } },
  };
  const wpmVarianceLabels = filteredHistory.map((h, i) => i + 1);
  const wpmVarianceData = filteredHistory.map(h => h.wpm || 0);
  const wpmVarianceChartData = {
    labels: wpmVarianceLabels,
    datasets: [
      {
        label: 'WPM',
        data: wpmVarianceData,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#22d3ee',
        borderWidth: 2,
      },
    ],
  };
  const wpmVarianceChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', borderColor: '#475569', borderWidth: 1 } },
    scales: { x: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' }, beginAtZero: true } },
  };
  const categoryStats: Record<string, { wpm: number[] }> = {};
  for (const h of filteredHistory) {
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
        backgroundColor: '#22d3ee',
        borderColor: '#06b6d4',
        borderWidth: 1,
      },
    ],
  };
  const categoryChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', borderColor: '#475569', borderWidth: 1 } },
    scales: { x: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' }, beginAtZero: true } },
  };

  const keyCharCounts: Record<string, number> = {};
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
        backgroundColor: '#22d3ee',
        borderColor: '#06b6d4',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-2">Profile</h1>
              <p className="text-slate-400 text-sm">Track your typing progress and achievements</p>
            </div>
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-slate-600" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-xl font-bold text-slate-900">
                  {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-100">{user.username || user.email || 'User'}</div>
                <div className="text-xs text-slate-400">Level {level}</div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <ModernStatCard 
              icon={Zap} 
              label="Best WPM" 
              value={bestWpm || 0} 
              color="cyan" 
            />
            <ModernStatCard 
              icon={Target} 
              label="Best Accuracy" 
              value={`${bestAccuracy || 0}%`} 
              color="emerald" 
            />
            <ModernStatCard 
              icon={TrendingUp} 
              label="Average WPM" 
              value={avgWpm || 0} 
              color="cyan" 
            />
            <ModernStatCard 
              icon={Activity} 
              label="Streak" 
              value={`${streak} day${streak !== 1 ? 's' : ''}`} 
              color="amber" 
            />
          </div>

          {/* Level Progress Card */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-1">Level {level}</h3>
                <p className="text-sm text-slate-400">{xp} XP • {progress}% to Level {level + 1}</p>
              </div>
              {badges && badges.length > 0 && (
                <div className="flex gap-2">
                  {badges.slice(0, 3).map(badge => (
                    <div key={badge} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold border border-cyan-500/30">
                      {badge}
                    </div>
                  ))}
                  {badges.length > 3 && (
                    <div className="px-3 py-1 bg-slate-700 text-slate-400 rounded-lg text-xs font-semibold border border-slate-600">
                      +{badges.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-medium text-slate-400">Duration:</span>
            {durations.map(d => (
              <button
                key={d.value}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedDuration === d.value
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
                onClick={() => setSelectedDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-400">Time Range:</span>
            {ranges.map(r => (
              <button
                key={r.value}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedRange === r.value
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
                onClick={() => setSelectedRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-slate-700">
            <button
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setSelectedTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                selectedTab === 'advanced'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setSelectedTab('advanced')}
            >
              Advanced Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Chart */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Progress Over Time</h2>
              <div className="h-64">
                {filteredHistory.length > 1 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Complete more tests to see your progress
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard label="Tests Completed" value={testsCompleted} />
              <StatCard label="Total Time" value={formatTime(totalTimeTyping)} />
              <StatCard label="Words Typed" value={totalWordsTyped.toLocaleString()} />
              <StatCard label="Rank" value={typingRank} />
              <StatCard label="Most Active Day" value={mostActiveDay} />
              <StatCard label="Top Category" value={topCategory} />
            </div>
          </div>
        )}

        {selectedTab === 'advanced' && (
          <div className="space-y-6">
            {/* Advanced Analytics Sub-tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['Speed Trends', 'Accuracy', 'Time Insights', 'Consistency', 'Category Breakdown'].map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeAnalyticsTab === tab
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setActiveAnalyticsTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Advanced Analytics Content */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              {activeAnalyticsTab === 'Speed Trends' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-4">Speed Trends</h2>
                  <div className="h-72">
                    {history.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No tests completed yet
                      </div>
                    ) : dataForCharts.length > 1 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        Complete more tests to see trends
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeAnalyticsTab === 'Accuracy' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-4">Error Distribution by Key</h2>
                  <div className="h-72">
                    {history.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No tests completed yet
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No tests in selected range
                      </div>
                    ) : errorCharLabels.length > 0 && errorCharData.length > 0 ? (
                      <Bar data={errorCharChartData} options={errorCharChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No error data available
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeAnalyticsTab === 'Time Insights' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-4">Time Insights</h2>
                  <div className="h-72">
                    {sessionTimes.length > 0 ? (
                      <Line data={sessionTimeChartData} options={sessionTimeChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No session time data
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeAnalyticsTab === 'Consistency' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-4">Consistency</h2>
                  <div className="h-72 mb-4">
                    {wpmVarianceData.length > 1 ? (
                      <Line data={wpmVarianceChartData} options={wpmVarianceChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        Not enough data
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-slate-100">
                    Consistency Score: {consistency === '-' ? '-' : `${consistency}%`}
                  </div>
                </div>
              )}

              {activeAnalyticsTab === 'Category Breakdown' && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-4">Category Breakdown</h2>
                  <div className="h-72 mb-6">
                    {categoryLabels.length > 0 ? (
                      <Bar data={categoryChartData} options={categoryChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        No category data
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryLabels.map((cat, i) => (
                      <div key={cat} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="text-sm text-slate-400 mb-1">{cat}</div>
                        <div className="text-2xl font-bold text-cyan-400">{categoryWpmData[i]} WPM</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownloadCertificate}
            disabled={!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              (!testResults || testResults.length === 0 || !bestWpm || bestWpm === 0)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'
            }`}
          >
            Download Certificate
          </button>
          <button
            onClick={logout}
            className="px-6 py-3 rounded-lg bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all border border-slate-700"
          >
            Sign Out
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteProgress(true)}
              className="px-4 py-3 rounded-lg bg-red-600/20 text-red-400 font-semibold hover:bg-red-600/30 transition-all border border-red-600/30 text-sm"
            >
              Delete Progress
            </button>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="px-4 py-3 rounded-lg bg-red-900/20 text-red-400 font-semibold hover:bg-red-900/30 transition-all border border-red-900/30 text-sm"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Dialogs */}
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
              <AlertDialogAction disabled={deleting} onClick={handleDeleteProgress} className="bg-red-600 hover:bg-red-700">
                Delete Progress
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              <AlertDialogAction disabled={deleting} onClick={handleDeleteAccount} className="bg-red-900 hover:bg-red-800">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden Certificate */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <Certificate name={user.username || user.email || 'User'} wpm={bestWpm} accuracy={bestAccuracy} date={new Date().toLocaleDateString()} email={user.email || ''} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Modern Stat Card Component
function ModernStatCard({ icon: Icon, label, value, color = 'cyan' }: { icon: any; label: string; value: React.ReactNode; color?: 'cyan' | 'emerald' | 'amber' }) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  
  return (
    <div className={`bg-slate-800/50 rounded-xl border ${colorClasses[color]} p-4 transition-all hover:scale-105`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</div>
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all">
      <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-cyan-400">{value}</div>
    </div>
  );
}
