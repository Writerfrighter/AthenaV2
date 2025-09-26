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
    const subscription: StoredSubscription = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store the subscription (in production, save to database)
    subscriptions.set(subscription.endpoint, subscription);
    
    console.log('New push subscription:', subscription.endpoint);
    
    return NextResponse.json(
      { message: 'Subscription saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}