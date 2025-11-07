import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService, CompetitionType } from '@/db/types';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';
import { calculateEPA } from '@/lib/statistics';
import { EPABreakdown } from '@/lib/shared-types';
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

// GET /api/database/analysis - Get analysis data for charts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode');
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || 'FRC';

    const service = getDbService();

    // Get all match entries for analysis, filtered by competition type
    const matchEntries = await service.getAllMatchEntries(year, undefined, competitionType);

    // Filter by event if specified
    const filteredEntries = eventCode
      ? matchEntries.filter(entry => entry.eventCode === eventCode)
      : matchEntries;

    // Group by scoring categories (this is a simplified example)
    const scoringCategories = ['auto', 'teleop', 'endgame', 'total'];
    const categoryData: Record<string, number[]> = {};

    scoringCategories.forEach(category => {
      categoryData[category] = [];
    });

    // Process each match entry
    filteredEntries.forEach(entry => {
      if (entry.gameSpecificData) {
        scoringCategories.forEach(category => {
          const value = entry.gameSpecificData[category];
          if (typeof value === 'number') {
            categoryData[category].push(value);
          }
        });
      }
    });

    // Calculate averages for each category
    const analysisData = scoringCategories.map(category => ({
      category,
      average: categoryData[category].length > 0
        ? categoryData[category].reduce((sum, val) => sum + val, 0) / categoryData[category].length
        : 0,
      count: categoryData[category].length,
      data: categoryData[category]
    }));

    // Calculate team-specific EPA data using proper statistics
    const teamEPAs: Record<number, { 
      teamNumber: number; 
      epaBreakdown: EPABreakdown; 
      matches: number 
    }> = {};

    filteredEntries.forEach(entry => {
      if (!teamEPAs[entry.teamNumber]) {
        teamEPAs[entry.teamNumber] = { 
          teamNumber: entry.teamNumber, 
          epaBreakdown: { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA: 0 }, 
          matches: 0 
        };
      }
      teamEPAs[entry.teamNumber].matches += 1;
    });

    // Calculate EPA for each team using proper function
    Object.keys(teamEPAs).forEach(teamNumberStr => {
      const teamNumber = parseInt(teamNumberStr);
      const teamMatches = filteredEntries.filter(entry => entry.teamNumber === teamNumber);

      if (teamMatches.length > 0 && year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()]) {
        try {
          const yearConfig = gameConfig[competitionType][year.toString()];
          const epaBreakdown = calculateEPA(teamMatches, year, yearConfig);
          teamEPAs[teamNumber].epaBreakdown = epaBreakdown;
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
          teamEPAs[teamNumber].epaBreakdown = { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA };
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
        teamEPAs[teamNumber].epaBreakdown = { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA };
      }
    });

    // Convert to array and calculate averages
    const teamEPAData = Object.values(teamEPAs)
      .map(team => ({
        teamNumber: team.teamNumber,
        name: `Team ${team.teamNumber}`, // Could be enhanced to get actual team names
        matchesPlayed: team.matches,
        totalEPA: team.epaBreakdown.totalEPA,
        autoEPA: team.epaBreakdown.auto,
        teleopEPA: team.epaBreakdown.teleop,
        endgameEPA: team.epaBreakdown.endgame,
        penaltiesEPA: team.epaBreakdown.penalties
      }))
      .sort((a, b) => b.totalEPA - a.totalEPA);

    return NextResponse.json({
      scoringAnalysis: analysisData,
      teamEPAData: teamEPAData,
      totalMatches: filteredEntries.length,
      totalTeams: Object.keys(teamEPAs).length
    });
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
  }
}
