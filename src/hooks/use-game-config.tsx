'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import gameConfig from '../../config/game-config.json';
import type { YearConfig, GameConfig } from '@/lib/shared-types';

interface GameConfigContextType {
  config: GameConfig;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  getCurrentYearConfig: () => YearConfig | undefined;
}

interface GameConfigContextType {
  config: GameConfig;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  getCurrentYearConfig: () => YearConfig | undefined;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export function GameConfigProvider({ children }: { children: ReactNode }) {
  const config = gameConfig as GameConfig;
  const [currentYear, setCurrentYear] = useState<number>(2025); // Default to current season

  // Persist year selection to localStorage
  useEffect(() => {
    const savedYear = localStorage.getItem('selectedGameYear');
    if (savedYear) {
      setCurrentYear(parseInt(savedYear));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedGameYear', currentYear.toString());
  }, [currentYear]);

  const getCurrentYearConfig = () => {
    return config[currentYear.toString()];
  };

  return (
    <GameConfigContext.Provider value={{
      config,
      currentYear,
      setCurrentYear,
      getCurrentYearConfig
    }}>
      {children}
    </GameConfigContext.Provider>
  );
}

export function useGameConfig() {
  const context = useContext(GameConfigContext);
  if (context === undefined) {
    throw new Error('useGameConfig must be used within a GameConfigProvider');
  }
  return context;
}

export function useCurrentGameConfig() {
  const { getCurrentYearConfig } = useGameConfig();
  return getCurrentYearConfig();
}
