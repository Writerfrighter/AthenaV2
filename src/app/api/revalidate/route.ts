import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // Check authentication and permission
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.REVALIDATE_CACHE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Revalidate common paths
    const pathsToRevalidate = [
      '/',
      '/dashboard',
      '/dashboard/teams',
      '/dashboard/analysis',
      '/dashboard/picklist',
      '/dashboard/schedule',
      '/dashboard/settings',
      '/scout/matchscout',
      '/scout/pitscout',
    ];

    // Revalidate all paths
    for (const path of pathsToRevalidate) {
      revalidatePath(path, 'page');
    }

    // Also revalidate layout to ensure full refresh
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated successfully',
      revalidatedPaths: pathsToRevalidate.length
    });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
