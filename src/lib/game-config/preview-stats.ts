import type { MatchEntry, PitEntry, TeamData, YearConfig } from "@/lib/types";
import { getFieldType } from "@/components/forms/match-form-utils";
import { calculateDetailedGameStats } from "@/lib/statistics";
import type { DetailedGameStats } from "@/lib/statistics";

const PREVIEW_MATCH_COUNT = 12;

/** Deterministic per-field pseudo-random, so previews don't flicker on rerender. */
function seededValue(seed: string, matchIndex: number): number {
  let hash = 2166136261;
  for (const char of `${seed}:${matchIndex}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/**
 * Synthetic match data covering every field the config declares, run through
 * the real stats engine. Lets the designer previews resolve metric keys the
 * same way the live app does, so an unresolved key shows as missing rather
 * than as a plausible-looking fake number.
 */
export function buildPreviewStats(
  config: YearConfig,
  teamNumber = PREVIEW_TEAM_NUMBER,
): DetailedGameStats | null {
  return calculateDetailedGameStats(buildPreviewMatches(config, teamNumber), config);
}

export const PREVIEW_TEAM_NUMBER = 492;

/** Extra sample teams, for previews that compare several (alliances, rankings). */
export const PREVIEW_OTHER_TEAMS = [1678, 254, 2056, 4414] as const;

function buildPreviewMatches(config: YearConfig, teamNumber = PREVIEW_TEAM_NUMBER): MatchEntry[] {
  // The default team keeps its original seed so existing previews don't change.
  const seedPrefix = teamNumber === PREVIEW_TEAM_NUMBER ? "" : `${teamNumber}:`;
  const sections = ["autonomous", "teleop", "endgame", "fouls"] as const;

  return Array.from({ length: PREVIEW_MATCH_COUNT }, (_, matchIndex) => {
    const gameSpecificData: MatchEntry["gameSpecificData"] = {};

    for (const section of sections) {
      const fields = config.scoring?.[section];
      if (!fields) continue;

      const sectionData: Record<string, number | string | boolean> = {};

      for (const [fieldKey, definition] of Object.entries(fields)) {
        const roll = seededValue(`${seedPrefix}${section}.${fieldKey}`, matchIndex);
        const fieldType = getFieldType(definition);

        if (fieldType === "boolean") {
          sectionData[fieldKey] = roll > 0.35;
        } else if (fieldType === "select") {
          const options = Object.keys(definition.pointValues || {});
          if (options.length > 0) {
            sectionData[fieldKey] =
              options[Math.floor(roll * options.length) % options.length];
          }
        } else {
          const ceiling = section === "fouls" ? 3 : 8;
          sectionData[fieldKey] = Math.round(roll * ceiling);
        }
      }

      gameSpecificData[section] = sectionData;
    }

    return {
      matchNumber: matchIndex + 1,
      teamNumber,
      year: 2026,
      competitionType: config.competitionType,
      alliance: matchIndex % 2 === 0 ? "red" : "blue",
      gameSpecificData,
      notes:
        matchIndex % 4 === 0
          ? "Consistent cycles, no defense played this match."
          : "",
      timestamp: new Date(2026, 2, 1 + matchIndex),
    };
  });
}

function buildPreviewPitEntry(config: YearConfig): PitEntry {
  const gameSpecificData: PitEntry["gameSpecificData"] = {};
  const pitSections = [
    "autonomous",
    "teleoperated",
    "driveTeam",
    "endgame",
  ] as const;

  for (const section of pitSections) {
    const fields = config.pitScouting?.[section];
    if (!fields) continue;

    const sectionData: Record<string, number | string | boolean> = {};

    for (const [fieldKey, definition] of Object.entries(fields)) {
      const roll = seededValue(`pit.${section}.${fieldKey}`, 0);

      if (definition.type === "boolean") {
        sectionData[fieldKey] = roll > 0.35;
      } else if (definition.type === "number") {
        sectionData[fieldKey] = Math.round(roll * 20);
      } else if (definition.options && definition.options.length > 0) {
        const pick =
          definition.options[
            Math.floor(roll * definition.options.length) %
              definition.options.length
          ];
        sectionData[fieldKey] = definition.type === "multiselect" ? pick : pick;
      } else {
        sectionData[fieldKey] = "Sample response";
      }
    }

    gameSpecificData[section] = sectionData;
  }

  return {
    teamNumber: PREVIEW_TEAM_NUMBER,
    year: 2026,
    competitionType: config.competitionType,
    driveTrain: "Swerve",
    weight: 125,
    length: 32,
    width: 28,
    gameSpecificData,
    notes: "Sample pit notes — this is preview data, not a real team.",
  };
}

/**
 * A complete synthetic team, so designer previews can render the real team
 * page component instead of a separate mock of it.
 */
export function buildPreviewTeamData(config: YearConfig, teamNumber = PREVIEW_TEAM_NUMBER): TeamData {
  const matchEntries = buildPreviewMatches(config, teamNumber);

  return {
    teamNumber,
    year: 2026,
    eventCode: "PREVIEW",
    matchEntries,
    pitEntry: buildPreviewPitEntry(config),
    stats: null,
    epa: {
      auto: 12.1,
      teleop: 24.4,
      endgame: 6,
      penalties: -0.8,
      totalEPA: 41.7,
    },
    matchCount: matchEntries.length,
  };
}

/** Formats a preview metric, marking keys that resolve to nothing. */
export function formatPreviewMetric(
  stats: DetailedGameStats | null,
  key: string | undefined,
  resolved: boolean,
): string {
  if (!key || !resolved) return "—";
  if (!stats) return "—";
  return String(stats.getMetricValue(key));
}

/** One row of the analysis page's per-team data, as the analysis API returns it. */
export interface PreviewAnalysisTeam {
  team: string;
  matchesPlayed: number;
  detailMetrics: Record<string, number>;
}

/**
 * Sample teams in the analysis API's shape: numeric fields averaged per match,
 * yes/no fields as a percentage, keyed "section.field" like the API.
 */
export function buildPreviewAnalysisTeams(config: YearConfig): PreviewAnalysisTeam[] {
  return [PREVIEW_TEAM_NUMBER, ...PREVIEW_OTHER_TEAMS].map((teamNumber) => {
    const matches = buildPreviewMatches(config, teamNumber);
    const sums: Record<string, { total: number; count: number; bool: boolean }> = {};
    for (const match of matches) {
      for (const [section, fields] of Object.entries(match.gameSpecificData ?? {})) {
        for (const [field, value] of Object.entries((fields ?? {}) as Record<string, unknown>)) {
          if (typeof value !== "number" && typeof value !== "boolean") continue;
          const entry = (sums[`${section}.${field}`] ??= { total: 0, count: 0, bool: typeof value === "boolean" });
          entry.total += Number(value);
          entry.count += 1;
        }
      }
    }
    const detailMetrics = Object.fromEntries(
      Object.entries(sums).map(([key, { total, count, bool }]) => [key, bool ? (total / count) * 100 : total / count]),
    );
    return { team: String(teamNumber), matchesPlayed: matches.length, detailMetrics };
  });
}
