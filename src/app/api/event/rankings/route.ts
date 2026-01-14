import { NextRequest, NextResponse } from 'next/server';
import { getEventRankings as getTbaEventRankings } from '@/lib/api/tba';
import { getEventRankings as getFtcEventRankings } from '@/lib/api/ftcevents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('eventCode');
    const competitionType = searchParams.get('competitionType') || 'FRC';
    
    if (!eventCode) {
      return NextResponse.json({ error: 'Missing eventCode' }, { status: 400 });
    }

    if (competitionType === 'FTC') {
      // For FTC, we need season/year parameter
      const season = searchParams.get('season') || searchParams.get('year');
      if (!season) {
        return NextResponse.json({ error: 'Missing season/year parameter for FTC' }, { status: 400 });
      }
      
      const seasonNum = parseInt(season);
      if (isNaN(seasonNum)) {
        return NextResponse.json({ error: 'Invalid season/year' }, { status: 400 });
      }

      const teamNumber = searchParams.get('teamNumber');
      const top = searchParams.get('top');
      
      const response = await getFtcEventRankings(
        seasonNum, 
        eventCode,
        teamNumber ? parseInt(teamNumber) : undefined,
        top ? parseInt(top) : undefined
      );
      
      return NextResponse.json(response);
    } else {
      // FRC via TBA
      const rankings = await getTbaEventRankings(eventCode);
      
      return NextResponse.json(rankings);
    }
  } catch (err) {
    console.error('Event rankings proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch event rankings' }, { status: 502 });
  }
}
