'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import gameConfig from '../../config/game-config.json';

export interface ScoringDefinition {
  label: string;
  description: string;
  // Simple scoring: use points for boolean values or as multiplier for numbers
  points?: number;
  // Enum scoring: use pointValues for string-based enum scoring
  // Example: pointValues: { "shallow": 3, "deep": 6, "none": 0 }
  pointValues?: Record<string, number>;
}

export interface YearConfig {
  gameName: string;
  scoring: {
    autonomous: Record<string, ScoringDefinition>;
    teleop: Record<string, ScoringDefinition>;
    endgame: Record<string, ScoringDefinition>;
  };
  pitScouting: {
    customFields: Array<{
      name: string;
      label: string;
      type: 'text' | 'number' | 'boolean' | 'select';
      options?: string[];
    }>;
  };
}

export interface GameConfig {
  [year: string]: YearConfig;
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
