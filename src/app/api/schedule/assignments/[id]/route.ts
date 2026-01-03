import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// GET /api/schedule/assignments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.VIEW_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const service = databaseManager.getService();
    const assignment = await service.getBlockAssignment(parseInt(id));

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching block assignment:', error);
    return NextResponse.json({ error: 'Failed to fetch block assignment' }, { status: 500 });
  }
}

// PUT /api/schedule/assignments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing assignment to check ownership
    const service = databaseManager.getService();
    const existing = await service.getBlockAssignment(parseInt(id));

    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user is updating their own assignment or has permission to update others
    if (existing.userId !== session.user.id && !hasPermission(session.user.role ?? null, PERMISSIONS.EDIT_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Users can edit their own assignments, otherwise need EDIT_SCHEDULE
    if (existing.userId !== session.user.id) {
      if (!hasPermission(session.user.role ?? null, PERMISSIONS.EDIT_SCHEDULE)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updates: { userId?: string; alliance?: 'red' | 'blue'; position?: number } = {};

    if (body.userId !== undefined) {
      // Only users with EDIT_SCHEDULE can reassign to different users
      if (body.userId !== existing.userId && !hasPermission(session.user.role ?? null, PERMISSIONS.EDIT_SCHEDULE)) {
        return NextResponse.json({ error: 'Forbidden - cannot reassign to another user' }, { status: 403 });
      }
      updates.userId = body.userId;
    }
    if (body.alliance !== undefined) {
      if (!['red', 'blue'].includes(body.alliance)) {
        return NextResponse.json({ error: 'alliance must be "red" or "blue"' }, { status: 400 });
      }
      updates.alliance = body.alliance;
    }
    if (body.position !== undefined) {
      const pos = parseInt(body.position);
      if (pos < 0 || pos > 2) {
        return NextResponse.json({ error: 'position must be 0, 1, or 2' }, { status: 400 });
      }
      updates.position = pos;
    }

    await service.updateBlockAssignment(parseInt(id), updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating block assignment:', error);
    return NextResponse.json({ error: 'Failed to update block assignment' }, { status: 500 });
  }
}

// DELETE /api/schedule/assignments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const service = databaseManager.getService();
    const existing = await service.getBlockAssignment(parseInt(id));

    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user is deleting their own assignment or has permission to delete others
    if (existing.userId !== session.user.id && !hasPermission(session.user.role ?? null, PERMISSIONS.DELETE_SCHEDULE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Users can remove themselves from assignments, otherwise need DELETE_SCHEDULE for others
    // No additional permission check needed - self-removal is allowed for all users with VIEW_SCHEDULE

    await service.deleteBlockAssignment(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block assignment:', error);
    return NextResponse.json({ error: 'Failed to delete block assignment' }, { status: 500 });
  }
}
