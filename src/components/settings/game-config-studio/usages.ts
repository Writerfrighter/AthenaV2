import type { YearConfig } from "@/lib/types";
import type { FieldMode } from "./types";

export type UsageMode = "matchup" | "teampage" | "analysis";

/** True if a value anywhere in `value` is the key, or a state of it ("endgame.climb.deep"). */
function mentions(value: unknown, ref: string): boolean {
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`"${escaped}(\\.[^"]*)?"`).test(JSON.stringify(value ?? null));
}

/** Where else in the config a form field is shown, so editors can jump there. */
export function findUsages(config: YearConfig, mode: FieldMode, section: string, key: string) {
  const found: { mode: UsageMode; label: string }[] = [];
  const ref = `${section}.${key}`;
  const add = (where: UsageMode, label: string, value: unknown) => {
    if (value !== undefined && mentions(value, ref)) found.push({ mode: where, label });
  };
  const matchup = config.matchupCardConfig;

  if (mode === "pit") {
    if (matchup?.pitHighlights?.some((h) => h.section === section && h.field === key)) {
      found.push({ mode: "matchup", label: "Matchup card · Pit highlights" });
    }
    return found;
  }

  add("matchup", "Matchup card · Autonomous", matchup?.autoMetrics);
  add("matchup", "Matchup card · Teleop", matchup?.teleopMetrics);
  add("matchup", "Matchup card · Endgame", matchup && [matchup.endgame, matchup.playstyleKey]);
  const page = config.teamPageConfig;
  add("teampage", "Team page · Key numbers", page?.kpis);
  add("teampage", "Team page · Autonomous", page?.autoPerformance);
  add("teampage", "Team page · Teleop", page?.teleopPerformance);
  add("teampage", "Team page · Scoring breakdown", page?.scoringBreakdownChart);
  add("teampage", "Team page · Endgame", page?.endgame);
  add("teampage", "Team page · Penalties", page?.penalties);
  add("teampage", "Team page · Custom sections", page?.customSections);
  for (const insight of config.analysisInsights?.insights ?? []) {
    add("analysis", `Analysis · ${insight.title}`, insight.calculation);
  }
  for (const metric of config.derivedMetrics ?? []) {
    add("analysis", `Analysis · ${metric.label}`, [metric.inputs, metric.denominator]);
  }
  return found;
}
