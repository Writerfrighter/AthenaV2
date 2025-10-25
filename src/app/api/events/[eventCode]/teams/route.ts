import { NextRequest, NextResponse } from 'next/server';
import { getEventTeams, getTeamMedia } from '@/lib/api/tba';
import { getSeasonTeams } from '@/lib/api/ftcevents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  try {
    const { eventCode } = await params;
    const { searchParams } = new URL(request.url);
    const competitionType = searchParams.get('competitionType') || 'FRC';
    
    if (!eventCode) {
      return NextResponse.json({ error: 'Event code is required' }, { status: 400 });
    }

    if (competitionType === 'FTC') {
      // Handle FTC events
      const currentYear = new Date().getFullYear();
      const ftcTeamsResponse = await getSeasonTeams(currentYear, undefined, eventCode);
      
      const teams = ftcTeamsResponse.teams || [];
      
      // Transform FTC teams to match expected structure
      const transformedTeams = teams.map((team) => ({
        team_number: team.teamNumber,
        nickname: team.nameShort || team.nameFull || `Team ${team.teamNumber}`,
        key: `ftc${team.teamNumber}`,
        school_name: team.schoolName,
        city: team.city,
        state_prov: team.stateProv,
        country: team.country,
        images: [], // FTC API doesn't provide images in the same way
      }));

      // Sort teams by number
      transformedTeams.sort((a, b) => a.team_number - b.team_number);

      return NextResponse.json(transformedTeams);
    } else {
      // Handle FRC events
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
    }
  } catch (error) {
    console.error('Error fetching event teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event teams' },
      { status: 500 }
    );
  }
}
