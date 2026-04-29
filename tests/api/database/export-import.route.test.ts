import { describe, it, expect, beforeEach, vi } from "vitest";

let authSession: any = { user: { id: "user-1", role: "admin" } };
let permissionResult = true;

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(async () => authSession),
}));

vi.mock("@/lib/auth/roles", () => ({
  hasPermission: vi.fn(() => permissionResult),
  PERMISSIONS: {
    EXPORT_DATA: "EXPORT_DATA",
    IMPORT_DATA: "IMPORT_DATA",
  },
}));

describe("/api/database/export and import", () => {
  let service: any;

  beforeEach(() => {
    vi.resetModules();
    permissionResult = true;
    authSession = { user: { id: "user-1", role: "admin" } };

    service = {
      exportData: vi.fn().mockResolvedValue({
        pitEntries: [
          {
            id: 1,
            teamNumber: 1,
            year: 2025,
            competitionType: "FRC",
            eventCode: "EVT",
            gameSpecificData: {},
          },
        ],
        matchEntries: [
          {
            id: 2,
            teamNumber: 1,
            matchNumber: 1,
            year: 2025,
            competitionType: "FRC",
            eventCode: "EVT",
            alliance: "red",
            notes: "",
            timestamp: new Date(),
            gameSpecificData: {},
          },
        ],
      }),
      importData: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock("@/db/database-manager", () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it("exports json and filters types", async () => {
    const route = await import("@/app/api/database/export/route");
    const req = new Request(
      "http://test/api/database/export?format=json&types=pit",
    );
    const res = await route.GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pitEntries?.length).toBe(1);
    expect(body.matchEntries).toBeUndefined();
  });

  it("imports json payload", async () => {
    const route = await import("@/app/api/database/import/route");
    const req = new Request("http://test/api/database/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pitEntries: [], matchEntries: [] }),
    });

    const res = await route.POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(service.importData).toHaveBeenCalledWith({
      pitEntries: [],
      matchEntries: [],
    });
  });
});
