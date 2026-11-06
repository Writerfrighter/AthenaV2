import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { loadGameConfig } from "@/lib/server/game-config-store";
import type { GameConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Read-only runtime configuration for every signed-in scouting client. */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    let config = loadGameConfig();
    if (session.guestEvent) {
      const { competitionType, year } = session.guestEvent;
      const season = config[competitionType]?.[year];
      config = { FRC: {}, FTC: {} } as GameConfig;
      if (season) config[competitionType][year] = season;
    }
    return NextResponse.json({ config }, { headers });
  } catch (error) {
    console.error("Failed to load game configuration:", error);
    return NextResponse.json({ error: "Failed to load game configuration" }, { status: 500, headers });
  }
}
