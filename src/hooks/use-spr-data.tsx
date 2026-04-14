'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';

export interface ScouterSPR {
  scouterId: string;
  scouterName: string | null;
  errorValue: number;
  matchesScounted: number;
  percentile: number;
  totalAbsoluteError: number;
}

export interface SPRVerboseEquation {
  matchNumber: number;
  alliance: 'red' | 'blue';
  scouterIds: string[];
  scouterNames?: string[];
  robotCount: number;
  expectedRobots: number;
  scoutedTotal: number;
  officialScore: number;
  foulPoints: number;
  adjustedOfficial: number;
  error: number;
  skipped: boolean;
  skipReason?: string;
}

export interface SPRVerboseData {
  equations: SPRVerboseEquation[];
  totalEquations: number;
  skippedEquations: number;
  usedEquations: number;
}

export interface SPRData {
  scouters: ScouterSPR[];
  overallMeanError: number;
  convergenceAchieved: boolean;
  message?: string;
  verboseData?: SPRVerboseData;
  metadata: {
    totalMatches: number;
    uniqueScouters: number;
    officialResultsCount: number;
    eventCode: string;
    year: number;
    competitionType: string;
  };
}

export function useSPRData(options?: { verbose?: boolean }) {
  const verbose = options?.verbose ?? false;
  const selectedEvent = useSelectedEvent();
  const { currentYear, competitionType } = useGameConfig();
  const [data, setData] = useState<SPRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSPR = useCallback(async () => {
    if (!selectedEvent || !currentYear) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        year: currentYear.toString(),
        eventCode: selectedEvent.code,
        competitionType: competitionType,
        verbose: verbose ? 'true' : 'false',
      });

      const response = await fetch(`/api/database/spr?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch SPR data (${response.status})`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.data?.message || 'SPR calculation did not converge');
      }

      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, currentYear, competitionType, verbose]);

  useEffect(() => {
    fetchSPR();
  }, [fetchSPR]);

  return { data, loading, error, refetch: fetchSPR };
}
