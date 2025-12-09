import React, { useState } from 'react';
import { useOverlay } from '../OverlayProvider';
import { X, Copy as CopyIcon, Check } from 'lucide-react';
// Add Discord icon import
import { FaDiscord } from 'react-icons/fa';

function MinimalGrowthOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-2xl mx-4 sm:mx-auto bg-slate-800/90 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center min-h-[40vh] max-h-[90vh] min-w-0 sm:min-w-[320px] p-0"
        style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(51, 65, 85, 0.5)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl p-2 rounded-full focus:outline-none z-10"
          aria-label="Close growth tools"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full px-8 py-8 overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function GrowthToolsOverlay() {
  const { open, closeOverlay } = useOverlay();
  const [copiedWidget, setCopiedWidget] = useState(false);
  const inviteLink = 'https://typingthrust.com/invite/your-unique-code';
  const widgetCode = `<iframe src='https://typingthrust.com/widget' width='400' height='200' style='border:0'></iframe>`;

  const handleCopyWidget = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopiedWidget(true);
    setTimeout(() => setCopiedWidget(false), 1200);
  };

  return (
    <MinimalGrowthOverlay open={open === 'growth-tools'} onClose={closeOverlay}>
      <section className="w-full flex flex-col gap-8 items-center">
        <header className="w-full mb-2">
          <h1 className="text-2xl font-bold text-slate-100">Growth & Community Tools</h1>
        </header>
        {/* Community Links */}
        <section className="w-full">
          <h3 className="text-base font-semibold mb-2 text-slate-300">Join Our Community</h3>
          <div className="flex justify-center gap-3 mb-1">
            <a href="https://discord.gg/your-discord" target="_blank" rel="noopener" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-5 py-2 rounded-lg font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary">
              <FaDiscord className="w-5 h-5" style={{ color: '#94a3b8' }} />
              Discord
            </a>
          </div>
        </section>
        {/* Competitions Placeholder */}
        <section className="w-full">
          <h3 className="text-base font-semibold mb-2 text-slate-300">Typing Competitions</h3>
          <div className="bg-slate-700/80 rounded-lg p-3 text-xs text-slate-300 border border-slate-600">Competitions and challenge system coming soon!</div>
        </section>
        {/* Embeddable Widget */}
        <section className="w-full">
          <h3 className="text-base font-semibold mb-2 text-slate-300">Embeddable Widget</h3>
          <div className="flex items-center gap-2 mb-1">
            <textarea className="w-full border border-slate-600 bg-slate-700 text-slate-100 rounded p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" rows={2} value={widgetCode} readOnly />
            <button
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150 ${copiedWidget ? 'bg-green-500 text-slate-900' : 'bg-primary text-slate-900 hover:opacity-90'}`}
              onClick={handleCopyWidget}
              type="button"
            >
              {copiedWidget ? <Check className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />} {copiedWidget ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="text-xs text-slate-400">Copy and paste this code to embed a typing test widget on your site or LMS.</div>
        </section>
      </section>
    </MinimalGrowthOverlay>
  );
} 