import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { PitEntry, MatchEntry, DatabaseService } from '@/db/types';
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

// POST /api/database/import - Import data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.IMPORT_DATA)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const contentType = request.headers.get('content-type') || '';

    let data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] };

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (file.name.endsWith('.json')) {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = await parseCSV(file);
      } else if (file.name.endsWith('.xlsx')) {
        data = await parseXLSX(file);
      } else {
        return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
      }
    } else {
      // Handle JSON data
      data = await request.json();
    }

    const service = getDbService();
    await service.importData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}

async function parseCSV(file: File): Promise<{ pitEntries: PitEntry[], matchEntries: MatchEntry[] }> {
  const Papa = await import('papaparse');
  const text = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data as Record<string, unknown>[];
        const pitEntries: PitEntry[] = [];
        const matchEntries: MatchEntry[] = [];

        // Define standard fields for pit and match entries
        const pitStandardFields = new Set(['type', 'id', 'teamNumber', 'year', 'driveTrain', 'weight', 'length', 'width', 'eventName', 'eventCode']);
        const matchStandardFields = new Set(['type', 'id', 'matchNumber', 'teamNumber', 'year', 'alliance', 'eventName', 'eventCode', 'notes', 'timestamp']);

        allRows.forEach((row: Record<string, unknown>) => {
          const { type, ...entryData } = row;

          // Reconstruct gameSpecificData from expanded columns (one level)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gameSpecificData: Record<string, any> = {};

          for (const [key, value] of Object.entries(entryData)) {
            if ((type === 'pit' && !pitStandardFields.has(key)) ||
                (type === 'match' && !matchStandardFields.has(key))) {
              // This is a game-specific field, reconstruct the nested structure
              const parts = key.split('_');
              if (parts.length >= 2) {
                const mainKey = parts[0];
                const subKey = parts.slice(1).join('_');

                if (!gameSpecificData[mainKey]) {
                  gameSpecificData[mainKey] = {};
                }
                gameSpecificData[mainKey][subKey] = value;
              } else {
                // If no underscore, keep as top-level field
                gameSpecificData[key] = value;
              }
            }
          }

          if (type === 'pit') {
            pitEntries.push({
              id: entryData.id ? parseInt(entryData.id as string) : undefined,
              teamNumber: parseInt(entryData.teamNumber as string),
              year: parseInt(entryData.year as string),
              driveTrain: entryData.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
              weight: parseFloat(entryData.weight as string),
              length: parseFloat(entryData.length as string),
              width: parseFloat(entryData.width as string),
              eventName: (entryData.eventName as string) || undefined,
              eventCode: (entryData.eventCode as string) || undefined,
              gameSpecificData
            } as PitEntry);
          } else if (type === 'match') {
            matchEntries.push({
              id: entryData.id ? parseInt(entryData.id as string) : undefined,
              matchNumber: parseInt(entryData.matchNumber as string),
              teamNumber: parseInt(entryData.teamNumber as string),
              year: parseInt(entryData.year as string),
              alliance: entryData.alliance as 'red' | 'blue',
              eventName: (entryData.eventName as string) || undefined,
              eventCode: (entryData.eventCode as string) || undefined,
              notes: (entryData.notes as string) || '',
              timestamp: entryData.timestamp ? new Date(entryData.timestamp as string) : new Date(),
              gameSpecificData
            } as MatchEntry);
          }
        });

        resolve({ pitEntries, matchEntries });
      },
      error: reject
    });
  });
}

async function parseXLSX(file: File): Promise<{ pitEntries: PitEntry[], matchEntries: MatchEntry[] }> {
  const XLSX = await import('xlsx-js-style');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Use the first sheet (should be 'Scouting Data')
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return { pitEntries: [], matchEntries: [] };
  }

  const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
  const pitEntries: PitEntry[] = [];
  const matchEntries: MatchEntry[] = [];

  // Define standard fields for pit and match entries
  const pitStandardFields = new Set(['type', 'id', 'teamNumber', 'year', 'driveTrain', 'weight', 'length', 'width', 'eventName', 'eventCode']);
  const matchStandardFields = new Set(['type', 'id', 'matchNumber', 'teamNumber', 'year', 'alliance', 'eventName', 'eventCode', 'notes', 'timestamp']);

  rows.forEach((row: Record<string, unknown>) => {
    const { type, ...entryData } = row;

    // Reconstruct gameSpecificData from expanded columns (one level)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameSpecificData: Record<string, any> = {};

    for (const [key, value] of Object.entries(entryData)) {
      if ((type === 'pit' && !pitStandardFields.has(key)) ||
          (type === 'match' && !matchStandardFields.has(key))) {
        // This is a game-specific field, reconstruct the nested structure
        const parts = key.split('_');
        if (parts.length >= 2) {
          const mainKey = parts[0];
          const subKey = parts.slice(1).join('_');

          if (!gameSpecificData[mainKey]) {
            gameSpecificData[mainKey] = {};
          }
          gameSpecificData[mainKey][subKey] = value;
        } else {
          // If no underscore, keep as top-level field
          gameSpecificData[key] = value;
        }
      }
    }

    if (type === 'pit') {
      pitEntries.push({
        id: entryData.id ? parseInt(entryData.id as string) : undefined,
        teamNumber: parseInt(entryData.teamNumber as string),
        year: parseInt(entryData.year as string),
        driveTrain: entryData.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
        weight: parseFloat(entryData.weight as string),
        length: parseFloat(entryData.length as string),
        width: parseFloat(entryData.width as string),
        eventName: (entryData.eventName as string) || undefined,
        eventCode: (entryData.eventCode as string) || undefined,
        gameSpecificData
      } as PitEntry);
    } else if (type === 'match') {
      matchEntries.push({
        id: entryData.id ? parseInt(entryData.id as string) : undefined,
        matchNumber: parseInt(entryData.matchNumber as string),
        teamNumber: parseInt(entryData.teamNumber as string),
        year: parseInt(entryData.year as string),
        alliance: entryData.alliance as 'red' | 'blue',
        eventName: (entryData.eventName as string) || undefined,
        eventCode: (entryData.eventCode as string) || undefined,
        notes: (entryData.notes as string) || '',
        timestamp: entryData.timestamp ? new Date(entryData.timestamp as string) : new Date(),
        gameSpecificData
      } as MatchEntry);
    }
  });

  return { pitEntries, matchEntries };
}