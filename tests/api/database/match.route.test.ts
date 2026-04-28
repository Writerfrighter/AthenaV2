import { describe, it, expect, beforeEach, vi } from 'vitest';

let authSession: any = { user: { id: 'user-1', role: 'admin' } };
let permissionResult = true;

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(async () => authSession),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: vi.fn(() => permissionResult),
  PERMISSIONS: {
    VIEW_MATCH_SCOUTING: 'VIEW_MATCH_SCOUTING',
    CREATE_MATCH_SCOUTING: 'CREATE_MATCH_SCOUTING',
    EDIT_MATCH_SCOUTING: 'EDIT_MATCH_SCOUTING',
    DELETE_MATCH_SCOUTING: 'DELETE_MATCH_SCOUTING',
    SCOUT_ON_BEHALF: 'SCOUT_ON_BEHALF',
  },
}));

describe('/api/database/match', () => {
  let service: any;

  beforeEach(() => {
    vi.resetModules();
    permissionResult = true;
    authSession = { user: { id: 'user-1', role: 'admin' } };

    service = {
      getAllMatchEntries: vi.fn().mockResolvedValue([]),
      getMatchEntries: vi.fn().mockResolvedValue([]),
      addMatchEntry: vi.fn().mockResolvedValue(202),
      updateMatchEntry: vi.fn().mockResolvedValue(undefined),
      deleteMatchEntry: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock('@/db/database-manager', () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it('returns 403 when unauthorized', async () => {
    permissionResult = false;
    const route = await import('@/app/api/database/match/route');
    const req = new Request('http://test/api/database/match');
    const res = await route.GET(req as any);
    expect(res.status).toBe(403);
  });

  it('returns 404 when ID not found', async () => {
    const route = await import('@/app/api/database/match/route');
    const req = new Request('http://test/api/database/match?id=99');
    const res = await route.GET(req as any);
    expect(res.status).toBe(404);
  });

  it('rejects duplicate match entry', async () => {
    service.getAllMatchEntries.mockResolvedValue([
      { id: 1, teamNumber: 111, matchNumber: 2, year: 2025, eventCode: 'EVT', competitionType: 'FRC' },
    ]);

    const route = await import('@/app/api/database/match/route');
    const req = new Request('http://test/api/database/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        teamNumber: 111,
        matchNumber: 2,
        year: 2025,
        eventCode: 'EVT',
        competitionType: 'FRC',
        alliance: 'red',
        notes: '',
        timestamp: new Date().toISOString(),
        gameSpecificData: {},
      }),
    });

    const res = await route.POST(req as any);
    expect(res.status).toBe(409);
  });

  it('returns 400 when delete lacks id', async () => {
    const route = await import('@/app/api/database/match/route');
    const req = new Request('http://test/api/database/match');
    const res = await route.DELETE(req as any);
    expect(res.status).toBe(400);
  });

  it('creates match entry when valid', async () => {
    const route = await import('@/app/api/database/match/route');
    const req = new Request('http://test/api/database/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        teamNumber: 222,
        matchNumber: 3,
        year: 2025,
        eventCode: 'EVT',
        competitionType: 'FRC',
        alliance: 'blue',
        notes: '',
        timestamp: new Date().toISOString(),
        gameSpecificData: {},
      }),
    });

    const res = await route.POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBe(202);
    expect(service.addMatchEntry).toHaveBeenCalled();
  });
});
