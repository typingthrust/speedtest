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
    const themeValues: Record<ThemeColor, { 
      primary: string; 
      hover: string; 
      light: string;
      background: string; // Main background (slate-900 equivalent with theme tint)
      card: string; // Card background (slate-800 equivalent)
      border: string; // Border color (slate-700 equivalent)
      muted: string; // Muted background (slate-700 equivalent)
    }> = {
      blue: { 
        primary: '217 91% 60%', 
        hover: '217 91% 55%', 
        light: '217 91% 70%',
        background: '217 30% 12%', // Blue-tinted dark background
        card: '217 28% 17%', // Blue-tinted card
        border: '217 25% 20%', // Blue-tinted border
        muted: '217 25% 18%', // Blue-tinted muted
      },
      green: { 
        primary: '142 71% 45%', 
        hover: '142 71% 40%', 
        light: '142 71% 55%',
        background: '142 30% 12%', // Green-tinted dark background
        card: '142 28% 17%', // Green-tinted card
        border: '142 25% 20%', // Green-tinted border
        muted: '142 25% 18%', // Green-tinted muted
      },
      purple: { 
        primary: '262 83% 58%', 
        hover: '262 83% 53%', 
        light: '262 83% 63%',
        background: '262 30% 12%', // Purple-tinted dark background
        card: '262 28% 17%', // Purple-tinted card
        border: '262 25% 20%', // Purple-tinted border
        muted: '262 25% 18%', // Purple-tinted muted
      },
      orange: { 
        primary: '25 95% 53%', 
        hover: '25 95% 48%', 
        light: '25 95% 58%',
        background: '25 30% 12%', // Orange-tinted dark background
        card: '25 28% 17%', // Orange-tinted card
        border: '25 25% 20%', // Orange-tinted border
        muted: '25 25% 18%', // Orange-tinted muted
      },
      red: { 
        primary: '0 72% 51%', 
        hover: '0 72% 46%', 
        light: '0 72% 56%',
        background: '0 30% 12%', // Red-tinted dark background
        card: '0 28% 17%', // Red-tinted card
        border: '0 25% 20%', // Red-tinted border
        muted: '0 25% 18%', // Red-tinted muted
      },
      teal: { 
        primary: '173 80% 40%', 
        hover: '173 80% 35%', 
        light: '173 80% 45%',
        background: '173 30% 12%', // Teal-tinted dark background
        card: '173 28% 17%', // Teal-tinted card
        border: '173 25% 20%', // Teal-tinted border
        muted: '173 25% 18%', // Teal-tinted muted
      },
      indigo: { 
        primary: '239 84% 67%', 
        hover: '239 84% 62%', 
        light: '239 84% 72%',
        background: '239 30% 12%', // Indigo-tinted dark background
        card: '239 28% 17%', // Indigo-tinted card
        border: '239 25% 20%', // Indigo-tinted border
        muted: '239 25% 18%', // Indigo-tinted muted
      },
      pink: { 
        primary: '330 81% 60%', 
        hover: '330 81% 55%', 
        light: '330 81% 65%',
        background: '330 30% 12%', // Pink-tinted dark background
        card: '330 28% 17%', // Pink-tinted card
        border: '330 25% 20%', // Pink-tinted border
        muted: '330 25% 18%', // Pink-tinted muted
      },
    };
    
    const colors = themeValues[theme];
    // Set theme variables
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-hover', colors.hover);
    document.documentElement.style.setProperty('--theme-primary-light', colors.light);
    // Set background colors with theme tint
    document.documentElement.style.setProperty('--theme-background', colors.background);
    document.documentElement.style.setProperty('--theme-card', colors.card);
    document.documentElement.style.setProperty('--theme-border', colors.border);
    document.documentElement.style.setProperty('--theme-muted', colors.muted);
    // Also update --primary to use theme color
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--ring', colors.primary);
    // Update background and card colors (ONLY backgrounds change with theme)
    document.documentElement.style.setProperty('--background', colors.background);
    document.documentElement.style.setProperty('--card', colors.card);
    document.documentElement.style.setProperty('--border', colors.border);
    document.documentElement.style.setProperty('--muted', colors.muted);
    document.documentElement.style.setProperty('--secondary', colors.muted);
    document.documentElement.style.setProperty('--accent', colors.muted);
    document.documentElement.style.setProperty('--input', colors.border);
    // IMPORTANT: Text colors stay light/white - DO NOT change with theme
    // --foreground, --muted-foreground, etc. remain constant for readability
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

