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

// GET /api/database/export - Export all data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EXPORT_DATA)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const format = searchParams.get('format') || 'json';
    // `types` can be a comma-separated list: 'pit', 'match', or omitted for all
    const typesParam = searchParams.get('types');
    const requestedTypes = typesParam
      ? typesParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : null;

    const service = getDbService();
    let data = await service.exportData(year);

    // Filter data based on requestedTypes parameter (supports comma-separated values)
    if (requestedTypes) {
      const includePit = requestedTypes.includes('pit');
      const includeMatch = requestedTypes.includes('match');
      data = {
        pitEntries: includePit ? data.pitEntries : [],
        matchEntries: includeMatch ? data.matchEntries : []
      };
    }

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

// Helper functions for data conversion
async function convertToCSV(data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] }): Promise<string> {
  const Papa = await import('papaparse');

  // Function to expand gameSpecificData (only one level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expandGameSpecificData = (gameSpecificData: Record<string, any>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expanded: Record<string, any> = {};

    for (const [key, value] of Object.entries(gameSpecificData)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // If it's an object, expand its properties as key_value pairs (one level only)
        for (const [subKey, subValue] of Object.entries(value)) {
          expanded[`${key}_${subKey}`] = subValue;
        }
      } else {
        // For simple values, keep as is
        expanded[key] = value;
      }
    }

    return expanded;
  };

  // Expand pit entries
  const expandedPitEntries = data.pitEntries.map(entry => {
    const gameSpecificExpanded = expandGameSpecificData(entry.gameSpecificData);
    return {
      type: 'pit',
      id: entry.id,
      teamNumber: entry.teamNumber,
      year: entry.year,
      driveTrain: entry.driveTrain,
      weight: entry.weight,
      length: entry.length,
      width: entry.width,
      eventName: entry.eventName,
      eventCode: entry.eventCode,
      ...gameSpecificExpanded
    };
  });

  // Expand match entries
  const expandedMatchEntries = data.matchEntries.map(entry => {
    const gameSpecificExpanded = expandGameSpecificData(entry.gameSpecificData);
    return {
      type: 'match',
      id: entry.id,
      matchNumber: entry.matchNumber,
      teamNumber: entry.teamNumber,
      year: entry.year,
      alliance: entry.alliance,
      eventName: entry.eventName,
      eventCode: entry.eventCode,
      notes: entry.notes,
      timestamp: entry.timestamp,
      ...gameSpecificExpanded
    };
  });

  // Combine all entries into one CSV
  const allEntries = [...expandedPitEntries, ...expandedMatchEntries];
  return Papa.unparse(allEntries);
}

async function convertToXLSX(data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] }): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx-js-style');

  // Function to expand gameSpecificData (only one level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expandGameSpecificData = (gameSpecificData: Record<string, any>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expanded: Record<string, any> = {};

    for (const [key, value] of Object.entries(gameSpecificData)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // If it's an object, expand its properties as key_value pairs (one level only)
        for (const [subKey, subValue] of Object.entries(value)) {
          expanded[`${key}_${subKey}`] = subValue;
        }
      } else {
        // For simple values, keep as is
        expanded[key] = value;
      }
    }

    return expanded;
  };

  const workbook = XLSX.utils.book_new();

  // Expand pit entries
  const expandedPitEntries = data.pitEntries.map(entry => {
    const gameSpecificExpanded = expandGameSpecificData(entry.gameSpecificData);
    return {
      type: 'pit',
      id: entry.id,
      teamNumber: entry.teamNumber,
      year: entry.year,
      driveTrain: entry.driveTrain,
      weight: entry.weight,
      length: entry.length,
      width: entry.width,
      eventName: entry.eventName,
      eventCode: entry.eventCode,
      ...gameSpecificExpanded
    };
  });

  // Expand match entries
  const expandedMatchEntries = data.matchEntries.map(entry => {
    const gameSpecificExpanded = expandGameSpecificData(entry.gameSpecificData);
    return {
      type: 'match',
      id: entry.id,
      matchNumber: entry.matchNumber,
      teamNumber: entry.teamNumber,
      year: entry.year,
      alliance: entry.alliance,
      eventName: entry.eventName,
      eventCode: entry.eventCode,
      notes: entry.notes,
      timestamp: entry.timestamp,
      ...gameSpecificExpanded
    };
  });

  // Combine all entries into one sheet
  const allEntries = [...expandedPitEntries, ...expandedMatchEntries];
  const worksheet = XLSX.utils.json_to_sheet(allEntries);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scouting Data');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}
