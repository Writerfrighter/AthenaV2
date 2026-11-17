import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MockAuthSession,
  ServiceMock,
  asNextRequest,
} from "../../helpers/test-doubles";

let authSession: MockAuthSession | null = {
  user: { id: "user-1", role: "admin" },
};
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

describe("/api/scouting/picklist/entries", () => {
  let service: ServiceMock;

  beforeEach(() => {
    vi.resetModules();
    permissionResult = true;
    authSession = { user: { id: "user-1", role: "admin" } };

    service = {
      getPicklistEntries: vi.fn().mockResolvedValue([]),
    };

    vi.doMock("@/db/database-manager", () => ({
      databaseManager: { getService: () => service },
    }));
  });

  it("returns 400 when picklistId missing", async () => {
    const route = await import("@/app/api/scouting/picklist/entries/route");
    const req = new Request("http://test/api/scouting/picklist/entries");
    const res = await route.GET(asNextRequest(req));
    expect(res.status).toBe(400);
  });
});
