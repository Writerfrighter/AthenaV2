import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { DatabaseService } from '@/db/types';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

let dbService: DatabaseService;

function getDbService() {
  if (!dbService) {
    dbService = databaseManager.getService();
  }
  return dbService;
}

// GET /api/database/picklist/notes - Get picklist notes for a team or all
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_PICKLIST)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const picklistId = searchParams.get('picklistId');
    const teamNumber = searchParams.get('teamNumber') ? parseInt(searchParams.get('teamNumber')!) : undefined;

    if (!picklistId) {
      return NextResponse.json(
        { error: 'Missing required parameter: picklistId' },
        { status: 400 }
      );
    }

    const service = getDbService();
    const notes = await service.getPicklistNotes(parseInt(picklistId), teamNumber);

    return NextResponse.json({
      picklistId,
      teamNumber,
      notes,
      count: notes.length,
      success: true
    });
  } catch (error) {
    console.error('Error fetching picklist notes:', error);
    return NextResponse.json({ error: 'Failed to fetch picklist notes' }, { status: 500 });
  }
}

// POST /api/database/picklist/notes - Add a note to a team's picklist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EDIT_PICKLIST)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { picklistId, teamNumber, note } = body;

    if (!picklistId || !teamNumber || !note) {
      return NextResponse.json(
        { error: 'Missing required fields: picklistId, teamNumber, note' },
        { status: 400 }
      );
    }

    const service = getDbService();
    const noteId = await service.addPicklistNote({
      picklistId,
      teamNumber,
      note,
      created_by: session.user.id
    });

    return NextResponse.json({
      id: noteId,
      picklistId,
      teamNumber,
      note,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error adding picklist note:', error);
    return NextResponse.json({ error: 'Failed to add picklist note' }, { status: 500 });
  }
}

// PUT /api/database/picklist/notes - Update a picklist note
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EDIT_PICKLIST)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { noteId, note } = body;

    if (!noteId || !note) {
      return NextResponse.json(
        { error: 'Missing required fields: noteId, note' },
        { status: 400 }
      );
    }

    const service = getDbService();
    await service.updatePicklistNote(noteId, { note });

    return NextResponse.json({
      noteId,
      updated: true,
      success: true
    });
  } catch (error) {
    console.error('Error updating picklist note:', error);
    return NextResponse.json({ error: 'Failed to update picklist note' }, { status: 500 });
  }
}

// DELETE /api/database/picklist/notes - Delete a picklist note
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.EDIT_PICKLIST)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: noteId' },
        { status: 400 }
      );
    }

    const service = getDbService();
    await service.deletePicklistNote(parseInt(noteId));

    return NextResponse.json({
      noteId,
      deleted: true,
      success: true
    });
  } catch (error) {
    console.error('Error deleting picklist note:', error);
    return NextResponse.json({ error: 'Failed to delete picklist note' }, { status: 500 });
  }
}
