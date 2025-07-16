import React, { useState } from 'react';

const QWERTY_LAYOUT = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Del'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Meta', 'Alt', 'Space', 'Alt', 'Meta', 'Menu', 'Ctrl']
];

const KEY_DISPLAY = {
  'Meta': '⌘',
  'Ctrl': 'Ctrl',
  'Alt': 'Alt',
  'Shift': 'Shift',
  'Tab': 'Tab',
  'CapsLock': 'Caps',
  'Backspace': '⌫',
  'Enter': '⏎',
  'Space': '',
  'Del': 'Del',
  'Menu': 'Menu',
  '`': '`',
};

function interpolateColor(color1: string, color2: string, factor: number) {
  // color1, color2: hex strings, factor: 0-1
  const c1 = color1.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0,0,0];
  const c2 = color2.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0,0,0];
  const result = c1.map((v, i) => Math.round(v + (c2[i] - v) * factor));
  return `#${result.map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export interface KeyboardHeatmapProps {
  keyStats: Record<string, number>;
  keyDetails?: Record<string, { errorRate?: number; lastErrorDate?: string }>;
  title?: string;
  className?: string;
  minimal?: boolean;
}

const KeyboardHeatmap: React.FC<KeyboardHeatmapProps> = ({ keyStats, keyDetails = {}, title = 'Keyboard Heatmap', className, minimal }) => {
  // Normalize keyStats to uppercase for letters
  const stats = Object.fromEntries(
    Object.entries(keyStats).map(([k, v]) => [k.length === 1 ? k.toUpperCase() : k, v])
  );
  // Find max/min for color scaling
  const allCounts = Object.values(stats);
  const maxCount = Math.max(1, ...allCounts);
  const minCount = Math.min(0, ...allCounts);
  // Color scale: light grey (low) to dark grey/black (high)
  const colorLow = '#f3f4f6'; // Tailwind gray-100
  const colorHigh = '#111111'; // Black

  return (
    <div className="w-full max-w-2xl mx-auto mt-2 p-4 bg-white rounded-2xl shadow flex flex-col items-center">
      <div className="text-sm font-semibold text-gray-500 mb-2">Key Press Heatmap</div>
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#fef9c3'}}></span>Low</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#fde047'}}></span>Medium</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#f59e42'}}></span>High</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#dc2626'}}></span>Most</span>
      </div>
      {/* Remove any extra box or border around the keyboard area */}
      <div className="space-y-2">
        {QWERTY_LAYOUT.map((row, i) => (
          <div key={i} className="flex justify-center gap-3">
            {row.map(k => {
              const count = stats[k] || (k === 'Space' ? stats[' '] : 0) || 0;
              const factor = maxCount === minCount ? 0 : (count - minCount) / (maxCount - minCount);
              // Interpolate color from light to dark
              let color = colorLow;
              if (maxCount > 0) {
                color = interpolateColor(colorLow.replace('#', ''), colorHigh.replace('#', ''), factor);
              }
              // If all counts are zero, use a very light grey
              if (maxCount === 0) {
                color = '#f8fafc'; // Tailwind gray-50
              }
              const display = KEY_DISPLAY[k] !== undefined ? KEY_DISPLAY[k] : k;
              const isWide = k === 'Space';
              return (
                <div
                  key={k}
                  title={`${k}: ${count} presses`}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${isWide ? 'w-24 xs:w-32 sm:w-48' : 'w-7 xs:w-9 sm:w-10'}`}
                  style={{ background: color, color: count ? '#b45309' : '#9ca3af', border: 'none', boxShadow: 'none' }}
                >
                  {display || <span className="opacity-40">Space</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardHeatmap; 