import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// GET /api/schedule/blocks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.VIEW_MATCH_SCOUTING)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const service = databaseManager.getService();
    const block = await service.getScoutingBlock(parseInt(id));

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error fetching scouting block:', error);
    return NextResponse.json({ error: 'Failed to fetch scouting block' }, { status: 500 });
  }
}

// PUT /api/schedule/blocks/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.MANAGE_EVENT_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const updates: { blockNumber?: number; startMatch?: number; endMatch?: number } = {};

    if (body.blockNumber !== undefined) updates.blockNumber = parseInt(body.blockNumber);
    if (body.startMatch !== undefined) updates.startMatch = parseInt(body.startMatch);
    if (body.endMatch !== undefined) updates.endMatch = parseInt(body.endMatch);

    if (updates.startMatch !== undefined && updates.endMatch !== undefined && updates.endMatch < updates.startMatch) {
      return NextResponse.json({ error: 'endMatch must be >= startMatch' }, { status: 400 });
    }

    const service = databaseManager.getService();
    await service.updateScoutingBlock(parseInt(id), updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating scouting block:', error);
    return NextResponse.json({ error: 'Failed to update scouting block' }, { status: 500 });
  }
}

// DELETE /api/schedule/blocks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.MANAGE_EVENT_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const service = databaseManager.getService();
    await service.deleteScoutingBlock(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scouting block:', error);
    return NextResponse.json({ error: 'Failed to delete scouting block' }, { status: 500 });
  }
}
