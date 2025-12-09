import { ThemeColor } from '../components/ThemeProvider';

// Theme color mappings - solid, professional colors
export const themeColors: Record<ThemeColor, {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
}> = {
  blue: {
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    primaryLight: 'bg-blue-400',
    primaryText: 'text-blue-500',
  },
  green: {
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    primaryLight: 'bg-green-500',
    primaryText: 'text-green-600',
  },
  purple: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-500',
    primaryText: 'text-purple-600',
  },
  orange: {
    primary: 'bg-orange-500',
    primaryHover: 'hover:bg-orange-600',
    primaryLight: 'bg-orange-400',
    primaryText: 'text-orange-500',
  },
  red: {
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    primaryLight: 'bg-red-500',
    primaryText: 'text-red-600',
  },
  teal: {
    primary: 'bg-teal-700',
    primaryHover: 'hover:bg-teal-800',
    primaryLight: 'bg-teal-600',
    primaryText: 'text-teal-700',
  },
  indigo: {
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    primaryLight: 'bg-indigo-400',
    primaryText: 'text-indigo-500',
  },
  pink: {
    primary: 'bg-pink-500',
    primaryHover: 'hover:bg-pink-600',
    primaryLight: 'bg-pink-400',
    primaryText: 'text-pink-500',
  },
  grey: {
    primary: 'bg-gray-500',
    primaryHover: 'hover:bg-gray-600',
    primaryLight: 'bg-gray-400',
    primaryText: 'text-gray-500',
  },
  dark: {
    primary: 'bg-gray-700',
    primaryHover: 'hover:bg-gray-800',
    primaryLight: 'bg-gray-600',
    primaryText: 'text-gray-300',
  },
  white: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-500',
    primaryText: 'text-blue-600',
  },
};

// Get theme color classes
export const getThemeColors = (theme: ThemeColor) => themeColors[theme];

