import { NextRequest, NextResponse } from 'next/server';
import { AzureSqlDatabaseService } from '@/db/azuresql-database-service';
import { PitEntry, MatchEntry } from '@/db/types';

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

// GET /api/database/export - Export all data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const format = searchParams.get('format') || 'json';

    const service = getDbService();
    const data = await service.exportData(year);

    if (format === 'csv') {
      const csvData = await convertToCSV(data);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="scouting-data${year ? `-${year}` : ''}.csv"`
        }
      });
    } else if (format === 'xlsx') {
      const xlsxData = await convertToXLSX(data);
      return new NextResponse(xlsxData, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="scouting-data${year ? `-${year}` : ''}.xlsx"`
        }
      });
    } else {
      // Default to JSON
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

// POST /api/database/import - Import data
export async function POST(request: NextRequest) {
  try {
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

// Helper functions for data conversion
async function convertToCSV(data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] }): Promise<string> {
  const Papa = await import('papaparse');

  // Add type column to distinguish entries
  const pitEntriesWithType = data.pitEntries.map(entry => ({
    type: 'pit',
    ...entry,
    gameSpecificData: JSON.stringify(entry.gameSpecificData)
  }));

  const matchEntriesWithType = data.matchEntries.map(entry => ({
    type: 'match',
    ...entry,
    gameSpecificData: JSON.stringify(entry.gameSpecificData)
  }));

  // Combine all entries into one CSV
  const allEntries = [...pitEntriesWithType, ...matchEntriesWithType];
  return Papa.unparse(allEntries);
}

async function convertToXLSX(data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] }): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();

  // Add type column to distinguish entries
  const pitEntriesWithType = data.pitEntries.map(entry => ({
    type: 'pit',
    ...entry,
    gameSpecificData: JSON.stringify(entry.gameSpecificData)
  }));

  const matchEntriesWithType = data.matchEntries.map(entry => ({
    type: 'match',
    ...entry,
    gameSpecificData: JSON.stringify(entry.gameSpecificData)
  }));

  // Combine all entries into one sheet
  const allEntries = [...pitEntriesWithType, ...matchEntriesWithType];
  const worksheet = XLSX.utils.json_to_sheet(allEntries);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scouting Data');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
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

        allRows.forEach((row: Record<string, unknown>) => {
          // Remove the type column and parse based on it
          const { type, ...entryData } = row;

          if (type === 'pit') {
            pitEntries.push({
              ...entryData,
              teamNumber: parseInt(entryData.teamNumber as string),
              year: parseInt(entryData.year as string),
              weight: parseFloat(entryData.weight as string),
              length: parseFloat(entryData.length as string),
              width: parseFloat(entryData.width as string),
              gameSpecificData: typeof entryData.gameSpecificData === 'string'
                ? JSON.parse(entryData.gameSpecificData)
                : entryData.gameSpecificData
            } as PitEntry);
          } else if (type === 'match') {
            matchEntries.push({
              ...entryData,
              matchNumber: parseInt(entryData.matchNumber as string),
              teamNumber: parseInt(entryData.teamNumber as string),
              year: parseInt(entryData.year as string),
              alliance: entryData.alliance as 'red' | 'blue',
              notes: (entryData.notes as string) || '',
              timestamp: entryData.timestamp ? new Date(entryData.timestamp as string) : new Date(),
              gameSpecificData: typeof entryData.gameSpecificData === 'string'
                ? JSON.parse(entryData.gameSpecificData)
                : entryData.gameSpecificData
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
  const XLSX = await import('xlsx');
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

  rows.forEach((row: Record<string, unknown>) => {
    const { type, ...entryData } = row;

    if (type === 'pit') {
      pitEntries.push({
        ...entryData,
        teamNumber: parseInt(entryData.teamNumber as string),
        year: parseInt(entryData.year as string),
        weight: parseFloat(entryData.weight as string),
        length: parseFloat(entryData.length as string),
        width: parseFloat(entryData.width as string),
        gameSpecificData: typeof entryData.gameSpecificData === 'string'
          ? JSON.parse(entryData.gameSpecificData)
          : entryData.gameSpecificData
      } as PitEntry);
    } else if (type === 'match') {
      matchEntries.push({
        ...entryData,
        matchNumber: parseInt(entryData.matchNumber as string),
        teamNumber: parseInt(entryData.teamNumber as string),
        year: parseInt(entryData.year as string),
        alliance: entryData.alliance as 'red' | 'blue',
        notes: (entryData.notes as string) || '',
        timestamp: entryData.timestamp ? new Date(entryData.timestamp as string) : new Date(),
        gameSpecificData: typeof entryData.gameSpecificData === 'string'
          ? JSON.parse(entryData.gameSpecificData)
          : entryData.gameSpecificData
      } as MatchEntry);
    }
  });

  return { pitEntries, matchEntries };
}
