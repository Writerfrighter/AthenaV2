'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { statsApi } from '@/lib/api/database-client';
// We'll call a server-side proxy route instead of calling TBA directly from the client
// to avoid CORS and exposing the TBA API key.

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
  const { currentYear, getCurrentYearConfig, competitionType } = useGameConfig();
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

        // Fetch qualification matches count from our server-side proxy
        let qualMatchesCount = 0;
        
        // For FTC, skip TBA API and go directly to custom events or FTC API
        if (competitionType === 'FTC') {
          try {
            const customEventResp = await fetch(`/api/database/custom-events?eventCode=${encodeURIComponent(selectedEvent.code)}&competitionType=${competitionType}`);
            if (customEventResp.ok) {
              const customEvent = await customEventResp.json();
              qualMatchesCount = customEvent?.matchCount ?? 0;
              console.log(`Using FTC custom event match count: ${qualMatchesCount}`);
            } else {
              console.warn('FTC custom event lookup failed, using 0');
            }
          } catch (customEventError) {
            console.warn('FTC custom event error:', customEventError);
          }
        } else {
          // For FRC, use TBA API
          try {
            const proxyResp = await fetch(`/api/tba/qualification-matches?eventCode=${encodeURIComponent(selectedEvent.code)}`);
            if (proxyResp.ok) {
              const proxyData = await proxyResp.json();
              qualMatchesCount = proxyData?.qualMatchesCount ?? 0;
            } else {
              // If TBA API fails, try to get match count from custom events
              console.warn('TBA API failed, falling back to custom event data');
              const customEventResp = await fetch(`/api/database/custom-events?eventCode=${encodeURIComponent(selectedEvent.code)}`);
              if (customEventResp.ok) {
                const customEvent = await customEventResp.json();
                qualMatchesCount = customEvent?.matchCount ?? 0;
                console.log(`Using custom event match count: ${qualMatchesCount}`);
              } else {
                console.warn('Custom event fallback also failed, using 0');
              }
            }
          } catch (tbaError) {
            console.warn('TBA API error, attempting custom event fallback:', tbaError);
            try {
              // If TBA API fails, try to get match count from custom events
              const customEventResp = await fetch(`/api/database/custom-events?eventCode=${encodeURIComponent(selectedEvent.code)}`);
              if (customEventResp.ok) {
                const customEvent = await customEventResp.json();
                qualMatchesCount = customEvent?.matchCount ?? 0;
                console.log(`Using custom event match count: ${qualMatchesCount}`);
              } else {
                console.warn('Custom event fallback also failed, using 0');
              }
            } catch (customEventError) {
              console.warn('Both TBA and custom event fallback failed:', customEventError);
            }
          }
        }
        // const qualMatchesCount = 0;
        // Fetch stats from API
        const apiStats = await statsApi.getDashboardStats(currentYear, selectedEvent.code, competitionType);

        // Transform API response to hook format
        const transformedStats: DashboardStats = {
          teamsScouted: apiStats.totalTeams,
          matchesRecorded: apiStats.totalMatches,
          dataQuality: apiStats.matchCompletion ?? 0,
          ranking: apiStats.teamStats.findIndex(team => team.teamNumber === (competitionType === 'FRC' ? 492 : 3543)) + 1 || 0,
          pitScoutingProgress: {
            current: apiStats.totalPitScouts,
            total: apiStats.totalTeams
          },
          qualificationProgress: {
            current: apiStats.uniqueMatches,
            total: qualMatchesCount
          },
          nextMatch: null, // Could be calculated from schedule
          recentActivity: apiStats.recentActivity.map(activity => ({
            type: 'match' as const,
            message: `Match ${activity.matchNumber} scouted for Team ${activity.teamNumber}`,
            timestamp: new Date(activity.timestamp)
          })),
          topTeams: apiStats.teamStats.slice(0, 5).map(team => ({
            teamNumber: team.teamNumber,
            name: team.name,
            epa: isNaN(team.totalEPA) ? 0 : team.totalEPA
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
  }, [selectedEvent, currentYear, gameConfig, competitionType]);

  return { stats, loading, error };
}
