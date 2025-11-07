import { NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// POST /api/database/reset - Reset all database data
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.RESET_DATABASE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await databaseManager.resetDatabase();
    return NextResponse.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}
