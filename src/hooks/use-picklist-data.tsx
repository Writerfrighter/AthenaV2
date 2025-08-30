'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { statsApi } from '@/lib/api/database-client';

export interface PicklistTeam {
  id: string;
  name: string;
  rank: number;
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
  totalEPA: number;
}

export function usePicklistData() {
  const selectedEvent = useSelectedEvent();
  const { currentYear, getCurrentYearConfig } = useGameConfig();
  const gameConfig = getCurrentYearConfig();
  const [teams, setTeams] = useState<PicklistTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPicklistData() {
      if (!selectedEvent || !gameConfig) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch picklist data from API
        const apiData = await statsApi.getPicklistData(currentYear, selectedEvent.code);

        // Transform API response to hook format
        const transformedTeams: PicklistTeam[] = apiData.teams.map(team => ({
          id: team.teamNumber.toString(),
          name: team.name,
          rank: team.rank,
          autoEPA: team.autoEPA,
          teleopEPA: team.teleopEPA,
          endgameEPA: team.endgameEPA,
          totalEPA: team.totalEPA
        }));

        setTeams(transformedTeams);
      } catch (err) {
        console.error('Error fetching picklist data:', err);
        setError('Failed to load picklist data');
      } finally {
        setLoading(false);
      }
    }

    fetchPicklistData();
  }, [selectedEvent?.code, currentYear, gameConfig]);

  return { teams, loading, error };
}
