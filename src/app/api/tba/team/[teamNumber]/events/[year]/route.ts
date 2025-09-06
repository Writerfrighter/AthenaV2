import { NextRequest, NextResponse } from 'next/server';
import { getTeamEvents } from '@/lib/api/tba';
import { unstable_cache } from 'next/cache';

const getCachedTeamEvents = unstable_cache(
  async (teamNum: number, yearNum: number) => {
    return await getTeamEvents(teamNum, yearNum);
  },
  ['tba-team-events'],
  {
    revalidate: 60 * 60 * 24, // Cache for 1 day (86400 seconds)
    tags: ['tba-events']
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamNumber: string; year: string }> }
) {
  try {
    const { teamNumber, year } = await params;

    if (!teamNumber || !year) {
      return NextResponse.json({ error: 'Team number and year are required' }, { status: 400 });
    }

    const teamNum = parseInt(teamNumber);
    const yearNum = parseInt(year);

    if (isNaN(teamNum) || isNaN(yearNum)) {
      return NextResponse.json({ error: 'Invalid team number or year' }, { status: 400 });
    }

    const events = await getCachedTeamEvents(teamNum, yearNum);

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' // Cache for 12 hours (43200 seconds)
      }
    });
  } catch (error) {
    console.error('Error fetching team events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team events' },
      { status: 500 }
    );
  }
}
