import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceMock, asNextRequest } from "../../helpers/test-doubles";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(async () => ({ user: { id: "user-1", role: "admin" } })),
}));

vi.mock("@/lib/auth/roles", () => ({
  hasPermission: vi.fn(() => true),
  PERMISSIONS: { VIEW_PICKLIST: "VIEW_PICKLIST", EDIT_PICKLIST: "EDIT_PICKLIST" },
}));

const post = (body: unknown) =>
  asNextRequest(
    new Request("http://test/api/scouting/picklist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
const valid = { eventCode: "2026test", year: 2026, competitionType: "FRC" };

describe("POST /api/scouting/picklist", () => {
  let service: ServiceMock;

  beforeEach(() => {
    vi.resetModules();
    service = {
      addPicklist: vi.fn().mockResolvedValue(7),
      addPicklistEntry: vi.fn().mockResolvedValue(1),
    };
    vi.doMock("@/db/database-manager", () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it("writes nothing when any entry is invalid", async () => {
    const route = await import("@/app/api/scouting/picklist/route");
    for (const entries of [
      [{ teamNumber: 254, rank: 1 }, { teamNumber: "1678a", rank: 2 }],
      [{ teamNumber: 254, rank: 1 }, { teamNumber: 254, rank: 2 }],
    ]) {
      const res = await route.POST(post({ ...valid, entries }));
      expect(res.status).toBe(400);
    }
    expect(service.addPicklist).not.toHaveBeenCalled();
    expect(service.addPicklistEntry).not.toHaveBeenCalled();
  });

  it("creates the picklist and its entries", async () => {
    const route = await import("@/app/api/scouting/picklist/route");
    const res = await route.POST(post({ ...valid, entries: [{ teamNumber: 254, rank: 1 }] }));
    expect(res.status).toBe(200);
    expect(service.addPicklist).toHaveBeenCalledWith({ ...valid, picklistType: "main" });
    expect(service.addPicklistEntry).toHaveBeenCalledWith({ picklistId: 7, teamNumber: 254, rank: 1 });
  });
});
