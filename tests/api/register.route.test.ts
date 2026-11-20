import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.fn().mockResolvedValue({ success: true, userId: "1" });

describe("POST /api/auth/register rate limit", () => {
  beforeEach(() => {
    vi.resetModules();
    createUser.mockClear();
    delete process.env.RATE_LIMIT_IP_HEADER;
    vi.doMock("@/lib/server/env-file", () => ({ loadSystemSettings: () => ({ signupEnabled: true }) }));
    vi.doMock("@/lib/server/user-service", () => ({ createUser }));
  });

  const register = (route: { POST: (request: NextRequest) => Promise<Response> }, username: string) =>
    route.POST(new NextRequest("http://test/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: username, username, password: "correct horse battery" }),
    }));

  it("lets a whole team sign up at once but limits retries of one username", async () => {
    const route = await import("@/app/api/auth/register/route");
    for (let index = 0; index < 40; index++) {
      expect((await register(route, `scout${index}`)).status).toBe(201);
    }
    for (let attempt = 1; attempt < 20; attempt++) await register(route, "scout0");
    expect((await register(route, "scout0")).status).toBe(429);
  });
});
