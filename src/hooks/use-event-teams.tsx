'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';

export interface TeamInfo {
  teamNumber: number;
  nickname: string;
  key: string;
}

interface TeamState {
  teams: TeamInfo[];
  loading: boolean;
  error: string | null;
}

export function useEventTeams() {
  const selectedEvent = useSelectedEvent();
  const { competitionType } = useGameConfig();
  const [teamState, setTeamState] = useState<TeamState>({
    teams: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    async function fetchTeams() {
      if (!selectedEvent?.code) {
        setTeamState({
          teams: [],
          loading: false,
          error: null,
        });
        return;
      }

      setTeamState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        // Fetch data from our server-side API route with competition type
        const response = await fetch(`/api/events/${selectedEvent.code}/teams?competitionType=${competitionType}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // The API route returns teams with team_number, nickname, etc.
        const teams: TeamInfo[] = (data || []).map((team: { team_number: number; nickname?: string; key?: string }) => ({
          teamNumber: team.team_number,
          nickname: team.nickname || `Team ${team.team_number}`,
          key: team.key || `${competitionType.toLowerCase()}${team.team_number}`,
        }));

        setTeamState({
          teams: teams.sort((a, b) => a.teamNumber - b.teamNumber),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching teams:', error);
        
        setTeamState({
          teams: [],
          loading: false,
          error: `Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    fetchTeams();
  }, [selectedEvent?.code, competitionType]);

  return teamState;
}

// Hook to get just team numbers for dropdowns
export function useEventTeamNumbers(): number[] {
  const { teams } = useEventTeams();
  return teams
    .map(team => team.teamNumber)
    .filter(teamNumber => teamNumber && teamNumber > 0);
}

// Hook to get team info by number
export function useTeamInfo(teamNumber: number): TeamInfo | null {
  const { teams } = useEventTeams();
  return teams.find(team => team.teamNumber === teamNumber) || null;
}
