import { NextRequest, NextResponse } from 'next/server';
import { getEventMatches as getTbaEventMatches } from '@/lib/api/tba';
import { getEventMatches as getFtcEventMatches } from '@/lib/api/ftcevents';
import type { TbaMatch } from '@/lib/api/tba-types';
import type { FtcMatchResult } from '@/lib/api/ftcevents-types';

/**
 * API endpoint to fetch official match results for SPR calculation
 * 
 * GET /api/database/spr/official-results?eventCode=<code>&competitionType=<type>&year=<year>
 * 
 * Returns a map of match numbers to alliance scores and foul points from The Blue Alliance or FTC Events API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('eventCode');
    const competitionType = searchParams.get('competitionType') || 'FRC';
    const yearParam = searchParams.get('year');

    if (!eventCode) {
      return NextResponse.json({ error: 'Missing eventCode parameter' }, { status: 400 });
    }

    // Handle FTC using FTC Events API
    if (competitionType === 'FTC') {
      const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
      
      try {
        // Fetch matches from FTC Events API
        const matchData = await getFtcEventMatches(year, eventCode, 'qual');
        
        if (!matchData || !matchData.matches || !Array.isArray(matchData.matches)) {
          return NextResponse.json({ 
            results: {},
            message: 'No qualification matches found for this FTC event'
          });
        }

        // Build result map: matchNumber -> { red: {...}, blue: {...} }
        const results: Record<number, {
          red: { officialScore: number; foulPoints: number };
          blue: { officialScore: number; foulPoints: number };
        }> = {};

        for (const match of matchData.matches as FtcMatchResult[]) {
          const matchNumber = match.matchNumber;
          
          results[matchNumber] = {
            red: {
              officialScore: match.scoreRedFinal || 0,
              foulPoints: match.scoreRedFoul || 0
            },
            blue: {
              officialScore: match.scoreBlueFinal || 0,
              foulPoints: match.scoreBlueFoul || 0
            }
          };
        }

        return NextResponse.json({ 
          results,
          matchCount: matchData.matches.length,
          eventCode
        });
      } catch (ftcError) {
        console.error('Error fetching FTC results:', ftcError);
        return NextResponse.json({ 
          error: 'Failed to fetch FTC match results. Check API key and event code.',
          details: ftcError instanceof Error ? ftcError.message : 'Unknown error'
        }, { status: 502 });
      }
    }

    // Fetch matches from TBA for FRC
    const matches = await getTbaEventMatches(eventCode);

    if (!Array.isArray(matches)) {
      return NextResponse.json({ error: 'Invalid response from TBA' }, { status: 502 });
    }

    // Filter to qualification matches only
    const qualMatches = matches.filter((m: TbaMatch) => m.comp_level === 'qm');

    // Build result map: matchNumber -> { red: {...}, blue: {...} }
    const results: Record<number, {
      red: { officialScore: number; foulPoints: number };
      blue: { officialScore: number; foulPoints: number };
    }> = {};

    for (const match of qualMatches) {
      const matchNumber = match.match_number;
      const redScore = match.alliances.red.score || 0;
      const blueScore = match.alliances.blue.score || 0;

      // Extract foul points from score breakdown (if available)
      // Foul points are typically stored as 'foulPoints' or similar in breakdown
      let redFouls = 0;
      let blueFouls = 0;

      if (match.score_breakdown) {
        // Red alliance gets foul points from blue alliance's fouls
        // Blue alliance gets foul points from red alliance's fouls
        const redBreakdown = match.score_breakdown.red;
        const blueBreakdown = match.score_breakdown.blue;

        // Try to extract foul points - field names vary by year
        // Common patterns: foulPoints, foulCount (multiplied by points per foul)
        if (typeof blueBreakdown.foulPoints === 'number') {
          redFouls = blueBreakdown.foulPoints; // Blue fouls -> red gets points
        } else if (typeof blueBreakdown.foulCount === 'number') {
          redFouls = blueBreakdown.foulCount * 5; // Typical: 5 points per foul
        }

        if (typeof redBreakdown.foulPoints === 'number') {
          blueFouls = redBreakdown.foulPoints; // Red fouls -> blue gets points
        } else if (typeof redBreakdown.foulCount === 'number') {
          blueFouls = redBreakdown.foulCount * 5;
        }
      }

      results[matchNumber] = {
        red: {
          officialScore: redScore,
          foulPoints: redFouls
        },
        blue: {
          officialScore: blueScore,
          foulPoints: blueFouls
        }
      };
    }

    return NextResponse.json({ 
      results,
      matchCount: qualMatches.length,
      eventCode
    });

  } catch (error) {
    console.error('Error fetching official results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch official match results' },
      { status: 500 }
    );
  }
}
