import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/api-keys", () => ({
  loadApiKeys: () => ({ tbaApiKey: "key", ftcApiKey: "", nexusApiKey: "" }),
}));

describe("TBA request paths", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("refuses event codes that would reach another endpoint", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const { getEventRankings } = await import("@/lib/api/tba");
    for (const code of ["../team/frc1", "2025evt?x=1", "2025evt#a", "2025evt/../../status", ""]) {
      await expect(getEventRankings(code)).rejects.toThrow("Invalid TBA request path");
    }
    expect(fetchMock).not.toHaveBeenCalled();
    await getEventRankings("2025pncmp");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
