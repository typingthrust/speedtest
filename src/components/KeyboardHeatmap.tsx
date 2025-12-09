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
  // Color scale: dark slate (low) to theme primary (high) for dark theme
  const colorLow = '#334155'; // slate-700
  // Get theme primary color and convert to hex for interpolation
  const getThemeColorHex = () => {
    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue('--primary').trim();
    if (primary) {
      const hsl = primary.split(' ').map(v => parseFloat(v));
      if (hsl.length === 3) {
        const [h, s, l] = hsl;
        const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l / 100 - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
    return '#3b82f6'; // fallback to blue-500
  };
  const colorHigh = getThemeColorHex();

  return (
    <div className="w-full max-w-2xl mx-auto mt-2 p-4 bg-slate-800 rounded-2xl shadow flex flex-col items-center">
      <div className="text-sm font-semibold text-slate-300 mb-2">Key Press Heatmap</div>
      <div className="flex gap-4 mb-4 text-xs text-slate-400">
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#334155'}}></span>Low</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:'#475569'}}></span>Medium</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:`hsl(var(--primary) / 0.6)`}}></span>High</span>
        <span className="flex items-center"><span className="inline-block w-4 h-4 rounded mr-1" style={{background:`hsl(var(--primary))`}}></span>Most</span>
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
              // If all counts are zero, use dark slate
              if (maxCount === 0) {
                color = '#334155'; // slate-700
              }
              const display = KEY_DISPLAY[k] !== undefined ? KEY_DISPLAY[k] : k;
              const isWide = k === 'Space';
              // Determine text color based on background brightness
              const bgBrightness = parseInt(color.replace('#', ''), 16);
              const textColor = bgBrightness > 0x888888 ? '#1e293b' : '#f1f5f9'; // dark text for light bg, light text for dark bg
              return (
                <div
                  key={k}
                  title={`${k}: ${count} presses`}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${isWide ? 'w-24 xs:w-32 sm:w-48' : 'w-7 xs:w-9 sm:w-10'}`}
                  style={{ background: color, color: count ? textColor : '#94a3b8', border: 'none', boxShadow: 'none' }}
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