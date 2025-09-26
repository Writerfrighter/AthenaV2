import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Remove the subscription (in production, remove from database)
    subscriptions.delete(endpoint);
    
    console.log('Removed push subscription:', endpoint);
    
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