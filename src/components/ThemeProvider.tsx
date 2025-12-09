import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo' | 'pink' | 'grey' | 'dark' | 'white';

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
      grey: { 
        primary: '0 0% 50%', // Neutral grey
        hover: '0 0% 45%', 
        light: '0 0% 60%',
        background: '0 0% 12%', // Pure dark grey background
        card: '0 0% 17%', // Slightly lighter grey card
        border: '0 0% 20%', // Grey border
        muted: '0 0% 18%', // Grey muted
      },
      dark: { 
        primary: '0 0% 65%', // Light grey for contrast on dark
        hover: '0 0% 60%', 
        light: '0 0% 70%',
        background: '0 0% 8%', // Almost black background
        card: '0 0% 11%', // Very dark card
        border: '0 0% 15%', // Dark border
        muted: '0 0% 10%', // Dark muted
      },
      white: { 
        primary: '217 91% 50%', // Blue for contrast on light
        hover: '217 91% 45%', 
        light: '217 91% 55%',
        background: '0 0% 98%', // Almost white background
        card: '0 0% 100%', // Pure white card
        border: '0 0% 90%', // Light grey border
        muted: '0 0% 95%', // Very light grey muted
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
    // Update background and card colors
    document.documentElement.style.setProperty('--background', colors.background);
    document.documentElement.style.setProperty('--card', colors.card);
    document.documentElement.style.setProperty('--border', colors.border);
    document.documentElement.style.setProperty('--muted', colors.muted);
    document.documentElement.style.setProperty('--secondary', colors.muted);
    document.documentElement.style.setProperty('--accent', colors.muted);
    document.documentElement.style.setProperty('--input', colors.border);
    
    // Calculate text colors based on background brightness (like monkeytype)
    // Extract lightness from HSL background color
    const bgLightness = parseFloat(colors.background.split(' ')[2]);
    const cardLightness = parseFloat(colors.card.split(' ')[2]);
    
    // Use the same hue as the theme for text colors, but adjust lightness for contrast
    // Extract hue and saturation from theme background
    const bgParts = colors.background.split(' ');
    const themeHue = bgParts[0];
    const themeSaturation = bgParts[1];
    
    // For grey, dark, and white themes, use neutral colors (0 saturation) for better readability
    const isNeutralTheme = theme === 'grey' || theme === 'dark' || theme === 'white';
    const textSaturation = isNeutralTheme ? '0%' : themeSaturation;
    
    // If background is dark (lightness < 25%), use light text with theme tint
    // If background is light (lightness >= 25%), use dark text with theme tint
    if (bgLightness < 25) {
      // Dark background - use light text with subtle theme tint
      // Light text: high lightness (85-95%), low saturation (5-15%) to keep it readable
      // For neutral themes, use pure grey for better contrast
      const saturation = isNeutralTheme ? '0%' : `${Math.min(15, parseFloat(themeSaturation))}%`;
      document.documentElement.style.setProperty('--foreground', `${themeHue} ${saturation} 92%`); // Light text with theme tint
      document.documentElement.style.setProperty('--muted-foreground', `${themeHue} ${isNeutralTheme ? '0%' : `${Math.min(20, parseFloat(themeSaturation))}%`} 60%`); // Medium gray with theme tint
      document.documentElement.style.setProperty('--card-foreground', `${themeHue} ${saturation} 92%`); // Light text with theme tint
    } else {
      // Light background (white theme) - use dark text with theme tint
      const saturation = isNeutralTheme ? '0%' : `${Math.min(30, parseFloat(themeSaturation))}%`;
      // For white theme, use darker text for better contrast
      const textLightness = theme === 'white' ? '10%' : '15%';
      const mutedLightness = theme === 'white' ? '35%' : '45%';
      document.documentElement.style.setProperty('--foreground', `${themeHue} ${saturation} ${textLightness}`); // Dark text with theme tint
      document.documentElement.style.setProperty('--muted-foreground', `${themeHue} ${isNeutralTheme ? '0%' : `${Math.min(25, parseFloat(themeSaturation))}%`} ${mutedLightness}`); // Medium gray with theme tint
      document.documentElement.style.setProperty('--card-foreground', `${themeHue} ${saturation} ${textLightness}`); // Dark text with theme tint
    }
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

