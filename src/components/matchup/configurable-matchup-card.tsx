"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shell,
  Waves,
  Flame,
  Package,
  Puzzle,
  ArrowUp,
  AlertTriangle,
  Activity,
  Target,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTeamData } from "@/hooks/use-team-data";
import { useGameConfig } from "@/hooks/use-game-config";
import { calculateDetailedGameStats } from "@/lib/statistics";
import Link from "next/link";
import type { MatchupCardProps } from "./matchup-alliance-panel";
import type { MetricDisplayConfig, TeamData, YearConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MatchupMetricList = "autoMetrics" | "teleopMetrics";

/** Lets the config studio select and add metrics on the real card. */
export interface MatchupCardEditor {
  selected: { list: MatchupMetricList; index: number } | null;
  onSelect: (list: MatchupMetricList, index: number) => void;
  onAdd: (list: MatchupMetricList) => void;
}

// Icon mapping helper
function renderDynamicIcon(iconName?: string) {
  const className = "h-3 w-3";
  switch (iconName?.toLowerCase()) {
    case "shell":
      return <Shell className={className} />;
    case "waves":
      return <Waves className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "package":
      return <Package className={className} />;
    case "puzzle":
      return <Puzzle className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "target":
      return <Target className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

/** The metrics a card shows when the config doesn't list its own. */
export function defaultMatchupMetrics(
  yearConfig: YearConfig | null | undefined,
  list: MatchupMetricList,
): MetricDisplayConfig[] {
  const auto = list === "autoMetrics";
  return Object.entries((auto ? yearConfig?.scoring.autonomous : yearConfig?.scoring.teleop) || {}).map(([k, v]) => ({
    key: `${auto ? "autonomous" : "teleop"}.${k}`,
    label: v.label.replace(auto ? /\s*\(Auto\)/i : /\s*\(Teleop\)/i, ""),
    type: (v.type === "boolean" ? "badge" : "number") as "badge" | "number",
    threshold: v.type === "boolean" ? (auto ? 80 : 50) : undefined,
    unit: v.type === "boolean" ? "%" : undefined,
  }));
}

export function ConfigurableMatchupCard({ teamNumber, configOverride, teamDataOverride, editor }: Pick<MatchupCardProps, "teamNumber"> & Partial<MatchupCardProps> & {
  /** Studio preview: render this config and data instead of fetching. */
  configOverride?: YearConfig;
  teamDataOverride?: TeamData;
  editor?: MatchupCardEditor;
}) {
  const fetched = useTeamData(teamDataOverride ? "" : teamNumber);
  const { teamData, loading, error } = teamDataOverride
    ? { teamData: teamDataOverride, loading: false, error: null }
    : fetched;
  const { getCurrentYearConfig } = useGameConfig();
  const yearConfig = configOverride ?? getCurrentYearConfig();


  const stats = yearConfig
    ? calculateDetailedGameStats(teamData?.matchEntries, yearConfig, teamData)
    : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <Link
              href={`/dashboard/team/${teamNumber}`}
              className="hover:underline font-bold"
            >
              Team {teamNumber}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No scouting data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const matchupConfig = yearConfig?.matchupCardConfig;

  const autoMetrics = matchupConfig?.autoMetrics ?? defaultMatchupMetrics(yearConfig, "autoMetrics");
  const teleopMetrics = matchupConfig?.teleopMetrics ?? defaultMatchupMetrics(yearConfig, "teleopMetrics");

  const endgameStateKey = matchupConfig?.endgame?.stateKey;
  const endgameFieldName = endgameStateKey?.split(".").pop();

  const endgameStates =
    matchupConfig?.endgame?.states ??
    Object.keys(
      (endgameFieldName &&
        yearConfig?.scoring.endgame?.[endgameFieldName]?.pointValues) ||
        {},
    ).map((k) => ({
      key: k,
      label: k.charAt(0).toUpperCase() + k.slice(1),
      threshold: undefined as number | undefined,
    }));

  // Warnings check
  const breakdownRate = stats?.rates["endgame.robot_broke_down"] ?? 0;
  const avgTechFouls = stats?.averages["fouls.tech_fouls"] ?? 0;
  const avgFouls = stats?.averages["fouls.fouls"] ?? 0;
  const avgMajorPenalties = stats?.averages["fouls.major_penalties"] ?? 0;
  const avgMinorPenalties = stats?.averages["fouls.minor_penalties"] ?? 0;

  const showBreakdownWarning =
    breakdownRate > (matchupConfig?.warnings?.breakdownThreshold ?? 15);
  const showTechFoulWarning =
    avgTechFouls > (matchupConfig?.warnings?.techFoulThreshold ?? 0.5);
  const showFoulWarning =
    avgFouls > (matchupConfig?.warnings?.foulThreshold ?? 1.0);
  const showMajorPenaltyWarning =
    avgMajorPenalties > (matchupConfig?.warnings?.majorPenaltyThreshold ?? 0.3);
  const showMinorPenaltyWarning =
    avgMinorPenalties > (matchupConfig?.warnings?.minorPenaltyThreshold ?? 1.0);

  const hasWarnings =
    showBreakdownWarning ||
    showTechFoulWarning ||
    showFoulWarning ||
    showMajorPenaltyWarning ||
    showMinorPenaltyWarning;

  // Playstyle
  const playstyleKey = matchupConfig?.playstyleKey ?? "endgame.robot_playstyle";
  const offensiveRate = stats?.rates[`${playstyleKey}.offensive`] ?? 0;
  const balancedRate = stats?.rates[`${playstyleKey}.balanced`] ?? 0;
  const defensiveRate = stats?.rates[`${playstyleKey}.defensive`] ?? 0;
  const hasPlaystyle = offensiveRate > 0 || balancedRate > 0 || defensiveRate > 0;

  const metricGrid = (list: MatchupMetricList, metrics: MetricDisplayConfig[]) => (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {metrics.map((metric, index) => {
        const val = stats?.getMetricValue(metric.key) ?? 0;
        if (metric.hideIfZero && val === 0 && !editor) return null;
        const value =
          metric.type === "badge" ? (
            <Badge variant={val > (metric.threshold ?? 50) ? "default" : "secondary"} className="text-xs h-5">
              {val}
              {metric.unit || ""}
            </Badge>
          ) : (
            <span className="font-medium">{val}</span>
          );
        if (!editor) {
          return (
            <div key={`${metric.key}-${index}`} className="flex justify-between items-center">
              <span className="text-muted-foreground">{metric.label}</span>
              {value}
            </div>
          );
        }
        const on = editor.selected?.list === list && editor.selected.index === index;
        return (
          <button
            key={`${metric.key}-${index}`}
            type="button"
            aria-pressed={on}
            onClick={() => editor.onSelect(list, index)}
            className={cn(
              "-mx-1.5 flex items-center justify-between rounded-md border-[1.5px] px-1.5 py-0.5 text-left",
              on ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40" : "border-transparent hover:border-border",
            )}
          >
            <span className="text-muted-foreground">{metric.label}</span>
            {value}
          </button>
        );
      })}
      {editor && (
        <button
          type="button"
          onClick={() => editor.onAdd(list)}
          className="-mx-1.5 rounded-md border-[1.5px] border-dashed px-1.5 py-0.5 text-left text-blue-700 hover:bg-accent dark:text-blue-400"
        >
          + Add metric
        </button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Link
              href={`/dashboard/team/${teamNumber}`}
              className="hover:underline font-bold text-lg"
            >
              Team {teamNumber}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2">
            {teamData.pitEntry?.driveTrain && (
              <Badge variant="outline" className="text-xs">
                {teamData.pitEntry.driveTrain}
              </Badge>
            )}
            {teamData.pitEntry?.weight && (
              <Badge variant="outline" className="text-xs">
                {teamData.pitEntry.weight} lbs
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {teamData.matchCount} matches
          </Badge>
          {stats && (
            <Badge variant="secondary" className="text-xs">
              EPA: {stats.epa.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {stats ? (
          <>
            {/* Autonomous Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                {renderDynamicIcon(matchupConfig?.autoIcon)} Autonomous
              </h4>
              {metricGrid("autoMetrics", autoMetrics)}
            </div>

            <Separator className="my-1" />

            {/* Teleop Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                {renderDynamicIcon(matchupConfig?.teleopIcon)} Teleop
              </h4>
              {metricGrid("teleopMetrics", teleopMetrics)}
            </div>

            <Separator className="my-1" />

            {/* Endgame Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> Endgame
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {matchupConfig?.endgame?.bestClimbKey && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Climb</span>
                    <Badge
                      variant={
                        // States are declared best-first
                        endgameStates.findIndex(
                          (s) => s.key === stats.bestClimb,
                        ) === 0
                          ? "default"
                          : endgameStates.some((s) => s.key === stats.bestClimb)
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs h-5"
                    >
                      {stats.bestClimb}
                    </Badge>
                  </div>
                )}

                {endgameStates.map((state) => {
                  const rateVal =
                    stats.rates[`${endgameStateKey}.${state.key}`] ??
                    stats.rates[`${endgameFieldName}.${state.key}`] ??
                    stats.rates[state.key] ??
                    0;

                  return (
                    <div key={state.key} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{state.label}</span>
                      {state.threshold != null ? (
                        <Badge
                          variant={
                            rateVal > state.threshold ? "default" : "secondary"
                          }
                          className="text-xs h-5"
                        >
                          {rateVal}%
                        </Badge>
                      ) : (
                        <span className="font-medium">{rateVal}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reliability / Penalties Warning */}
            {hasWarnings && (
              <>
                <Separator className="my-1" />
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {showBreakdownWarning && (
                      <Badge variant="destructive" className="text-xs">
                        {breakdownRate}% breakdown
                      </Badge>
                    )}
                    {showTechFoulWarning && (
                      <Badge variant="destructive" className="text-xs">
                        {avgTechFouls} tech fouls/match
                      </Badge>
                    )}
                    {showFoulWarning && (
                      <Badge variant="outline" className="text-xs">
                        {avgFouls} fouls/match
                      </Badge>
                    )}
                    {showMajorPenaltyWarning && (
                      <Badge variant="destructive" className="text-xs">
                        {avgMajorPenalties} major/match
                      </Badge>
                    )}
                    {showMinorPenaltyWarning && (
                      <Badge variant="outline" className="text-xs">
                        {avgMinorPenalties} minor/match
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Playstyle */}
            {hasPlaystyle && (
              <>
                <Separator className="my-1" />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Playstyle
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {offensiveRate > 0 && (
                      <Badge variant="default" className="text-xs">
                        Offensive {offensiveRate}%
                      </Badge>
                    )}
                    {balancedRate > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Balanced {balancedRate}%
                      </Badge>
                    )}
                    {defensiveRate > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Defensive {defensiveRate}%
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Pit Scouting Capabilities */}
            {teamData?.pitEntry?.gameSpecificData &&
              (() => {
                const pitData = teamData.pitEntry.gameSpecificData as Record<
                  string,
                  Record<string, unknown> | unknown
                >;
                const highlights = matchupConfig?.pitHighlights;

                const badges: { label: string; value: string }[] = [];

                if (highlights && highlights.length > 0) {
                  for (const hl of highlights) {
                    const sec = pitData[hl.section] as Record<string, unknown> | undefined;
                    const flatVal = (pitData as Record<string, unknown>)[`${hl.section}_${hl.field}`] ?? sec?.[hl.field];
                    if (flatVal != null && flatVal !== "" && flatVal !== false) {
                      const displayStr = Array.isArray(flatVal)
                        ? flatVal.join(", ")
                        : typeof flatVal === "boolean"
                          ? flatVal ? "Yes" : "No"
                          : String(flatVal);
                      badges.push({
                        label: hl.label,
                        value: `${displayStr}${hl.unit ? hl.unit : ""}`,
                      });
                    }
                  }
                } else {
                  // Fallback: look for common pit fields
                  const endgamePit = (pitData.endgame || {}) as Record<string, unknown>;
                  const teleopPit = (pitData.teleoperated || {}) as Record<string, unknown>;

                  if (endgamePit.climbCapability) {
                    badges.push({ label: "Climb", value: String(endgamePit.climbCapability) });
                  }
                  if (endgamePit.baseCapability) {
                    badges.push({ label: "Base", value: String(endgamePit.baseCapability) });
                  }
                  if (teleopPit.intakeType) {
                    badges.push({
                      label: "Intake",
                      value: Array.isArray(teleopPit.intakeType)
                        ? teleopPit.intakeType.join(", ")
                        : String(teleopPit.intakeType),
                    });
                  }
                  if (teleopPit.artifactIntake) {
                    badges.push({ label: "Intake", value: String(teleopPit.artifactIntake) });
                  }
                  if (teleopPit.cycleTime != null) {
                    badges.push({ label: "Cycle", value: `${teleopPit.cycleTime}s` });
                  }
                  if (teleopPit.reliability) {
                    badges.push({ label: "Reliability", value: String(teleopPit.reliability) });
                  }
                  if (teleopPit.shootingReliability) {
                    badges.push({ label: "Shooting", value: String(teleopPit.shootingReliability) });
                  }
                }

                if (badges.length === 0) return null;

                return (
                  <>
                    <Separator className="my-1" />
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Pit Report
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {badges.map((b, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {b.label}: {b.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No match data to analyze
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ConfigurableMatchupCard;
