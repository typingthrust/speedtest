import React, { useState } from 'react';
import { useTheme, ThemeColor } from './ThemeProvider';
import { Palette } from 'lucide-react';

const themes: { value: ThemeColor; name: string; color: string }[] = [
  { value: 'blue', name: 'Blue', color: 'bg-blue-500' },
  { value: 'green', name: 'Green', color: 'bg-green-500' },
  { value: 'purple', name: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', name: 'Orange', color: 'bg-orange-500' },
  { value: 'red', name: 'Red', color: 'bg-red-500' },
  { value: 'teal', name: 'Teal', color: 'bg-teal-500' },
  { value: 'indigo', name: 'Indigo', color: 'bg-indigo-500' },
  { value: 'pink', name: 'Pink', color: 'bg-pink-500' },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        aria-label="Theme selector"
        className="bg-slate-800 border border-slate-700 shadow-lg rounded-full p-3 flex items-center justify-center transition-colors hover:bg-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Palette className="w-5 h-5 text-slate-300" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-16 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 min-w-[200px] z-50">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-2">Theme Color</div>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setIsOpen(false);
                  }}
                  className={`relative p-3 rounded-lg transition-all ${
                    theme === t.value
                      ? 'ring-2 ring-slate-400 scale-105'
                      : 'hover:bg-slate-700'
                  }`}
                  aria-label={`Select ${t.name} theme`}
                >
                  <div className={`w-full h-full rounded ${t.color} ${theme === t.value ? 'opacity-100' : 'opacity-70'}`} />
                  {theme === t.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <div className="text-xs text-slate-400 px-2">{themes.find(t => t.value === theme)?.name} selected</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

