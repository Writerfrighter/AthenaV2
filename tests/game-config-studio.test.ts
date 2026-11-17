import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEW_CONFIG,
  renameField,
  uniqueKey,
} from "@/components/settings/game-config-studio/types";

import { validateYearConfig } from "@/lib/game-config/config-validator";

describe("game config studio helpers", () => {
  it("renames a match field in place and repoints its references", () => {
    const renamed = renameField(
      DEFAULT_NEW_CONFIG,
      "match",
      "teleop",
      "game_piece_scored",
      "fuel",
    );
    expect(Object.keys(renamed.scoring.teleop)).toEqual(["fuel", "game_piece_missed"]);
    expect(renamed.matchupCardConfig?.teleopMetrics[0].key).toBe("teleop.fuel");
    expect(renamed.teamPageConfig?.kpis.teleop.key).toBe("teleop.fuel");
    // Same field name in another section is a different field
    expect(renamed.matchupCardConfig?.autoMetrics[0].key).toBe("autonomous.game_piece_scored");
  });

  it("repoints dependsOn when a pit field is renamed", () => {
    const renamed = renameField(DEFAULT_NEW_CONFIG, "pit", "endgame", "canClimb", "climbs");
    expect(renamed.pitScouting.endgame.climbTimeSeconds.dependsOn).toBe("climbs");
  });

  it("never hands out a key that is already taken", () => {
    expect(uniqueKey({ a: 1, a_2: 1 }, "a")).toBe("a_3");
    expect(uniqueKey({}, "a")).toBe("a");
  });

  it("accepts only small image data URLs as the field image", () => {
    const withImage = (fieldImage: string) => validateYearConfig({ ...DEFAULT_NEW_CONFIG, fieldImage }).valid;
    expect(withImage("data:image/jpeg;base64,AAAA")).toBe(true);
    expect(withImage("https://example.com/field.png")).toBe(false);
    expect(withImage("data:text/html;base64,AAAA")).toBe(false);
    expect(withImage(`data:image/jpeg;base64,${"A".repeat(1_000_001)}`)).toBe(false);
  });
});
