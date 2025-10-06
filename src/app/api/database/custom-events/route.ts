import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { CustomEvent, DatabaseService } from '@/db/types';

// Initialize database service
let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// GET /api/database/custom-events - Get all custom events or filter by year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode') || undefined;

    const service = getDbService();

    if (eventCode) {
      const event = await service.getCustomEvent(eventCode);
      if (!event) {
        return NextResponse.json({ error: 'Custom event not found' }, { status: 404 });
      }
      return NextResponse.json(event);
    } else {
      const events = await service.getAllCustomEvents(year);
      return NextResponse.json(events);
    }
  } catch (error) {
    console.error('Error fetching custom events:', error);
    return NextResponse.json({ error: 'Failed to fetch custom events' }, { status: 500 });
  }
}

// POST /api/database/custom-events - Add new custom event
export async function POST(request: NextRequest) {
  try {
    const event: Omit<CustomEvent, 'id'> = await request.json();
    const service = getDbService();
    const id = await service.addCustomEvent(event);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error adding custom event:', error);
    return NextResponse.json({ error: 'Failed to add custom event' }, { status: 500 });
  }
}

// PUT /api/database/custom-events - Update custom event
export async function PUT(request: NextRequest) {
  try {
    const { eventCode, ...updates } = await request.json();

    if (!eventCode) {
      return NextResponse.json({ error: 'eventCode is required' }, { status: 400 });
    }

    const service = getDbService();
    await service.updateCustomEvent(eventCode, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating custom event:', error);
    return NextResponse.json({ error: 'Failed to update custom event' }, { status: 500 });
  }
}

// DELETE /api/database/custom-events - Delete custom event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('eventCode');

    if (!eventCode) {
      return NextResponse.json({ error: 'eventCode parameter is required' }, { status: 400 });
    }

    const service = getDbService();
    await service.deleteCustomEvent(eventCode);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom event:', error);
    return NextResponse.json({ error: 'Failed to delete custom event' }, { status: 500 });
  }
}