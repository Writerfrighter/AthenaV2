'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { statsApi, DashboardStats as ApiDashboardStats } from '@/lib/api/database-client';

export interface DashboardStats {
  teamsScouted: number;
  matchesRecorded: number;
  dataQuality: number;
  ranking: number;
  pitScoutingProgress: { current: number; total: number };
  qualificationProgress: { current: number; total: number };
  nextMatch: string | null;
  recentActivity: Array<{
    type: 'pit' | 'match' | 'analysis';
    message: string;
    timestamp: Date;
  }>;
  topTeams: Array<{
    teamNumber: number;
    name: string;
    epa: number;
  }>;
}

export function useDashboardStats() {
  const selectedEvent = useSelectedEvent();
  const { currentYear, getCurrentYearConfig } = useGameConfig();
  const gameConfig = getCurrentYearConfig();
  const [stats, setStats] = useState<DashboardStats>({
    teamsScouted: 0,
    matchesRecorded: 0,
    dataQuality: 0,
    ranking: 0,
    pitScoutingProgress: { current: 0, total: 0 },
    qualificationProgress: { current: 0, total: 0 },
    nextMatch: null,
    recentActivity: [],
    topTeams: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedEvent || !gameConfig) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch stats from API
        const apiStats = await statsApi.getDashboardStats(currentYear, selectedEvent.code);

        // Transform API response to hook format
        const transformedStats: DashboardStats = {
          teamsScouted: apiStats.totalTeams,
          matchesRecorded: apiStats.totalMatches,
          dataQuality: Math.min(100, (apiStats.totalPitScouts / apiStats.totalTeams) * 100), // Simple data quality calculation
          ranking: 0, // Could be calculated based on team performance
          pitScoutingProgress: {
            current: apiStats.totalPitScouts,
            total: apiStats.totalTeams
          },
          qualificationProgress: {
            current: Math.floor(apiStats.totalMatches / 6), // Assuming 6 matches per team
            total: apiStats.totalTeams
          },
          nextMatch: null, // Could be calculated from schedule
          recentActivity: apiStats.recentActivity.map(activity => ({
            type: 'match' as const,
            message: `Match ${activity.matchNumber} scouted for Team ${activity.teamNumber}`,
            timestamp: new Date(activity.timestamp)
          })),
          topTeams: apiStats.topTeams.slice(0, 5).map(team => ({
            teamNumber: team.teamNumber,
            name: team.name,
            epa: isNaN(team.avgEPA) ? 0 : team.avgEPA
          }))
        };

        setStats(transformedStats);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [selectedEvent, currentYear, gameConfig]);

  return { stats, loading, error };
}
