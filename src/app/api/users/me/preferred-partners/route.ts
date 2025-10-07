import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';

// GET /api/users/me/preferred-partners
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = databaseManager.getService();
    const preferredPartners = await service.getUserPreferredPartners(session.user.id);

    return NextResponse.json({ preferredPartners });
  } catch (error) {
    console.error('Error fetching preferred partners:', error);
    return NextResponse.json({ error: 'Failed to fetch preferred partners' }, { status: 500 });
  }
}

// PUT /api/users/me/preferred-partners
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferredPartners } = body;

    if (!Array.isArray(preferredPartners)) {
      return NextResponse.json(
        { error: 'preferredPartners must be an array of user IDs' },
        { status: 400 }
      );
    }

    // Validate that preferred partners doesn't include the user themselves
    if (preferredPartners.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a preferred partner' },
        { status: 400 }
      );
    }

    const service = databaseManager.getService();
    await service.updateUserPreferredPartners(session.user.id, preferredPartners);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating preferred partners:', error);
    return NextResponse.json({ error: 'Failed to update preferred partners' }, { status: 500 });
  }
}
