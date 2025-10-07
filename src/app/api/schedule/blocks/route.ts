import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// GET /api/schedule/blocks?eventCode=xxx&year=2025
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.VIEW_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventCode = searchParams.get('eventCode');
    const year = searchParams.get('year');

    if (!eventCode || !year) {
      return NextResponse.json({ error: 'eventCode and year are required' }, { status: 400 });
    }

    const service = databaseManager.getService();
    const blocks = await service.getScoutingBlocksWithAssignments(eventCode, parseInt(year));

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching scouting blocks:', error);
    return NextResponse.json({ error: 'Failed to fetch scouting blocks' }, { status: 500 });
  }
}

// POST /api/schedule/blocks - Create new scouting block
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.MANAGE_EVENT_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { eventCode, year, blockNumber, startMatch, endMatch } = body;

    if (!eventCode || !year || blockNumber === undefined || !startMatch || !endMatch) {
      return NextResponse.json(
        { error: 'eventCode, year, blockNumber, startMatch, and endMatch are required' },
        { status: 400 }
      );
    }

    if (endMatch < startMatch) {
      return NextResponse.json({ error: 'endMatch must be >= startMatch' }, { status: 400 });
    }

    const service = databaseManager.getService();
    const id = await service.addScoutingBlock({
      eventCode,
      year: parseInt(year),
      blockNumber: parseInt(blockNumber),
      startMatch: parseInt(startMatch),
      endMatch: parseInt(endMatch)
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating scouting block:', error);
    return NextResponse.json({ error: 'Failed to create scouting block' }, { status: 500 });
  }
}

// DELETE /api/schedule/blocks?eventCode=xxx&year=2025 - Delete all blocks for an event
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.MANAGE_EVENT_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventCode = searchParams.get('eventCode');
    const year = searchParams.get('year');

    if (!eventCode || !year) {
      return NextResponse.json({ error: 'eventCode and year are required' }, { status: 400 });
    }

    const service = databaseManager.getService();
    await service.deleteScoutingBlocksByEvent(eventCode, parseInt(year));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scouting blocks:', error);
    return NextResponse.json({ error: 'Failed to delete scouting blocks' }, { status: 500 });
  }
}
