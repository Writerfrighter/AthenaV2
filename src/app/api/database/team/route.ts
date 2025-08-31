import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService, MatchEntry, PitEntry } from '@/db/types';
import { calculateEPA, calculateTeamStats } from '@/lib/statistics';
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

// GET /api/database/team - Get team data for a specific team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamNumber = searchParams.get('teamNumber');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode');

    if (!teamNumber) {
      return NextResponse.json({ error: 'Team number is required' }, { status: 400 });
    }

    const service = getDbService();

    // Get match entries for the team
    const matchEntries = await service.getMatchEntries(parseInt(teamNumber), year);
    
    // Filter by event if specified
    const filteredMatchEntries = eventCode
      ? matchEntries.filter((entry: MatchEntry) => entry.eventCode === eventCode)
      : matchEntries;

    // Get pit entry for the team
    const pitEntry = await service.getPitEntry(parseInt(teamNumber), year || new Date().getFullYear());

    // Calculate statistics if we have match data
    let teamStats = null;
    let epaBreakdown = null;

    if (filteredMatchEntries.length > 0 && year && gameConfig[year.toString()]) {
      try {
        const yearConfig = gameConfig[year.toString() as keyof typeof gameConfig];
        teamStats = calculateTeamStats(filteredMatchEntries, year, yearConfig);
        epaBreakdown = calculateEPA(filteredMatchEntries, year, yearConfig);
      } catch (error) {
        console.error(`Error calculating team stats for team ${teamNumber}:`, error);
      }
    }

    // Round all numeric values to 3 decimal places
    const roundValue = (value: number) => parseFloat(value.toFixed(3));

    const responseData = {
      teamNumber: parseInt(teamNumber),
      year,
      eventCode,
      matchEntries: filteredMatchEntries,
      pitEntry,
      stats: teamStats ? {
        ...teamStats,
        // Round all values in teamStats
        avgScore: roundValue(teamStats.avgScore || 0),
        epa: roundValue(teamStats.epa || 0),
      } : null,
      epa: epaBreakdown ? {
        autoEPA: roundValue(epaBreakdown.autoEPA),
        teleopEPA: roundValue(epaBreakdown.teleopEPA),
        endgameEPA: roundValue(epaBreakdown.endgameEPA),
        penaltiesEPA: roundValue(epaBreakdown.penaltiesEPA),
        totalEPA: roundValue(epaBreakdown.totalEPA),
      } : null,
      matchCount: filteredMatchEntries.length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
}
