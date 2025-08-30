'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { statsApi } from '@/lib/api/database-client';

export interface AnalysisStats {
  teamsAnalyzed: number;
  highestEPA: number;
  averageEPA: number;
  dataPoints: number;
  teamEPAData: Array<{
    team: string;
    auto: number;
    teleop: number;
    endgame: number;
    penalties: number;
    totalEPA: number;
  }>;
}

export function useAnalysisStats() {
  const selectedEvent = useSelectedEvent();
  const { currentYear, getCurrentYearConfig } = useGameConfig();
  const gameConfig = getCurrentYearConfig();
  const [stats, setStats] = useState<AnalysisStats>({
    teamsAnalyzed: 0,
    highestEPA: 0,
    averageEPA: 0,
    dataPoints: 0,
    teamEPAData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysisStats() {
      if (!selectedEvent || !gameConfig) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch analysis data from API
        const apiStats = await statsApi.getAnalysisData(currentYear, selectedEvent.code);

        // Transform API response to hook format
        const transformedStats: AnalysisStats = {
          teamsAnalyzed: apiStats.totalTeams,
          highestEPA: Math.max(...apiStats.teamEPAData.map(team => team.totalEPA)),
          averageEPA: apiStats.teamEPAData.reduce((sum, team) => sum + team.avgEPA, 0) / apiStats.teamEPAData.length,
          dataPoints: apiStats.totalMatches,
          teamEPAData: apiStats.teamEPAData.map(team => ({
            team: team.teamNumber.toString(),
            auto: 0, // API doesn't provide breakdown yet
            teleop: 0, // API doesn't provide breakdown yet
            endgame: 0, // API doesn't provide breakdown yet
            penalties: 0, // API doesn't provide breakdown yet
            totalEPA: team.totalEPA
          }))
        };

        setStats(transformedStats);
      } catch (err) {
        console.error('Error fetching analysis stats:', err);
        setError('Failed to load analysis statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysisStats();
  }, [selectedEvent?.code, currentYear, gameConfig]);

  return { stats, loading, error };
}
