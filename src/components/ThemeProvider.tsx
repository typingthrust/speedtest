import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo' | 'pink';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-color') as ThemeColor;
      return saved || 'blue';
    }
    return 'blue';
  });

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme-color', theme);
    
    // Set CSS variables based on theme
    const themeValues: Record<ThemeColor, { primary: string; hover: string; light: string }> = {
      blue: { primary: '217 91% 60%', hover: '217 91% 55%', light: '217 91% 70%' },
      green: { primary: '142 71% 45%', hover: '142 71% 40%', light: '142 71% 55%' },
      purple: { primary: '262 83% 58%', hover: '262 83% 53%', light: '262 83% 63%' },
      orange: { primary: '25 95% 53%', hover: '25 95% 48%', light: '25 95% 58%' },
      red: { primary: '0 72% 51%', hover: '0 72% 46%', light: '0 72% 56%' },
      teal: { primary: '173 80% 40%', hover: '173 80% 35%', light: '173 80% 45%' },
      indigo: { primary: '239 84% 67%', hover: '239 84% 62%', light: '239 84% 72%' },
      pink: { primary: '330 81% 60%', hover: '330 81% 55%', light: '330 81% 65%' },
    };
    
    const colors = themeValues[theme];
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-hover', colors.hover);
    document.documentElement.style.setProperty('--theme-primary-light', colors.light);
  }, [theme]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

