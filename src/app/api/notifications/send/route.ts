import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In a real application, you would store subscriptions in a database
// For now, we'll use a simple in-memory store (this will reset on server restart)
const subscriptions = new Map<string, StoredSubscription>();

// Configure VAPID keys (in production, use environment variables)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BNI8ZmkRyqrHYa-jPrPk-wqnC8QHGlOKn7qUMzLGG9ZKKzj_oNYvWwOPMcAD5lQP-r8OuZdJXeKC8KsTfJB8HpQ',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-key-here'
};

// Only set VAPID details if we have valid keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:your-email@example.com',
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

export async function POST(request: NextRequest) {
  try {
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

    const results = [];
    
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
          // Remove invalid subscriptions
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              subscriptions.delete(endpoint);
            }
          }
          return { endpoint, success: false, error: errorMessage };
        }
      });

      results.push(...await Promise.all(promises));
    }
    
    return NextResponse.json({
      message: 'Notifications sent',
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
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
  return NextResponse.json({
    subscriptionCount: subscriptions.size,
    endpoints: Array.from(subscriptions.keys()).map(endpoint => ({
      endpoint: endpoint.substring(0, 50) + '...', // Truncate for privacy
    })),
  });
}