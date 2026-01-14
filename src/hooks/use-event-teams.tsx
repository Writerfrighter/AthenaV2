'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { indexedDBService } from '@/lib/indexeddb-service';

export interface TeamInfo {
  teamNumber: number;
  nickname: string;
  key: string;
}

interface TeamState {
  teams: TeamInfo[];
  loading: boolean;
  error: string | null;
  isOfflineData: boolean;
}

export function useEventTeams() {
  const selectedEvent = useSelectedEvent();
  const { competitionType, currentYear } = useGameConfig();
  const [teamState, setTeamState] = useState<TeamState>({
    teams: [],
    loading: false,
    error: null,
    isOfflineData: false,
  });

  useEffect(() => {
    async function fetchTeams() {
      if (!selectedEvent?.code) {
        setTeamState({
          teams: [],
          loading: false,
          error: null,
          isOfflineData: false,
        });
        return;
      }

      setTeamState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // If offline, try to get cached data first
      if (!isOnline) {
        try {
          const cachedData = await indexedDBService.getCachedEventTeams(selectedEvent.code);
          if (cachedData && cachedData.teams.length > 0) {
            setTeamState({
              teams: cachedData.teams.sort((a, b) => a.teamNumber - b.teamNumber),
              loading: false,
              error: null,
              isOfflineData: true,
            });
            return;
          }
        } catch (cacheError) {
          console.warn('Failed to get cached teams:', cacheError);
        }

        // No cached data available while offline
        setTeamState({
          teams: [],
          loading: false,
          error: 'Offline - no cached team data available. Connect to internet to download team list.',
          isOfflineData: false,
        });
        return;
      }

      try {
        // Fetch data from our server-side API route with competition type
        const response = await fetch(`/api/events/${selectedEvent.code}/teams?competitionType=${competitionType}&year=${currentYear}`);
      
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

        const sortedTeams = teams.sort((a, b) => a.teamNumber - b.teamNumber);

        // Cache the teams for offline use
        try {
          await indexedDBService.cacheEventTeams(
            selectedEvent.code,
            competitionType,
            currentYear,
            sortedTeams
          );
        } catch (cacheError) {
          console.warn('Failed to cache teams:', cacheError);
        }

        setTeamState({
          teams: sortedTeams,
          loading: false,
          error: null,
          isOfflineData: false,
        });
      } catch (error) {
        console.error('Error fetching teams:', error);
        
        // Try to fall back to cached data on fetch error
        try {
          const cachedData = await indexedDBService.getCachedEventTeams(selectedEvent.code);
          if (cachedData && cachedData.teams.length > 0) {
            setTeamState({
              teams: cachedData.teams.sort((a, b) => a.teamNumber - b.teamNumber),
              loading: false,
              error: null,
              isOfflineData: true,
            });
            return;
          }
        } catch (cacheError) {
          console.warn('Failed to get cached teams on error fallback:', cacheError);
        }

        setTeamState({
          teams: [],
          loading: false,
          error: `Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isOfflineData: false,
        });
      }
    }

    fetchTeams();
  }, [selectedEvent?.code, competitionType, currentYear]);

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
