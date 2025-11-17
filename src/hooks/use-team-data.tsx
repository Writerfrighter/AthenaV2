'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Memoize dependencies to prevent unnecessary refetches
  const eventCode = useMemo(() => selectedEvent?.code, [selectedEvent?.code]);
  const configYear = useMemo(() => currentYear, [currentYear]);
  const teamNum = useMemo(() => teamNumber ? parseInt(teamNumber) : null, [teamNumber]);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch team data from API
        const data = await teamApi.getTeamData(
          teamNum!, 
          configYear, 
          eventCode,
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

    if (teamNum && configYear) {
      fetchTeamData();
    } else {
      setLoading(false);
    }
  }, [teamNum, configYear, eventCode, competitionType]);

  return { teamData, loading, error };
}
