'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { getEventTeamsInfo, getEventTeamNumbers } from '@/lib/api/tba';

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
        // Check if we have a TBA API key
        if (!process.env.NEXT_PUBLIC_TBA_API_KEY && !process.env.TBA_API_KEY) {
          // Fallback to mock data if no API key
          console.warn('No TBA API key found, using mock data');
          setTeamState({
            teams: getMockTeams(selectedEvent.code),
            loading: false,
            error: null,
          });
          return;
        }

        // Fetch real data from TBA
        const teamsInfo = await getEventTeamsInfo(selectedEvent.code);
        const teams: TeamInfo[] = Object.entries(teamsInfo).map(([key, info]) => ({
          teamNumber: info.team_number,
          nickname: info.nickname,
          key,
        }));

        setTeamState({
          teams: teams.sort((a, b) => a.teamNumber - b.teamNumber),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching teams:', error);
        
        // Fallback to mock data on error
        setTeamState({
          teams: getMockTeams(selectedEvent.code),
          loading: false,
          error: `Failed to fetch teams from TBA. Using mock data.`,
        });
      }
    }

    fetchTeams();
  }, [selectedEvent?.code]);

  return teamState;
}

// Mock data for development and fallback
function getMockTeams(eventCode: string): TeamInfo[] {
  const baseMockTeams = [
    { teamNumber: 254, nickname: "The Cheesy Poofs", key: "frc254" },
    { teamNumber: 1678, nickname: "Citrus Circuits", key: "frc1678" },
    { teamNumber: 2056, nickname: "OP Robotics", key: "frc2056" },
    { teamNumber: 4499, nickname: "The Highlanders", key: "frc4499" },
    { teamNumber: 6995, nickname: "Nomad Stormz", key: "frc6995" },
    { teamNumber: 1983, nickname: "Skunk Works Robotics", key: "frc1983" },
    { teamNumber: 3219, nickname: "Team Titanium", key: "frc3219" },
    { teamNumber: 360, nickname: "The Revolution", key: "frc360" },
    { teamNumber: 1540, nickname: "The Flaming Chickens", key: "frc1540" },
    { teamNumber: 5687, nickname: "The Outliers", key: "frc5687" },
  ];

  // Add some event-specific variation
  const eventVariations: Record<string, TeamInfo[]> = {
    '2025pncmp': [
      ...baseMockTeams,
      { teamNumber: 847, nickname: "PHRED", key: "frc847" },
      { teamNumber: 1318, nickname: "Issaquah Robotics Society", key: "frc1318" },
      { teamNumber: 2930, nickname: "Sonic Squirrels", key: "frc2930" },
    ],
    '2025wasam': [
      ...baseMockTeams.slice(0, 8),
      { teamNumber: 1510, nickname: "Wild Cards", key: "frc1510" },
      { teamNumber: 2927, nickname: "Team Optimus", key: "frc2927" },
    ],
    '2025wayak': [
      ...baseMockTeams.slice(0, 6),
      { teamNumber: 1890, nickname: "S.P.A.M.", key: "frc1890" },
      { teamNumber: 4091, nickname: "Highlander Robotics", key: "frc4091" },
      { teamNumber: 5803, nickname: "Aluminati", key: "frc5803" },
    ],
  };

  return eventVariations[eventCode] || baseMockTeams;
}

// Hook to get just team numbers for dropdowns
export function useEventTeamNumbers(): number[] {
  const { teams } = useEventTeams();
  return teams.map(team => team.teamNumber);
}

// Hook to get team info by number
export function useTeamInfo(teamNumber: number): TeamInfo | null {
  const { teams } = useEventTeams();
  return teams.find(team => team.teamNumber === teamNumber) || null;
}
