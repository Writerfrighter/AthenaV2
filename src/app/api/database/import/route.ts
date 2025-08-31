import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService } from '@/db/types';

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// POST /api/database/import - Import data from file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const fileName = file.name.toLowerCase();

    const service = getDbService();

    if (fileName.endsWith('.json')) {
      // Handle JSON import
      const data = JSON.parse(fileContent);

      if (data.pitEntries && Array.isArray(data.pitEntries)) {
        for (const entry of data.pitEntries) {
          await service.addPitEntry(entry);
        }
      }

      if (data.matchEntries && Array.isArray(data.matchEntries)) {
        for (const entry of data.matchEntries) {
          await service.addMatchEntry(entry);
        }
      }
    } else if (fileName.endsWith('.csv')) {
      // Handle CSV import (simplified - would need proper CSV parsing)
      return NextResponse.json({ error: 'CSV import not yet implemented' }, { status: 501 });
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}