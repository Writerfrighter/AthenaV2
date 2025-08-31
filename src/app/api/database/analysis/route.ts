import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService } from '@/db/types';
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

// GET /api/database/analysis - Get analysis data for charts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode');

    const service = getDbService();

    // Get all match entries for analysis
    const matchEntries = await service.getAllMatchEntries(year);

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
      epaBreakdown: { autoEPA: number; teleopEPA: number; endgameEPA: number; penaltiesEPA: number; totalEPA: number }; 
      matches: number 
    }> = {};

    filteredEntries.forEach(entry => {
      if (!teamEPAs[entry.teamNumber]) {
        teamEPAs[entry.teamNumber] = { 
          teamNumber: entry.teamNumber, 
          epaBreakdown: { autoEPA: 0, teleopEPA: 0, endgameEPA: 0, penaltiesEPA: 0, totalEPA: 0 }, 
          matches: 0 
        };
      }
      teamEPAs[entry.teamNumber].matches += 1;
    });

    // Calculate EPA for each team using proper function
    Object.keys(teamEPAs).forEach(teamNumberStr => {
      const teamNumber = parseInt(teamNumberStr);
      const teamMatches = filteredEntries.filter(entry => entry.teamNumber === teamNumber);

      if (teamMatches.length > 0 && year && gameConfig[year.toString()]) {
        try {
          const yearConfig = gameConfig[year.toString() as keyof typeof gameConfig];
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
          teamEPAs[teamNumber].epaBreakdown = { autoEPA: 0, teleopEPA: 0, endgameEPA: 0, penaltiesEPA: 0, totalEPA };
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
        teamEPAs[teamNumber].epaBreakdown = { autoEPA: 0, teleopEPA: 0, endgameEPA: 0, penaltiesEPA: 0, totalEPA };
      }
    });

    // Convert to array and calculate averages
    const teamEPAData = Object.values(teamEPAs)
      .map(team => ({
        teamNumber: team.teamNumber,
        name: `Team ${team.teamNumber}`, // Could be enhanced to get actual team names
        matchesPlayed: team.matches,
        avgEPA: team.epaBreakdown.totalEPA,
        totalEPA: team.epaBreakdown.totalEPA * team.matches,
        autoEPA: team.epaBreakdown.autoEPA,
        teleopEPA: team.epaBreakdown.teleopEPA,
        endgameEPA: team.epaBreakdown.endgameEPA,
        penaltiesEPA: team.epaBreakdown.penaltiesEPA
      }))
      .sort((a, b) => b.avgEPA - a.avgEPA);

    return NextResponse.json({
      scoringAnalysis: analysisData,
      teamEPAData: teamEPAData.slice(0, 20), // Top 20 teams
      totalMatches: filteredEntries.length,
      totalTeams: Object.keys(teamEPAs).length
    });
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
  }
}
