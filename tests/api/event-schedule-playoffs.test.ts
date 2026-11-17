import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/require-permission", () => ({
  requirePermission: vi.fn(async () => null),
}));

const tbaMatch = (comp_level: string, set_number: number, match_number: number, red: number) => ({
  comp_level, set_number, match_number, time: null,
  alliances: {
    red: { team_keys: [`frc${red}`, "frc2", "frc3"] },
    blue: { team_keys: ["frc4", "frc5", "frc6"] },
  },
});

vi.mock("@/lib/api/tba", () => ({
  getEventMatches: vi.fn(async () => [
    tbaMatch("f", 1, 2, 902),
    tbaMatch("qm", 1, 2, 12),
    tbaMatch("sf", 2, 1, 802),
    tbaMatch("f", 1, 1, 901),
    tbaMatch("qm", 1, 1, 11),
    tbaMatch("sf", 1, 1, 801),
  ]),
}));
vi.mock("@/lib/api/ftcevents", () => ({ getEventSchedule: vi.fn(), getEventMatches: vi.fn() }));

async function schedule(query: string) {
  const { GET } = await import("@/app/api/events/[eventCode]/schedule/route");
  const response = await GET(
    new NextRequest(`http://test/api/events/2026evt/schedule?competitionType=FRC${query}`),
    { params: Promise.resolve({ eventCode: "2026evt" }) },
  );
  return (await response.json()).matches as { matchNumber: number; label?: string; teams: { teamNumber: number }[] }[];
}

describe("event schedule match levels", () => {
  it("returns only qualification matches by default", async () => {
    const matches = await schedule("");
    expect(matches.map((m) => [m.matchNumber, m.teams[0].teamNumber, m.label])).toEqual([
      [1, 11, undefined],
      [2, 12, undefined],
    ]);
  });

  it("numbers playoff matches in play order and keeps their official names", async () => {
    const matches = await schedule("&level=playoff");
    expect(matches.map((m) => [m.matchNumber, m.teams[0].teamNumber, m.label])).toEqual([
      [1, 801, "SF 1-1"],
      [2, 802, "SF 2-1"],
      [3, 901, "F 1-1"],
      [4, 902, "F 1-2"],
    ]);
  });
});
