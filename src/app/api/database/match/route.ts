import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { MatchEntry, DatabaseService, CompetitionType } from '@/db/types';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// GET /api/database/match - Get all match entries or filter by team/year/event/competitionType
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;
    const eventCode = searchParams.get('eventCode') || undefined;
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || undefined;

    const service = getDbService();

    // If ID is provided, fetch single entry by ID
    if (id) {
      const entries = await service.getAllMatchEntries();
      const entry = entries.find(e => e.id === id);
      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      return NextResponse.json(entry);
    } else if (teamNumber) {
      const entries = await service.getMatchEntries(teamNumber, year, competitionType);
      return NextResponse.json(entries);
    } else {
      const entries = await service.getAllMatchEntries(year, eventCode, competitionType);
      return NextResponse.json(entries);
    }
  } catch (error) {
    console.error('Error fetching match entries:', error);
    return NextResponse.json({ error: 'Failed to fetch match entries' }, { status: 500 });
  }
}

// POST /api/database/match - Add new match entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.CREATE_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { scoutingForUserId, ...entry } = body;
    
    // Determine which userId to use
    let actualUserId = session.user.id;
    
    // If tablet account is scouting on behalf of someone
    if (scoutingForUserId && hasPermission(session.user.role, PERMISSIONS.SCOUT_ON_BEHALF)) {
      actualUserId = scoutingForUserId;
    }
    
    // Add userId from session or scout selection
    const entryWithUser = {
      ...entry,
      userId: actualUserId
    };
    const service = getDbService();
    const id = await service.addMatchEntry(entryWithUser);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error adding match entry:', error);
    return NextResponse.json({ error: 'Failed to add match entry' }, { status: 500 });
  }
}

// PUT /api/database/match - Update match entry
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EDIT_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();
    const service = getDbService();
    await service.updateMatchEntry(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating match entry:', error);
    return NextResponse.json({ error: 'Failed to update match entry' }, { status: 500 });
  }
}

// DELETE /api/database/match - Delete match entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.DELETE_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id')!);
    const service = getDbService();
    await service.deleteMatchEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match entry:', error);
    return NextResponse.json({ error: 'Failed to delete match entry' }, { status: 500 });
  }
}
