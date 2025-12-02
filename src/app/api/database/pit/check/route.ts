import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamNumber = searchParams.get('teamNumber');
    const eventCode = searchParams.get('eventCode');

    if (!teamNumber || !eventCode) {
      return NextResponse.json(
        { error: 'Team number and event code are required' },
        { status: 400 }
      );
    }

    const service = databaseManager.getService();
    const exists = await service.checkPitScoutExists(
      parseInt(teamNumber),
      eventCode
    );

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking pit scout:', error);
    return NextResponse.json(
      { error: 'Failed to check pit scout existence' },
      { status: 500 }
    );
  }
}
