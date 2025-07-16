import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define overlay types (expand as needed)
export type OverlayType = 'analytics' | 'gamification' | 'leaderboard' | 'profile' | 'zen' | 'content-library' | 'growth-tools' | 'auth' | null;

interface OverlayContextType {
  open: OverlayType;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState<OverlayType>(null);
  const openOverlay = (type: OverlayType) => setOpen(type);
  const closeOverlay = () => setOpen(null);
  return (
    <OverlayContext.Provider value={{ open, openOverlay, closeOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
};

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
} 