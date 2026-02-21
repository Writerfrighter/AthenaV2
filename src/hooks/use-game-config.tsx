'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import gameConfig from '../../config/game-config-loader';
import type { YearConfig, GameConfig, CompetitionType } from '@/lib/shared-types';

interface GameConfigContextType {
  config: GameConfig;
  currentYear: number;
  competitionType: CompetitionType;
  setCurrentYear: (year: number) => void;
  setCompetitionType: (type: CompetitionType) => void;
  getCurrentYearConfig: () => YearConfig | undefined;
  isInitialized: boolean;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export function GameConfigProvider({ children }: { children: ReactNode }) {
  const config = gameConfig as unknown as GameConfig;
  const [isInitialized, setIsInitialized] = useState(false);
  const [competitionType, setCompetitionTypeState] = useState<CompetitionType>('FRC');
  const [currentYear, setCurrentYear] = useState<number>(2025); // Default to current season

  // Persist competition type to localStorage
  useEffect(() => {
    const savedType = localStorage.getItem('selectedCompetitionType');
    if (savedType && (savedType === 'FRC' || savedType === 'FTC')) {
      setCompetitionTypeState(savedType as CompetitionType);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedCompetitionType', competitionType);
  }, [competitionType]);

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

  const setCompetitionType = (type: CompetitionType) => {
    setCompetitionTypeState(type);
    // Reset to latest available year when switching competition types
    const availableYears = Object.keys(config[type] || {});
    if (availableYears.length > 0) {
      const latestYear = Math.max(...availableYears.map(y => parseInt(y)));
      setCurrentYear(latestYear);
    }
  };

  const getCurrentYearConfig = () => {
    return config[competitionType]?.[currentYear.toString()];
  };

  return (
    <GameConfigContext.Provider value={{
      config,
      currentYear,
      competitionType,
      setCurrentYear,
      setCompetitionType,
      getCurrentYearConfig,
      isInitialized
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
