import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { MatchEntry, DatabaseService } from '@/db/types';

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// GET /api/database/match - Get all match entries or filter by team/year/event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;
    const eventCode = searchParams.get('eventCode') || undefined;

    const service = getDbService();

    if (teamNumber) {
      const entries = await service.getMatchEntries(teamNumber, year);
      return NextResponse.json(entries);
    } else {
      const entries = await service.getAllMatchEntries(year, eventCode);
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
    const entry: Omit<MatchEntry, 'id'> = await request.json();
    const service = getDbService();
    const id = await service.addMatchEntry(entry);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error adding match entry:', error);
    return NextResponse.json({ error: 'Failed to add match entry' }, { status: 500 });
  }
}

// PUT /api/database/match - Update match entry
export async function PUT(request: NextRequest) {
  try {
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
