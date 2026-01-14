import { NextRequest, NextResponse } from 'next/server';
import { getEventMatches as getTbaEventMatches } from '@/lib/api/tba';
import { getEventMatches as getFtcEventMatches } from '@/lib/api/ftcevents';
import { TbaMatch } from '@/lib/api/tba-types';

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

      const response = await getFtcEventMatches(seasonNum, eventCode);
      const matches = response.matches || [];
      
      return NextResponse.json({ 
        matches,
        totalMatches: matches.length 
      });
    } else {
      // FRC via TBA
      const matches = await getTbaEventMatches(eventCode);
      const qualMatchesCount = Array.isArray(matches)
        ? matches.filter((m: TbaMatch) => m.comp_level === 'qm').length
        : 0;

      return NextResponse.json({ 
        matches,
        qualMatchesCount, 
        totalMatches: Array.isArray(matches) ? matches.length : 0 
      });
    }
  } catch (err) {
    console.error('Event matches proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch event matches' }, { status: 502 });
  }
}
