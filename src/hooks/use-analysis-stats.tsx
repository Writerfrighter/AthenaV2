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
  const { currentYear, getCurrentYearConfig, competitionType } = useGameConfig();
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
        const apiStats = await statsApi.getAnalysisData(currentYear, selectedEvent.code, competitionType);

        // Transform API response to hook format
        const transformedStats: AnalysisStats = {
          teamsAnalyzed: apiStats.totalTeams,
          highestEPA: parseFloat(Math.max(...apiStats.teamEPAData.map(team => team.totalEPA)).toFixed(3)),
          averageEPA: parseFloat((apiStats.teamEPAData.reduce((sum, team) => sum + team.totalEPA, 0) / apiStats.teamEPAData.length).toFixed(3)),
          dataPoints: apiStats.totalMatches,
          teamEPAData: apiStats.teamEPAData.map(team => ({
            team: team.teamNumber.toString(),
            auto: parseFloat((team.autoEPA || 0).toFixed(3)),
            teleop: parseFloat((team.teleopEPA || 0).toFixed(3)),
            endgame: parseFloat((team.endgameEPA || 0).toFixed(3)),
            penalties: parseFloat((team.penaltiesEPA || 0).toFixed(3)),
            totalEPA: parseFloat(team.totalEPA.toFixed(3))
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
  }, [selectedEvent, currentYear, gameConfig, competitionType]);

  return { stats, loading, error };
}
