import { NextResponse } from 'next/server';
import { databaseManager } from '@/db/database-manager';

// POST /api/database/reset - Reset all database data
export async function POST() {
  try {
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
