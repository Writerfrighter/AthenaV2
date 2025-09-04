import { NextRequest, NextResponse } from 'next/server';
import { getEventMatches } from '@/lib/api/tba';
import { TbaMatch } from '@/lib/api/types';

// Server-side proxy that queries The Blue Alliance and returns qualification match count.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('eventCode');
    if (!eventCode) {
      return NextResponse.json({ error: 'Missing eventCode' }, { status: 400 });
    }

    // Call into the server-side TBA client which can read process.env.TBA_API_KEY
    const matches = await getEventMatches(eventCode);
    const qualMatchesCount = Array.isArray(matches)
      ? matches.filter((m: TbaMatch) => m.comp_level === 'qm').length
      : 0;

    return NextResponse.json({ qualMatchesCount, totalMatches: Array.isArray(matches) ? matches.length : 0 });
  } catch (err) {
    console.error('TBA proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch from TBA' }, { status: 502 });
  }
}
