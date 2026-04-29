import { describe, it, expect, beforeEach, vi } from "vitest";

let authSession: any = { user: { id: "user-1", role: "admin" } };
let permissionResult = true;

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(async () => authSession),
}));

vi.mock("@/lib/auth/roles", () => ({
  hasPermission: vi.fn(() => permissionResult),
  PERMISSIONS: {
    VIEW_PICKLIST: "VIEW_PICKLIST",
    EDIT_PICKLIST: "EDIT_PICKLIST",
  },
}));

describe("/api/database/picklist/entries", () => {
  let service: any;

  beforeEach(() => {
    vi.resetModules();
    permissionResult = true;
    authSession = { user: { id: "user-1", role: "admin" } };

    service = {
      getPicklistEntries: vi.fn().mockResolvedValue([]),
      addPicklistEntry: vi.fn().mockResolvedValue(11),
      updatePicklistEntry: vi.fn().mockResolvedValue(undefined),
      deletePicklistEntry: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock("@/db/database-manager", () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it("returns 400 when picklistId missing", async () => {
    const route = await import("@/app/api/database/picklist/entries/route");
    const req = new Request("http://test/api/database/picklist/entries");
    const res = await route.GET(req as any);
    expect(res.status).toBe(400);
  });

  it("creates entry when valid", async () => {
    const route = await import("@/app/api/database/picklist/entries/route");
    const req = new Request("http://test/api/database/picklist/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ picklistId: 1, teamNumber: 111, rank: 1 }),
    });

    const res = await route.POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(11);
  });

  it("returns 400 when entryId missing on update", async () => {
    const route = await import("@/app/api/database/picklist/entries/route");
    const req = new Request("http://test/api/database/picklist/entries", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rank: 2 }),
    });

    const res = await route.PUT(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when entryId missing on delete", async () => {
    const route = await import("@/app/api/database/picklist/entries/route");
    const req = new Request("http://test/api/database/picklist/entries");
    const res = await route.DELETE(req as any);
    expect(res.status).toBe(400);
  });
});
