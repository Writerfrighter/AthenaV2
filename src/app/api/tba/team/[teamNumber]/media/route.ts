import { NextRequest, NextResponse } from 'next/server';
import { getTeamMedia } from '@/lib/api/tba';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamNumber: string }> }
) {
  try {
    const { teamNumber } = await params;
    
    if (!teamNumber) {
      return NextResponse.json({ error: 'Team number is required' }, { status: 400 });
    }

    const teamNum = parseInt(teamNumber);
    if (isNaN(teamNum)) {
      return NextResponse.json({ error: 'Invalid team number' }, { status: 400 });
    }

    const images = await getTeamMedia(teamNum);
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching team media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team media' },
      { status: 500 }
    );
  }
}
