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

    // Optimize: Group matches by team in single pass and calculate EPA
    const teamDataMap = new Map<number, TeamPicklistData & { matches: typeof filteredMatchEntries }>();

    // Process pit scouting data first
    for (const pit of filteredPitEntries) {
      teamDataMap.set(pit.teamNumber, {
        teamNumber: pit.teamNumber,
        driveTrain: pit.driveTrain,
        weight: pit.weight,
        length: pit.length,
        width: pit.width,
        matchesPlayed: 0,
        totalEPA: 0,
        autoEPA: 0,
        teleopEPA: 0,
        endgameEPA: 0,
        matches: []
      });
    }

    // Process match data - group by team in single pass
    for (const match of filteredMatchEntries) {
      let teamData = teamDataMap.get(match.teamNumber);
      if (!teamData) {
        teamData = {
          teamNumber: match.teamNumber,
          driveTrain: 'Unknown',
          weight: 0,
          length: 0,
          width: 0,
          matchesPlayed: 0,
          totalEPA: 0,
          autoEPA: 0,
          teleopEPA: 0,
          endgameEPA: 0,
          matches: []
        };
        teamDataMap.set(match.teamNumber, teamData);
      }
      teamData.matchesPlayed++;
      teamData.matches.push(match);
    }

    // Calculate EPA for each team
    const yearConfig = year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()] 
      ? gameConfig[competitionType][year.toString()] 
      : null;

    for (const [teamNumber, teamData] of teamDataMap.entries()) {
      if (teamData.matchesPlayed > 0 && yearConfig) {
        try {
          const epaBreakdown = calculateEPA(teamData.matches, year!, yearConfig);
          teamData.autoEPA = epaBreakdown.auto;
          teamData.teleopEPA = epaBreakdown.teleop;
          teamData.endgameEPA = epaBreakdown.endgame;
          teamData.totalEPA = epaBreakdown.totalEPA;
        } catch (error) {
          console.error(`Error calculating EPA for team ${teamNumber}:`, error);
          // Fallback to simple calculation
          let totalEPA = 0;
          for (const match of teamData.matches) {
            if (match.gameSpecificData) {
              for (const value of Object.values(match.gameSpecificData)) {
                if (typeof value === 'number') {
                  totalEPA += value;
                }
              }
            }
          }
          teamData.totalEPA = totalEPA;
        }
      } else if (teamData.matchesPlayed > 0) {
        // Fallback to simple calculation if no year config
        let totalEPA = 0;
        for (const match of teamData.matches) {
          if (match.gameSpecificData) {
            for (const value of Object.values(match.gameSpecificData)) {
              if (typeof value === 'number') {
                totalEPA += value;
              }
            }
          }
        }
        teamData.totalEPA = totalEPA;
      }
      // Remove matches array before sending response
      delete (teamData as { matches?: unknown }).matches;
    }

    // Convert to array and sort by EPA
    const picklistData = Array.from(teamDataMap.values())
      .sort((a, b) => b.totalEPA - a.totalEPA)
      .map((team, index) => ({
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
