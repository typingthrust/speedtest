import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CurrentTestData {
  wpm: number;
  accuracy: number;
  errorTypes: Record<string, number>;
  fingerUsage: Record<string, number>;
  keystrokeStats: { keyCounts: Record<string, number> };
  chartData: Array<{ x: number; y: number; acc: number }>;
}

const defaultCurrentTestData: CurrentTestData = {
  wpm: 0,
  accuracy: 100,
  errorTypes: {},
  fingerUsage: {},
  keystrokeStats: { keyCounts: {} },
  chartData: [],
};

const CurrentTestContext = createContext<{
  currentTestData: CurrentTestData;
  updateCurrentTestData: (data: Partial<CurrentTestData>) => void;
  resetCurrentTestData: () => void;
} | undefined>(undefined);

export const CurrentTestProvider = ({ children }: { children: ReactNode }) => {
  const [currentTestData, setCurrentTestData] = useState<CurrentTestData>(defaultCurrentTestData);

  const updateCurrentTestData = (data: Partial<CurrentTestData>) => {
    setCurrentTestData(prev => ({
      ...prev,
      ...data,
    }));
  };

  const resetCurrentTestData = () => {
    setCurrentTestData(defaultCurrentTestData);
  };

  return (
    <CurrentTestContext.Provider value={{ currentTestData, updateCurrentTestData, resetCurrentTestData }}>
      {children}
    </CurrentTestContext.Provider>
  );
};

export const useCurrentTest = () => {
  const context = useContext(CurrentTestContext);
  if (!context) {
    throw new Error('useCurrentTest must be used within a CurrentTestProvider');
  }
  return context;
}; 