import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/db/azuresql-database-service', () => ({
  AzureSqlDatabaseService: class AzureSqlDatabaseService {
    constructor(public config: any) {}
  }
}));

vi.mock('@/db/local-database-service', () => ({
  LocalDatabaseService: class LocalDatabaseService {
    constructor(public config: any) {}
  }
}));

vi.mock('@/db/firebase-database-service', () => ({
  FirebaseDatabaseService: class FirebaseDatabaseService {
    constructor(public config: any) {}
  }
}));

vi.mock('@/db/cosmos-database-service', () => ({
  CosmosDatabaseService: class CosmosDatabaseService {
    constructor(public config: any) {}
  }
}));

beforeEach(() => {
  vi.resetModules();
  process.env = { ...process.env, DATABASE_PROVIDER: 'firebase', FIREBASE_SERVICE_ACCOUNT_JSON: '{}' };
});

describe('GET /api/database/provider-options', () => {
  it('returns provider info', async () => {
    const route = await import('@/app/api/database/provider-options/route');
    const response = await route.GET();
    const json = await response.json();

    expect(json.currentProvider).toBe('firebase');
    expect(json.providers).toContain('local');
    expect(json.config).toHaveProperty('provider', 'firebase');
  });
});
