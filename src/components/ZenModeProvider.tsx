import React, { createContext, useContext, useState, ReactNode } from 'react';

const ZenModeContext = createContext<{
  zen: boolean;
  toggleZen: () => void;
  setZen: (val: boolean) => void;
} | undefined>(undefined);

export const ZenModeProvider = ({ children }: { children: ReactNode }) => {
  const [zen, setZen] = useState(false);
  const toggleZen = () => setZen(z => !z);
  return (
    <ZenModeContext.Provider value={{ zen, toggleZen, setZen }}>
      {children}
    </ZenModeContext.Provider>
  );
};

export function useZenMode() {
  const ctx = useContext(ZenModeContext);
  if (!ctx) throw new Error('useZenMode must be used within ZenModeProvider');
  return ctx;
} 