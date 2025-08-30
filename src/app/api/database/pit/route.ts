import { NextRequest, NextResponse } from 'next/server';
import { AzureSqlDatabaseService } from '@/db/azuresql-database-service';
import { PitEntry } from '@/db/types';

// Hardcoded Azure SQL configuration
const AZURE_SQL_CONFIG = {
  server: process.env.AZURE_SQL_SERVER || 'your-server.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'ScoutingDatabase',
  user: process.env.AZURE_SQL_USER || 'your-username',
  password: process.env.AZURE_SQL_PASSWORD || 'your-password',
  useManagedIdentity: false
};

// Initialize Azure SQL service
let dbService: AzureSqlDatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = new AzureSqlDatabaseService(AZURE_SQL_CONFIG);
  }
  return dbService;
}

// GET /api/database/pit - Get all pit entries or filter by year/team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;

    const service = getDbService();

    if (teamNumber && year) {
      const entry = await service.getPitEntry(teamNumber, year);
      return NextResponse.json(entry || null);
    } else {
      const entries = await service.getAllPitEntries(year);
      return NextResponse.json(entries);
    }
  } catch (error) {
    console.error('Error fetching pit entries:', error);
    return NextResponse.json({ error: 'Failed to fetch pit entries' }, { status: 500 });
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
