import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamNumber = searchParams.get('teamNumber');
    const matchNumber = searchParams.get('matchNumber');
    const eventCode = searchParams.get('eventCode');

    if (!teamNumber || !matchNumber || !eventCode) {
      return NextResponse.json(
        { error: 'Team number, match number, and event code are required' },
        { status: 400 }
      );
    }

    const service = databaseManager.getService();
    const exists = await service.checkMatchScoutExists(
      parseInt(teamNumber),
      parseInt(matchNumber),
      eventCode
    );

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking match scout:', error);
    return NextResponse.json(
      { error: 'Failed to check match scout existence' },
      { status: 500 }
    );
  }
}
