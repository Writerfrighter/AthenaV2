import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/db/database-manager';
import { CompetitionType } from '@/db/types';
import { computeScouterAccuracy } from '@/lib/statistics';
import gameConfig from '../../../../../config/game-config-loader';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// Get database service from manager
function getDbService() {
  return DatabaseManager.getInstance().getService();
}

/**
 * GET /api/database/spr
 * 
 * Calculate Scouter Performance Rating (SPR) for all scouters at an event
 * Fetches official match results from The Blue Alliance (TBA) automatically
 * 
 * Query Parameters:
 * - year: number (required) - The competition year
 * - eventCode: string (required) - The event code
 * - competitionType: 'FRC' | 'FTC' (default: 'FRC')
 * 
 * Returns:
 * - scouters: Array of scouter performance data sorted by accuracy (best to worst)
 * - overallMeanError: Average error across all matches
 * - convergenceAchieved: Whether calculation succeeded
 * - message: Optional warnings or error messages
 * 
 * Example usage:
 * GET /api/database/spr?year=2025&eventCode=CALA&competitionType=FRC
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const eventCode = searchParams.get('eventCode');
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || 'FRC';

    // Validate required parameters
    if (!year) {
      return NextResponse.json(
        { error: 'Missing required parameter: year' },
        { status: 400 }
      );
    }

    if (!eventCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventCode' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Fetch official results from internal API
    const officialResultsUrl = new URL('/api/database/spr/official-results', request.url);
    officialResultsUrl.searchParams.set('eventCode', eventCode);
    officialResultsUrl.searchParams.set('competitionType', competitionType);
    officialResultsUrl.searchParams.set('year', year);

    const officialResultsResponse = await fetch(officialResultsUrl.toString());
    
    if (!officialResultsResponse.ok) {
      const errorData = await officialResultsResponse.json();
      return NextResponse.json(
        { error: 'Failed to fetch official results from TBA', details: errorData.error },
        { status: 502 }
      );
    }

    const officialResultsJson = await officialResultsResponse.json();
    const officialResultsData = officialResultsJson.results as Record<string, {
      red: { officialScore: number; foulPoints: number };
      blue: { officialScore: number; foulPoints: number };
    }>;

    if (!officialResultsData || Object.keys(officialResultsData).length === 0) {
      return NextResponse.json(
        { 
          error: 'No official results available',
          message: officialResultsJson.message || 'Official match results could not be retrieved'
        },
        { status: 404 }
      );
    }

    // Convert to Map with number keys
    const officialResults = new Map<number, {
      red: { officialScore: number; foulPoints: number };
      blue: { officialScore: number; foulPoints: number };
    }>();

    for (const [matchNumStr, result] of Object.entries(officialResultsData)) {
      const matchNum = parseInt(matchNumStr);
      if (!isNaN(matchNum)) {
        officialResults.set(matchNum, result);
      }
    }

    // Get year configuration
    if (!gameConfig[competitionType] || !gameConfig[competitionType][year]) {
      return NextResponse.json(
        { error: `No game configuration found for ${competitionType} ${year}` },
        { status: 404 }
      );
    }

    const yearConfig = gameConfig[competitionType][year];

    // Fetch match entries from database
    const service = getDbService();
    const matchEntries = await service.getAllMatchEntries(yearNum, eventCode, competitionType);

    if (matchEntries.length === 0) {
      return NextResponse.json(
        { error: 'No match entries found for the specified event' },
        { status: 404 }
      );
    }

    // Filter matches that have userId (scouterId) populated
    const matchesWithScouters = matchEntries.filter(m => m.userId);

    if (matchesWithScouters.length === 0) {
      return NextResponse.json(
        { error: 'No match entries with scouter IDs found' },
        { status: 404 }
      );
    }

    // Calculate scouter accuracy
    const result = computeScouterAccuracy(matchesWithScouters, officialResults, yearConfig);

    // Return results
    return NextResponse.json({
      success: result.convergenceAchieved,
      data: {
        scouters: result.scouters,
        overallMeanError: result.overallMeanError,
        convergenceAchieved: result.convergenceAchieved,
        message: result.message,
        metadata: {
          totalMatches: matchesWithScouters.length,
          uniqueScouters: result.scouters.length,
          officialResultsCount: officialResults.size,
          eventCode,
          year: yearNum,
          competitionType
        }
      }
    });

  } catch (error) {
    console.error('Error calculating scouter accuracy:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate scouter accuracy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
