import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { auth } from '@/lib/auth/config';
import { databaseManager } from '@/db/database-manager';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Configure VAPID keys (in production, use environment variables)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || ""
};

// Only set VAPID details if we have valid keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:noahnfang@outlook.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  url?: string;
}

async function loadAllSubscriptions(): Promise<Map<string, StoredSubscription>> {
  const db = databaseManager.getService();
  if (!db.getPool) {
    throw new Error('Database service does not support direct SQL queries');
  }
  const pool = await db.getPool();

  const result = await pool.request()
    .query('SELECT id, push_subscriptions FROM users WHERE push_subscriptions IS NOT NULL');

  const subscriptions = new Map<string, StoredSubscription>();

  for (const user of result.recordset) {
    if (user.push_subscriptions) {
      try {
        const userSubscriptions: StoredSubscription[] = JSON.parse(user.push_subscriptions);
        for (const sub of userSubscriptions) {
          subscriptions.set(sub.endpoint, sub);
        }
      } catch (error) {
        console.error(`Error parsing subscriptions for user ${user.id}:`, error);
      }
    }
  }

  return subscriptions;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.SEND_NOTIFICATIONS)) {
      return NextResponse.json(
        { error: 'Unauthorized - Notification permission required' },
        { status: 403 }
      );
    }

    const { payload, targetEndpoint }: { payload: NotificationPayload; targetEndpoint?: string } = await request.json();
    
    if (!payload || !payload.title) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    const notificationData = {
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || '/TRCLogo.webp',
      badge: payload.badge || '/TRCLogo.webp',
      data: {
        ...payload.data,
        url: payload.url || '/dashboard',
      },
    };

    const subscriptions = await loadAllSubscriptions();
    const results: Array<{endpoint: string, success: boolean, error?: string}> = [];
    
    if (targetEndpoint) {
      // Send to specific subscription
      const subscription = subscriptions.get(targetEndpoint);
      if (subscription) {
        try {
          await webPush.sendNotification(subscription as webPush.PushSubscription, JSON.stringify(notificationData));
          results.push({ endpoint: targetEndpoint, success: true });
        } catch (error: unknown) {
          console.error('Error sending to specific endpoint:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ endpoint: targetEndpoint, success: false, error: errorMessage });
        }
      } else {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }
    } else {
      // Send to all subscriptions
      const promises = Array.from(subscriptions.entries()).map(async ([endpoint, subscription]) => {
        try {
          await webPush.sendNotification(subscription as webPush.PushSubscription, JSON.stringify(notificationData));
          return { endpoint, success: true };
        } catch (error: unknown) {
          console.error(`Error sending to ${endpoint}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { endpoint, success: false, error: errorMessage };
        }
      });

      results.push(...await Promise.all(promises));
    }
    
    return NextResponse.json({
      message: 'Notifications sent',
      results,
      successful: results.filter((r: {success: boolean}) => r.success).length,
      failed: results.filter((r: {success: boolean}) => !r.success).length,
    });
  } catch (error: unknown) {
    console.error('Error sending notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send notifications: ' + errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to list subscriptions (for debugging/admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.SEND_NOTIFICATIONS)) {
      return NextResponse.json(
        { error: 'Unauthorized - Notification permission required' },
        { status: 403 }
      );
    }

    const subscriptions = await loadAllSubscriptions();
    return NextResponse.json({
      subscriptionCount: subscriptions.size,
      endpoints: Array.from(subscriptions.keys()).map((endpoint: string) => ({
        endpoint: endpoint.substring(0, 50) + '...', // Truncate for privacy
      })),
    });
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to load subscriptions' },
      { status: 500 }
    );
  }
}