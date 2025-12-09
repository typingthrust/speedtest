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
  { value: 'grey', name: 'Grey', color: 'bg-gray-400' },
  { value: 'dark', name: 'Dark', color: 'bg-gray-900' },
  { value: 'white', name: 'White', color: 'bg-white border border-gray-300' },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        aria-label="Theme selector"
        className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg rounded-full p-3 flex items-center justify-center transition-all duration-200 hover:bg-muted hover:scale-105 hover:shadow-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Palette className="w-5 h-5 text-foreground" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-16 right-0 bg-card border border-border rounded-2xl shadow-2xl p-4 min-w-[240px] z-50 backdrop-blur-sm">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Theme Color</div>
            <div className="grid grid-cols-5 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setIsOpen(false);
                  }}
                  className={`relative w-10 h-10 rounded-xl transition-all duration-200 overflow-hidden border-2 bg-card ${
                    theme === t.value
                      ? 'border-primary scale-105 shadow-lg shadow-primary/20'
                      : 'border-border/50 hover:border-border hover:scale-102'
                  }`}
                  aria-label={`Select ${t.name} theme`}
                >
                  <div className={`absolute inset-[2px] rounded-lg ${t.color} ${theme === t.value ? 'opacity-100' : 'opacity-95'}`} />
                  {theme === t.value && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${t.value === 'white' ? 'bg-white/20' : 'bg-black/10'}`}>
                      <svg className={`w-4 h-4 ${t.value === 'white' ? 'text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground px-1 font-medium">{themes.find(t => t.value === theme)?.name} selected</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

