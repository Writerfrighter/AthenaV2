import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { PitEntry, DatabaseService, CompetitionType } from '@/db/types';
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

// GET /api/database/pit - Get all pit entries or filter by year/team/event/competitionType
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_PIT_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.log('Pit API: Starting request processing');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;
    const eventCode = searchParams.get('eventCode') || undefined;
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || undefined;

    console.log('Pit API: Parameters -', { id, year, teamNumber, eventCode, competitionType });

    const service = getDbService();
    console.log('Pit API: Database service retrieved');

    // If ID is provided, fetch single entry by ID
    if (id) {
      console.log('Pit API: Fetching entry by ID');
      const entries = await service.getAllPitEntries();
      const entry = entries.find(e => e.id === id);
      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      console.log('Pit API: Found entry by ID');
      return NextResponse.json(entry);
    } else if (teamNumber && year) {
      console.log('Pit API: Fetching specific pit entry');
      const entry = await service.getPitEntry(teamNumber, year, competitionType);
      console.log('Pit API: Found entry:', entry ? 'Yes' : 'No');
      return NextResponse.json(entry || null);
    } else {
      console.log('Pit API: Fetching all pit entries');
      const entries = await service.getAllPitEntries(year, eventCode, competitionType);
      console.log('Pit API: Retrieved entries count:', entries.length);
      return NextResponse.json(entries);
    }
  } catch (error) {
    console.error('Pit API: Error fetching pit entries:', error);
    console.error('Pit API: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Failed to fetch pit entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/database/pit - Add new pit entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.CREATE_PIT_SCOUTING)) {
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
    const id = await service.addPitEntry(entryWithUser);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error adding pit entry:', error);
    return NextResponse.json({ error: 'Failed to add pit entry' }, { status: 500 });
  }
}

// PUT /api/database/pit - Update pit entry
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EDIT_PIT_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();
    const service = getDbService();
    await service.updatePitEntry(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pit entry:', error);
    return NextResponse.json({ error: 'Failed to update pit entry' }, { status: 500 });
  }
}

// DELETE /api/database/pit - Delete pit entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.DELETE_PIT_SCOUTING)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id')!);
    const service = getDbService();
    await service.deletePitEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pit entry:', error);
    return NextResponse.json({ error: 'Failed to delete pit entry' }, { status: 500 });
  }
}
