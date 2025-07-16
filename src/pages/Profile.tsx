import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { usePersonalization } from '../components/PersonalizationProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Keyboard, Bell, User as UserIcon, Award, Users, BookOpen, Rocket } from 'lucide-react';
import { ExpandableTabs } from '../components/ui/expandable-tabs';
import type { OverlayType } from '../components/OverlayProvider';
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
import Navbar from '../components/Navbar';
import Certificate from '../components/Certificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import KeyboardHeatmap from '../components/KeyboardHeatmap';
import Footer from '../components/Footer';

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
    const type = h.testType || 'General';
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
  const { user, logout } = useAuth();
  const { state } = usePersonalization();
  const navigate = useNavigate();
  // Filter state
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  // Tab state for analytics
  const [selectedTab, setSelectedTab] = useState<'overview' | 'advanced'>('overview');

  // Redirect to /signin if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    // Optionally, render nothing while redirecting
    return null;
  }

  const stats = (state?.stats || {}) as Stats;
  const history = stats.history || [];
  const level = stats.level ?? 1;
  const progress = stats.progress ?? 0;

  // Use filtered history for all stats and chart
  const filteredHistory = filterHistory(history, selectedDuration, selectedRange);
  const wpm = filteredHistory.length > 0 ? Math.round(filteredHistory.reduce((sum, h) => sum + (h.wpm || 0), 0) / filteredHistory.length) : 0;
  const accuracy = filteredHistory.length > 0 ? Math.round(filteredHistory.reduce((sum, h) => sum + (h.accuracy || 0), 0) / filteredHistory.length) : 100;
  const testsTaken = filteredHistory.length;
  const timeTyping = filteredHistory.reduce((sum, h) => sum + (h.time || 0), 0);
  const testsStarted = filteredHistory.length;
  const testsCompleted = filteredHistory.filter(h => h.completed).length;
  const avgTestDuration = getAvgTestDuration(filteredHistory);
  const bestWpm = getBestWpm(filteredHistory);
  const bestAccuracy = getBestAccuracy(filteredHistory);
  const totalTime = filteredHistory.reduce((sum, h) => sum + (h.time || 0), 0);
  const mostActiveDay = getMostActiveDay(filteredHistory);
  const streak = getTypingStreak(filteredHistory);
  const totalWords = getTotalWords(filteredHistory);
  const topCategory = getTopCategory(filteredHistory);
  const avgWpm = filteredHistory.length > 0 ? Math.round(filteredHistory.reduce((sum, h) => sum + (h.wpm || 0), 0) / filteredHistory.length) : 0;
  const typingRank = getTypingRank(avgWpm);
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
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: 'Accuracy',
        data: accData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: true, min: 0, max: 100, ticks: { color: '#bdbdbd', font: { size: 12 } } },
    },
    elements: { line: { borderWidth: 2 } },
  };

  // --- Error Heatmap Aggregation ---
  // Aggregate key error counts from all filtered history
  const errorKeyStats: Record<string, number> = {};
  for (const session of filteredHistory) {
    if (session.keystrokeStats && session.keystrokeStats.keyCounts) {
      for (const [key, count] of Object.entries(session.keystrokeStats.keyCounts)) {
        errorKeyStats[key] = (errorKeyStats[key] || 0) + Number(count);
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
    const certArea = document.getElementById('certificate-download-area');
    if (!certArea) return;
    const canvas = await html2canvas(certArea, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [600, 400] });
    pdf.addImage(imgData, 'PNG', 0, 0, 600, 400);
    pdf.save('ProType-Certificate.pdf');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Dynamic Navbar */}
      <Navbar />
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-10 px-4 md:px-8 py-12">
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
                  <div className="h-2 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 px-6 py-2 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-base shadow-sm w-full"
              >
                Sign Out
              </button>
              <button
                onClick={handleDownloadCertificate}
                className="mt-2 px-6 py-2 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-base shadow-sm w-full"
              >
                Download Certificate
              </button>
            </div>
            {/* Hidden Certificate for download rendering */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
              <Certificate name={user.username || user.email || 'User'} wpm={bestWpm} accuracy={bestAccuracy} date={new Date().toLocaleDateString()} />
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
                  <StatCard label="Total Typing Time" value={formatTime(totalTime)} />
                  <StatCard label="Total Words Typed" value={totalWords} />
                  <StatCard label="Most Active Day" value={mostActiveDay} />
                  <StatCard label="Top Typing Category" value={topCategory} />
                  <StatCard label="Typing Rank" value={typingRank} />
                </div>
              </>
            )}
            {selectedTab === 'advanced' && (
              <div className="w-full bg-white rounded-2xl shadow p-4 sm:p-8 border border-gray-100 flex flex-col items-center min-h-[300px]">
                {filteredHistory.length < 2 ? (
                  <div className="flex flex-col items-center justify-center w-full h-64">
                    <span className="text-2xl font-bold text-gray-900 mb-2 text-center">Advanced Analytics</span>
                    <span className="text-gray-500 text-base mb-6 text-center">Unlock deep-dive stats like per-finger analysis, error heatmaps, and actionable insights by completing your first typing tests.</span>
                    <span className="text-gray-400 text-sm mb-4 text-center">Complete at least 2 tests to view your advanced analytics.</span>
                    <button
                      className="px-6 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-900 transition text-base shadow-sm"
                      onClick={() => setSelectedTab('overview')}
                    >
                      Take a Typing Test
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Export/Download Section */}
                    <div className="w-full max-w-3xl flex flex-row gap-4 items-center justify-end mb-4">
                      <button
                        className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition text-sm shadow-sm border border-black"
                        onClick={async () => {
                          // Export analytics as PDF using jsPDF
                          const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
                          pdf.setFontSize(18);
                          pdf.text('ProType Advanced Analytics', 40, 40);
                          pdf.setFontSize(12);
                          let y = 70;
                          pdf.text('WPM Trend:', 40, y);
                          filteredHistory.forEach((h, i) => {
                            pdf.text(`${h.timestamp ? new Date(h.timestamp).toLocaleDateString() : i + 1}: ${h.wpm || 0} WPM`, 60, y + 18 + i * 16);
                          });
                          y += 18 + filteredHistory.length * 16 + 10;
                          pdf.text('Accuracy Trend:', 40, y);
                          filteredHistory.forEach((h, i) => {
                            pdf.text(`${h.timestamp ? new Date(h.timestamp).toLocaleDateString() : i + 1}: ${h.accuracy || 0}%`, 60, y + 18 + i * 16);
                          });
                          y += 18 + filteredHistory.length * 16 + 10;
                          pdf.text('Error Rate Trend:', 40, y);
                          filteredHistory.forEach((h, i) => {
                            const errorRate = h.errorRate !== undefined ? h.errorRate : (h.errors && h.charsTyped ? Math.round((h.errors / h.charsTyped) * 100) : 0);
                            pdf.text(`${h.timestamp ? new Date(h.timestamp).toLocaleDateString() : i + 1}: ${errorRate}%`, 60, y + 18 + i * 16);
                          });
                          pdf.save('ProType-Advanced-Analytics.pdf');
                        }}
                      >
                        Export PDF
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition text-sm shadow-sm border border-black"
                        onClick={() => {
                          // Export analytics as CSV
                          let csv = 'Date,WPM,Accuracy,Error Rate\n';
                          filteredHistory.forEach((h, i) => {
                            const date = h.timestamp ? new Date(h.timestamp).toLocaleDateString() : i + 1;
                            const wpm = h.wpm || 0;
                            const acc = h.accuracy || 0;
                            const errorRate = h.errorRate !== undefined ? h.errorRate : (h.errors && h.charsTyped ? Math.round((h.errors / h.charsTyped) * 100) : 0);
                            csv += `${date},${wpm},${acc},${errorRate}\n`;
                          });
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'ProType-Advanced-Analytics.csv';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Export CSV
                      </button>
                    </div>
                    {/* Trend Charts Section */}
                    <div className="w-full max-w-3xl mb-8">
                      <div className="text-lg font-bold text-gray-800 mb-1">Trend Charts</div>
                      <div className="text-sm text-gray-500 mb-4">Track your WPM, accuracy, and error rate over time. Use the filter to view different time ranges.</div>
                      <div className="flex flex-wrap gap-2 items-center mb-4">
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
                      <div className="w-full h-56 bg-white rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center">
                        {filteredHistory.length > 1 ? (
                          <Line
                            data={{
                              labels: filteredHistory.map((h, i) => h.timestamp ? new Date(h.timestamp).toLocaleDateString() : i + 1),
                              datasets: [
                                {
                                  label: 'WPM',
                                  data: filteredHistory.map(h => h.wpm || 0),
                                  borderColor: '#6366f1',
                                  backgroundColor: 'rgba(99,102,241,0.08)',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 2,
                                  borderWidth: 2,
                                },
                                {
                                  label: 'Accuracy',
                                  data: filteredHistory.map(h => h.accuracy || 0),
                                  borderColor: '#10b981',
                                  backgroundColor: 'rgba(16,185,129,0.08)',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 2,
                                  borderWidth: 2,
                                },
                                {
                                  label: 'Error Rate',
                                  data: filteredHistory.map(h => h.errorRate !== undefined ? h.errorRate : (h.errors && h.charsTyped ? Math.round((h.errors / h.charsTyped) * 100) : 0)),
                                  borderColor: '#ef4444',
                                  backgroundColor: 'rgba(239,68,68,0.08)',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 2,
                                  borderWidth: 2,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: true }, tooltip: { enabled: true } },
                              scales: {
                                x: { display: true, title: { display: true, text: 'Test' }, ticks: { color: '#bdbdbd', font: { size: 12 } } },
                                y: { display: true, min: 0, max: 100, title: { display: true, text: 'Value' }, ticks: { color: '#bdbdbd', font: { size: 12 } } },
                              },
                              elements: { line: { borderWidth: 2 } },
                            }}
                            style={{ width: '100%', height: 200 }}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm flex items-center justify-center h-full">Not enough data to show trend charts</span>
                        )}
                      </div>
                    </div>
                    {/* Global Comparison Section */}
                    <div className="w-full max-w-3xl mb-8">
                      <div className="text-lg font-bold text-gray-900 mb-1">Global Comparison</div>
                      <div className="text-sm text-gray-500 mb-4">See how you stack up against global averages and top performers.</div>
                      {(() => {
                        const globalWpm = 52;
                        const globalAccuracy = 93;
                        const globalErrorRate = 7;
                        const userWpm = wpm;
                        const userAccuracy = accuracy;
                        const userErrorRate = 100 - accuracy;
                        // Mock percentiles
                        const wpmPercentile = userWpm >= globalWpm ? 85 : 45;
                        const accuracyPercentile = userAccuracy >= globalAccuracy ? 80 : 40;
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-200">
                              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">WPM</div>
                              <div className="text-2xl font-bold text-gray-900 mb-1">{userWpm}</div>
                              <div className="text-sm text-gray-500">Global Avg: <span className="font-semibold text-gray-700">{globalWpm}</span></div>
                              <div className="text-xs text-gray-600 mt-1">Faster than {wpmPercentile}% of users</div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-200">
                              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Accuracy</div>
                              <div className="text-2xl font-bold text-gray-900 mb-1">{userAccuracy}%</div>
                              <div className="text-sm text-gray-500">Global Avg: <span className="font-semibold text-gray-700">{globalAccuracy}%</span></div>
                              <div className="text-xs text-gray-600 mt-1">More accurate than {accuracyPercentile}% of users</div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-200">
                              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Error Rate</div>
                              <div className="text-2xl font-bold text-gray-900 mb-1">{userErrorRate}%</div>
                              <div className="text-sm text-gray-500">Global Avg: <span className="font-semibold text-gray-700">{globalErrorRate}%</span></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Achievements & Milestones Section */}
                    <div className="w-full max-w-3xl mb-8">
                      <div className="text-lg font-bold text-gray-900 mb-1">Achievements & Milestones</div>
                      <div className="text-sm text-gray-500 mb-4">Celebrate your progress and unlock new milestones as you improve!</div>
                      <div className="flex flex-wrap gap-4 items-center justify-center">
                        {/* Longest Streak */}
                        <div className="flex flex-col items-center bg-gray-100 rounded-xl p-6 shadow border border-gray-200 min-w-[120px]">
                          <span className="text-2xl font-bold text-gray-900 mb-1">{streak}</span>
                          <span className="text-xs font-semibold text-gray-700 uppercase">Day Streak</span>
                        </div>
                        {/* Best WPM */}
                        <div className="flex flex-col items-center bg-gray-100 rounded-xl p-6 shadow border border-gray-200 min-w-[120px]">
                          <span className="text-2xl font-bold text-gray-900 mb-1">{bestWpm}</span>
                          <span className="text-xs font-semibold text-gray-700 uppercase">Best WPM</span>
                        </div>
                        {/* Best Accuracy */}
                        <div className="flex flex-col items-center bg-gray-100 rounded-xl p-6 shadow border border-gray-200 min-w-[120px]">
                          <span className="text-2xl font-bold text-gray-900 mb-1">{bestAccuracy}%</span>
                          <span className="text-xs font-semibold text-gray-700 uppercase">Best Accuracy</span>
                        </div>
                        {/* Most Improved */}
                        {filteredHistory.length > 3 && (() => {
                          const first = filteredHistory[0];
                          const last = filteredHistory[filteredHistory.length - 1];
                          const wpmDiff = (last.wpm || 0) - (first.wpm || 0);
                          const accDiff = (last.accuracy || 0) - (first.accuracy || 0);
                          if (wpmDiff > 10 || accDiff > 5) {
                            return (
                              <div className="flex flex-col items-center bg-gray-100 rounded-xl p-6 shadow border border-gray-200 min-w-[120px]">
                                <span className="text-2xl font-bold text-gray-900 mb-1">+{wpmDiff > 10 ? wpmDiff : accDiff}%</span>
                                <span className="text-xs font-semibold text-gray-700 uppercase">Most Improved</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {/* Consistency */}
                        {filteredHistory.length > 4 && (() => {
                          const last5 = filteredHistory.slice(-5);
                          const accs = last5.map(h => h.accuracy || 0);
                          const minAcc = Math.min(...accs);
                          if (minAcc > 95) {
                            return (
                              <div className="flex flex-col items-center bg-gray-100 rounded-xl p-6 shadow border border-gray-200 min-w-[120px]">
                                <span className="text-2xl font-bold text-gray-900 mb-1">{minAcc}%+</span>
                                <span className="text-xs font-semibold text-gray-700 uppercase">Consistent Accuracy</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                {/* Error Heatmap Section */}
                    <div className="w-full max-w-3xl mb-8 overflow-x-auto scrollbar-hide">
                      <div className="text-lg font-bold text-gray-900 mb-1">Error Heatmap</div>
                  <div className="text-sm text-gray-500 mb-4">See which keys you mistype most often across all your tests.</div>
                      <div className="min-w-[340px] flex justify-center">
                        <KeyboardHeatmap
                          keyStats={errorKeyStats}
                          title="Key Error Heatmap"
                          minimal={true}
                        />
                      </div>
                </div>
                {/* Per-Finger Analysis Section */}
                <div className="w-full max-w-2xl mb-8">
                      <div className="text-lg font-bold text-gray-900 mb-1">Per-Finger Error Analysis</div>
                  <div className="text-sm text-gray-500 mb-4">See which fingers make the most and fewest errors.</div>
                      <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex flex-row items-end gap-2 sm:gap-4 h-32 w-full px-1 sm:px-2 min-w-[340px]">
                          {fingerOrder.map(finger => {
                            const value = fingerErrorStats[finger] || 0;
                            const max = Math.max(...fingerOrder.map(f => fingerErrorStats[f] || 0), 1);
                            const min = 0;
                            const factor = (value - min) / (max - min);
                            const color = `rgb(${230 - factor * 120},${230 - factor * 120},${230 - factor * 120})`;
                            return (
                      <div key={finger} className="flex flex-col items-center flex-1">
                                <div className="w-6 sm:w-9 h-full flex items-end">
                                  <div
                                    className="rounded-t-lg"
                                    style={{ height: `${value * 3 + 8}px`, minHeight: 8, width: '100%', background: color }}
                                    title={`${finger}: ${value} errors`}
                                    aria-label={`${finger}: ${value} errors`}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 text-center whitespace-nowrap">{finger.replace(' ', '\n')}</div>
                                <div className="text-xs text-gray-400">{value}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-700 text-center"></div>
                </div>
                {/* Actionable Insights Section */}
                <div className="w-full max-w-2xl mb-2">
                      <div className="text-lg font-bold text-gray-900 mb-1">Personalized Actionable Tips</div>
                  <div className="flex flex-col gap-2 mt-2">
                        {(() => {
                          const tips: string[] = [...insights];
                          if (filteredHistory.length > 3) {
                            const last3 = filteredHistory.slice(-3);
                            const wpmTrend = last3.map(h => h.wpm || 0);
                            if (wpmTrend[2] > wpmTrend[0] + 5) {
                              tips.push('Your WPM is improving! Keep up the great work and try more advanced texts.');
                            } else if (wpmTrend[2] < wpmTrend[0] - 5) {
                              tips.push('Your WPM has dropped recently. Consider reviewing your technique or taking a short break.');
                            }
                            const accTrend = last3.map(h => h.accuracy || 0);
                            if (accTrend[2] > accTrend[0] + 3) {
                              tips.push('Your accuracy is on the rise. Focus on maintaining this consistency.');
                            } else if (accTrend[2] < accTrend[0] - 3) {
                              tips.push('Accuracy has dipped. Slow down a bit and focus on precision.');
                            }
                          }
                          if (wpm > 52) tips.push('You are above the global average WPM. Challenge yourself with longer or more difficult tests!');
                          if (accuracy > 93) tips.push('Your accuracy is excellent. Try to maintain this while increasing speed.');
                          if (mostErrorFinger && fingerErrorStats[mostErrorFinger] > 5) {
                            tips.push(`Practice exercises that target your ${mostErrorFinger} to reduce errors.`);
                          }
                          if (streak >= 5) tips.push('Great streak! Consistency is key to improvement.');
                          if (tips.length === 0) tips.push('Not enough data for insights yet. Complete more tests!');
                          return tips.map((tip, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 text-sm shadow-sm border border-gray-200 font-medium">{tip}</div>
                          ));
                        })()}
                  </div>
                </div>
                    {/* Placeholder for future enhancements: trend charts, export, comparison, etc. */}
                    <div className="w-full max-w-2xl mt-6 flex flex-col items-center gap-4">
                      {/* Future: Trend charts, export/download, comparison, achievements */}
                    </div>
                  </>
                )}
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