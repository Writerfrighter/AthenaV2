import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// GET /api/schedule/assignments?blockId=xxx or ?eventCode=xxx&year=2025 or ?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.VIEW_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const blockId = searchParams.get('blockId');
    const eventCode = searchParams.get('eventCode');
    const year = searchParams.get('year');
    const userId = searchParams.get('userId');

    const service = databaseManager.getService();
    let assignments;

    if (blockId) {
      assignments = await service.getBlockAssignments(parseInt(blockId));
    } else if (eventCode && year) {
      assignments = await service.getBlockAssignmentsByEvent(eventCode, parseInt(year));
    } else if (userId) {
      assignments = await service.getBlockAssignmentsByUser(userId);
    } else {
      return NextResponse.json(
        { error: 'blockId, (eventCode and year), or userId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching block assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch block assignments' }, { status: 500 });
  }
}

// POST /api/schedule/assignments - Create new block assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow scouts to assign themselves, but only lead_scout/admin can assign others
    const body = await request.json();
    const { blockId, userId, alliance, position } = body;

    if (!blockId || !userId || !alliance || position === undefined) {
      return NextResponse.json(
        { error: 'blockId, userId, alliance, and position are required' },
        { status: 400 }
      );
    }

    // Users cannot assign themselves - only users with CREATE_SCHEDULE or EDIT_SCHEDULE can make assignments
    if (!hasPermission(session.user.role ?? null, PERMISSIONS.CREATE_SCHEDULE) && 
        !hasPermission(session.user.role ?? null, PERMISSIONS.EDIT_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['red', 'blue'].includes(alliance)) {
      return NextResponse.json({ error: 'alliance must be "red" or "blue"' }, { status: 400 });
    }

    if (position < 0 || position > 2) {
      return NextResponse.json({ error: 'position must be 0, 1, or 2' }, { status: 400 });
    }

    const service = databaseManager.getService();
    const id = await service.addBlockAssignment({
      blockId: parseInt(blockId),
      userId,
      alliance,
      position: parseInt(position)
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating block assignment:', error);
    return NextResponse.json({ error: 'Failed to create block assignment' }, { status: 500 });
  }
}

// DELETE /api/schedule/assignments?blockId=xxx - Delete all assignments for a block
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.DELETE_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'blockId is required' }, { status: 400 });
    }

    const service = databaseManager.getService();
    await service.deleteBlockAssignmentsByBlock(parseInt(blockId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block assignments:', error);
    return NextResponse.json({ error: 'Failed to delete block assignments' }, { status: 500 });
  }
}
