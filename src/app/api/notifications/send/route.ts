import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.SEND_NOTIFICATIONS)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { title, message, targetEndpoint } = body;

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 });
		}

		const result = await sendPushNotification({
			payload: {
				title,
				body: message || '',
				url: '/dashboard',
			},
			targetEndpoint,
		});

		if (result.skipped) {
			return NextResponse.json({
				success: true,
				message: 'VAPID keys not configured; skipping push send',
				...result,
			});
		}

		return NextResponse.json({
			success: true,
			message: `Notifications sent: ${result.successful} successful, ${result.failed} failed`,
			...result,
		});
	} catch (error) {
		console.error('Error sending notification:', error);
		return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
	}
}