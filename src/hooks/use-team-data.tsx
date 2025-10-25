'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { teamApi } from '@/lib/api/database-client';
import type { TeamData } from '@/lib/shared-types';

export function useTeamData(teamNumber: string) {
  const selectedEvent = useSelectedEvent();
  const { currentYear, competitionType } = useGameConfig();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch team data from API
        const data = await teamApi.getTeamData(
          parseInt(teamNumber), 
          currentYear, 
          selectedEvent?.code,
          competitionType
        );
        // console.log("Fetched team data:", data);

        setTeamData(data);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    }

    if (teamNumber && currentYear) {
      fetchTeamData();
    } else {
      setLoading(false);
    }
  }, [teamNumber, currentYear, selectedEvent?.code, competitionType]);

  return { teamData, loading, error };
}
