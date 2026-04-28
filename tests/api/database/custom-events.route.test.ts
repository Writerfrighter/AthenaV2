import { describe, it, expect, beforeEach, vi } from 'vitest';

let authSession: any = { user: { id: 'user-1', role: 'admin' } };
let permissionResult = true;

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(async () => authSession),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: vi.fn(() => permissionResult),
  PERMISSIONS: {
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',
    MANAGE_EVENT_SETTINGS: 'MANAGE_EVENT_SETTINGS',
  },
}));

describe('/api/database/custom-events', () => {
  let service: any;

  beforeEach(() => {
    vi.resetModules();
    permissionResult = true;
    authSession = { user: { id: 'user-1', role: 'admin' } };

    service = {
      getCustomEvent: vi.fn().mockResolvedValue(undefined),
      getAllCustomEvents: vi.fn().mockResolvedValue([]),
      addCustomEvent: vi.fn().mockResolvedValue(301),
      updateCustomEvent: vi.fn().mockResolvedValue(undefined),
      deleteCustomEvent: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock('@/db/database-manager', () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it('returns 404 when event code not found', async () => {
    const route = await import('@/app/api/database/custom-events/route');
    const req = new Request('http://test/api/database/custom-events?eventCode=EVT');
    const res = await route.GET(req as any);
    expect(res.status).toBe(404);
  });

  it('creates custom event when valid', async () => {
    const route = await import('@/app/api/database/custom-events/route');
    const req = new Request('http://test/api/database/custom-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventCode: 'EVT',
        name: 'Event',
        date: new Date().toISOString(),
        matchCount: 10,
        year: 2025,
        competitionType: 'FRC',
      }),
    });

    const res = await route.POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe(301);
  });
});
