import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { databaseManager } from '@/db/database-manager';

// PUT /api/users/me/password - Change own password
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'currentPassword and newPassword are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const service = databaseManager.getService();
    if (!service.getPool) {
      return NextResponse.json({ error: 'Database operation not supported' }, { status: 500 });
    }
    const pool = await service.getPool();

    // Get current password hash
    const result = await pool
      .request()
      .input('id', sql.NVarChar, session.user.id)
      .query('SELECT password_hash FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.recordset[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool
      .request()
      .input('id', sql.NVarChar, session.user.id)
      .input('password_hash', sql.NVarChar, hashedPassword)
      .query('UPDATE users SET password_hash = @password_hash, updated_at = GETDATE() WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
