import React, { useEffect, useRef, useState } from 'react';
import { useOverlay } from '../OverlayProvider';
import { PerTestAnalyticsSection } from './AnalyticsSection';
import { useCurrentTest } from '../CurrentTestProvider';
import { X, BarChart2, Keyboard, AlertTriangle } from 'lucide-react';
import KeyboardHeatmap from '../KeyboardHeatmap';

function MinimalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (backdropRef.current && e.target === backdropRef.current) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-6xl mx-4 sm:mx-auto bg-slate-800/90 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center min-h-[50vh] max-h-[95vh] min-w-0 sm:min-w-[320px] p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(51, 65, 85, 0.5)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close analytics"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Tab Bar */}
        {children}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'summary', label: 'Summary', icon: BarChart2 },
  { key: 'heatmap', label: 'Heatmap', icon: Keyboard },
  { key: 'errors', label: 'Errors', icon: AlertTriangle },
];

function AnalyticsOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { currentTestData } = useCurrentTest();
  const [tab, setTab] = useState('summary');

  // Tab content components
  function SummaryTab() {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <PerTestAnalyticsSection
          currentTestData={currentTestData}
          heading="Current Test Summary"
          subheading="Quick stats for your latest typing test."
        />
      </div>
    );
  }
  function HeatmapTab() {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <KeyboardHeatmap keyStats={currentTestData.keystrokeStats?.keyCounts || {}} title="Keyboard Heatmap (Current Test)" />
      </div>
    );
  }
  function ErrorsTab() {
    const errorTypesArr = Object.entries(currentTestData.errorTypes || {}).map(([type, count]) => ({ type, count }));
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <div className="w-full max-w-md mx-auto bg-slate-700/80 rounded-xl shadow p-6 border border-slate-600">
          <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" /> Error Breakdown</h2>
          {errorTypesArr.length > 0 ? (
            <div className="flex flex-col gap-2">
              {errorTypesArr.map((e, i) => (
                <div key={i} className="flex justify-between text-base text-slate-300">
                  <span>{e.type}</span>
                  <span className="font-mono text-red-400">{e.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-base text-center">No errors in this test!</div>
          )}
        </div>
      </div>
    );
  }

  const renderTab = () => {
    if (tab === 'summary') return <SummaryTab />;
    if (tab === 'heatmap') return <HeatmapTab />;
    if (tab === 'errors') return <ErrorsTab />;
    return null;
  };

  return (
    <MinimalOverlay open={open === 'analytics'} onClose={closeOverlay}>
      {/* Tab Bar */}
      <nav className="w-full flex flex-row justify-center items-center gap-2 border-b border-slate-700 bg-slate-800/80 rounded-t-xl sticky top-0 z-10" style={{backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-t-xl transition-all duration-200 focus:outline-none ${tab === t.key ? 'bg-slate-800 shadow text-primary' : 'text-slate-400 hover:text-primary hover:bg-slate-700'}`}
            onClick={() => setTab(t.key)}
            style={{borderBottom: tab === t.key ? '2.5px solid #22d3ee' : '2.5px solid transparent'}}
          >
            <t.icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </nav>
      <div className="w-full flex-1 flex flex-col items-center justify-center py-8 px-2 sm:px-8">
        {renderTab()}
      </div>
    </MinimalOverlay>
  );
}

export default AnalyticsOverlay; 