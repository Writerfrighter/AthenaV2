import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const db = databaseManager.getService();
    if (!db.getPool) {
      return NextResponse.json({ error: 'Database service does not support direct SQL queries' }, { status: 500 });
    }
    const pool = await db.getPool();

    // Get current subscriptions for the user
    const userResult = await pool.request()
      .input('userId', session.user.id)
      .query('SELECT push_subscriptions FROM users WHERE id = @userId');

    let subscriptions: StoredSubscription[] = [];
    if (userResult.recordset.length > 0 && userResult.recordset[0].push_subscriptions) {
      try {
        subscriptions = JSON.parse(userResult.recordset[0].push_subscriptions);
      } catch (error) {
        console.error('Error parsing existing subscriptions:', error);
        subscriptions = [];
      }
    }

    // Remove the subscription
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);

    // Save back to database
    await pool.request()
      .input('userId', session.user.id)
      .input('subscriptions', JSON.stringify(subscriptions))
      .query('UPDATE users SET push_subscriptions = @subscriptions WHERE id = @userId');
    
    console.log('Push subscription removed for user:', session.user.id, endpoint);
    
    return NextResponse.json(
      { message: 'Subscription removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}