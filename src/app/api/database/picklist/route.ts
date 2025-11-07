import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService, CompetitionType } from '@/db/types';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';
import { calculateEPA } from '@/lib/statistics';
import gameConfigRaw from '../../../../../config/game-config.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameConfig = gameConfigRaw as any;

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

interface TeamPicklistData {
  teamNumber: number;
  driveTrain: string;
  weight: number;
  length: number;
  width: number;
  matchesPlayed: number;
  totalEPA: number;
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
}

// GET /api/database/picklist - Get ranked team list for picklist
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_PICKLIST)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode');
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || 'FRC';

    const service = getDbService();

    // Get all entries, filtered by competition type
    const pitEntries = await service.getAllPitEntries(year, undefined, competitionType);
    const matchEntries = await service.getAllMatchEntries(year, undefined, competitionType);

    // Filter by event if specified
    const filteredPitEntries = eventCode
      ? pitEntries.filter(entry => entry.eventCode === eventCode)
      : pitEntries;
    const filteredMatchEntries = eventCode
      ? matchEntries.filter(entry => entry.eventCode === eventCode)
      : matchEntries;

    // Calculate EPA and other metrics for each team
    const teamData: Record<number, TeamPicklistData> = {};

    // Process pit scouting data
    filteredPitEntries.forEach(pit => {
      if (!teamData[pit.teamNumber]) {
        teamData[pit.teamNumber] = {
          teamNumber: pit.teamNumber,
          driveTrain: pit.driveTrain,
          weight: pit.weight,
          length: pit.length,
          width: pit.width,
          matchesPlayed: 0,
          totalEPA: 0,
          autoEPA: 0,
          teleopEPA: 0,
          endgameEPA: 0
        };
      }
    });

    // Process match data
    filteredMatchEntries.forEach(match => {
      if (!teamData[match.teamNumber]) {
        teamData[match.teamNumber] = {
          teamNumber: match.teamNumber,
          driveTrain: 'Unknown',
          weight: 0,
          length: 0,
          width: 0,
          matchesPlayed: 0,
          totalEPA: 0,
          autoEPA: 0,
          teleopEPA: 0,
          endgameEPA: 0
        };
      }

      teamData[match.teamNumber].matchesPlayed += 1;
    });

    // Calculate EPA using proper statistics functions
    Object.keys(teamData).forEach(teamNumberStr => {
      const teamNumber = parseInt(teamNumberStr);
      const teamMatches = filteredMatchEntries.filter(entry => entry.teamNumber === teamNumber);

      if (teamMatches.length > 0 && year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()]) {
        try {
          const yearConfig = gameConfig[competitionType][year.toString()];
          const epaBreakdown = calculateEPA(teamMatches, year, yearConfig);

          teamData[teamNumber].autoEPA = epaBreakdown.auto;
          teamData[teamNumber].teleopEPA = epaBreakdown.teleop;
          teamData[teamNumber].endgameEPA = epaBreakdown.endgame;
          teamData[teamNumber].totalEPA = epaBreakdown.totalEPA;
        } catch (error) {
          console.error(`Error calculating EPA for team ${teamNumber}:`, error);
          // Fallback to simple calculation
          let totalEPA = 0;
          teamMatches.forEach(match => {
            if (match.gameSpecificData) {
              Object.values(match.gameSpecificData).forEach(value => {
                if (typeof value === 'number') {
                  totalEPA += value;
                }
              });
            }
          });
          teamData[teamNumber].totalEPA = totalEPA;
        }
      } else {
        // Fallback to simple calculation if no year config
        let totalEPA = 0;
        teamMatches.forEach(match => {
          if (match.gameSpecificData) {
            Object.values(match.gameSpecificData).forEach(value => {
              if (typeof value === 'number') {
                totalEPA += value;
              }
            });
          }
        });
        teamData[teamNumber].totalEPA = totalEPA;
      }
    });

    // Convert to array and sort by EPA
    const picklistData = Object.values(teamData)
      .sort((a: TeamPicklistData, b: TeamPicklistData) => b.totalEPA - a.totalEPA)
      .map((team: TeamPicklistData, index: number) => ({
        ...team,
        rank: index + 1
      }));

    return NextResponse.json({
      teams: picklistData,
      totalTeams: picklistData.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching picklist data:', error);
    return NextResponse.json({ error: 'Failed to fetch picklist data' }, { status: 500 });
  }
}
