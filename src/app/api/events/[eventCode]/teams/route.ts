import { NextRequest, NextResponse } from 'next/server';
import { getEventTeams, getTeamMedia } from '@/lib/api/tba';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  try {
    const { eventCode } = await params;
    
    if (!eventCode) {
      return NextResponse.json({ error: 'Event code is required' }, { status: 400 });
    }

    const teams = await getEventTeams(eventCode);
    
    // Fetch images for all teams in parallel
    const teamsWithImages = await Promise.all(
      teams.map(async (team) => {
        try {
          const images = await getTeamMedia(team.team_number);
          return {
            ...team,
            images,
          };
        } catch (error) {
          console.warn(`Failed to fetch images for team ${team.team_number}:`, error);
          return {
            ...team,
            images: [],
          };
        }
      })
    );

    // Sort teams by number
    teamsWithImages.sort((a, b) => a.team_number - b.team_number);

    return NextResponse.json(teamsWithImages);
  } catch (error) {
    console.error('Error fetching event teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event teams' },
      { status: 500 }
    );
  }
}
