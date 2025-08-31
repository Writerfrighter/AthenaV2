import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { PitEntry, DatabaseService } from '@/db/types';

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// GET /api/database/pit - Get all pit entries or filter by year/team
export async function GET(request: NextRequest) {
  try {
    console.log('Pit API: Starting request processing');
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;

    console.log('Pit API: Parameters -', { year, teamNumber });

    const service = getDbService();
    console.log('Pit API: Database service retrieved');

    if (teamNumber && year) {
      console.log('Pit API: Fetching specific pit entry');
      const entry = await service.getPitEntry(teamNumber, year);
      console.log('Pit API: Found entry:', entry ? 'Yes' : 'No');
      return NextResponse.json(entry || null);
    } else {
      console.log('Pit API: Fetching all pit entries');
      const entries = await service.getAllPitEntries(year);
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
    const entry: Omit<PitEntry, 'id'> = await request.json();
    const service = getDbService();
    const id = await service.addPitEntry(entry);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error adding pit entry:', error);
    return NextResponse.json({ error: 'Failed to add pit entry' }, { status: 500 });
  }
}

// PUT /api/database/pit - Update pit entry
export async function PUT(request: NextRequest) {
  try {
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
