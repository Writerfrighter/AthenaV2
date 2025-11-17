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

    // Optimize: Group matches by team in a single pass
    const teamEPAsMap = new Map<number, { 
      teamNumber: number; 
      matches: typeof filteredEntries;
    }>();

    for (const entry of filteredEntries) {
      const teamData = teamEPAsMap.get(entry.teamNumber);
      if (teamData) {
        teamData.matches.push(entry);
      } else {
        teamEPAsMap.set(entry.teamNumber, {
          teamNumber: entry.teamNumber,
          matches: [entry]
        });
      }
    }

    // Calculate EPA for each team using proper function
    const yearConfig = year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()] 
      ? gameConfig[competitionType][year.toString()] 
      : null;

    const teamEPAData: Array<{
      teamNumber: number;
      name: string;
      matchesPlayed: number;
      totalEPA: number;
      autoEPA: number;
      teleopEPA: number;
      endgameEPA: number;
      penaltiesEPA: number;
    }> = [];

    for (const [teamNumber, teamData] of teamEPAsMap.entries()) {
      let epaBreakdown: EPABreakdown = { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA: 0 };

      if (teamData.matches.length > 0 && yearConfig) {
        try {
          epaBreakdown = calculateEPA(teamData.matches, year!, yearConfig);
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
          epaBreakdown = { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA };
        }
      } else if (teamData.matches.length > 0) {
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
        epaBreakdown = { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA };
      }

      teamEPAData.push({
        teamNumber,
        name: `Team ${teamNumber}`,
        matchesPlayed: teamData.matches.length,
        totalEPA: epaBreakdown.totalEPA,
        autoEPA: epaBreakdown.auto,
        teleopEPA: epaBreakdown.teleop,
        endgameEPA: epaBreakdown.endgame,
        penaltiesEPA: epaBreakdown.penalties
      });
    }

    // Sort by EPA
    teamEPAData.sort((a, b) => b.totalEPA - a.totalEPA);

    return NextResponse.json({
      scoringAnalysis: analysisData,
      teamEPAData: teamEPAData,
      totalMatches: filteredEntries.length,
      totalTeams: teamEPAsMap.size
    });
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
  }
}
