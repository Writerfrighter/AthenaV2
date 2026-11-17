"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import TeamImage from "@/components/team-pages-common/TeamImage";
import TeamNotes from "@/components/team-pages-common/TeamNotes";
import { FieldDrawingCanvas } from "@/components/forms/field-drawing-canvas";
import { PerformanceOverTimeChart } from "@/components/charts/performance-over-time-chart";
import { useTeamData } from "@/hooks/use-team-data";
import { useGameConfig } from "@/hooks/use-game-config";
import { useTeamInfo } from "@/hooks/use-event-teams";
import Link from "next/link";
import { flatCards } from "@/lib/utils";
import { calculateDetailedGameStats, calculateEPA, extractScoutingNotes } from "@/lib/statistics";
import type { TeamData, YearConfig } from "@/lib/types";

export interface TeamPageProps {
  teamNumber: string;
  /** Renders against supplied data instead of fetching — used by the config designer. */
  configOverride?: YearConfig;
  teamDataOverride?: TeamData;
  yearOverride?: number;
}

function formatKpiValue(
  value: number,
  format: "percent" | "number" = "number",
) {
  const formattedValue = Number.isNaN(value) ? "0.0" : value.toFixed(1);
  return `${formattedValue}${format === "percent" ? "%" : ""}`;
}

export function ConfigurableTeamPage({
  teamNumber,
  configOverride,
  teamDataOverride,
  yearOverride,
}: TeamPageProps) {
  const isPreview = !!teamDataOverride;
  const [searchNote, setSearchNote] = useState("");
  const {
    teamData: fetchedTeamData,
    loading: fetchLoading,
    error: fetchError,
  } = useTeamData(isPreview ? "" : teamNumber);
  const { currentYear: selectedYear, competitionType: selectedCompetition, getCurrentYearConfig } = useGameConfig();
  const currentYear = yearOverride ?? selectedYear;
  const competitionType = configOverride?.competitionType ?? selectedCompetition;
  const yearConfig = configOverride ?? getCurrentYearConfig();
  const teamData = teamDataOverride ?? fetchedTeamData;
  const loading = isPreview ? false : fetchLoading;
  const error = isPreview ? null : fetchError;
  const teamInfo = useTeamInfo(Number(teamNumber));
  const [averageScore, setAverageScore] = useState<number>(isPreview ? 58.3 : 0);

  // Fetch average score from TBA or FIRST Events API
  useEffect(() => {
    async function fetchAverageScore() {
      if (isPreview) return;
      if (!teamData?.year || !teamData?.eventCode) return;

      try {
        const response = await fetch(
          `/api/teams/${teamNumber}/average-score?year=${teamData.year}&eventCode=${teamData.eventCode}&competitionType=${competitionType}`,
        );

        if (response.ok) {
          const data = await response.json();
          setAverageScore(data.averageScore || 0);
        }
      } catch (err) {
        console.error("Error fetching average score:", err);
      }
    }

    fetchAverageScore();
  }, [isPreview, teamNumber, teamData?.year, teamData?.eventCode, competitionType]);

  const stats = yearConfig
    ? calculateDetailedGameStats(teamData?.matchEntries, yearConfig, teamData)
    : null;

  const teamNotes = extractScoutingNotes(teamData);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs text-muted-foreground">
          {currentYear} {yearConfig?.gameName || ""}
        </span>
        <h1 className="text-[88px] font-bold leading-[0.78] tracking-[-0.06em]">{teamNumber}</h1>
        <p className="text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs text-muted-foreground">
          {currentYear} {yearConfig?.gameName || ""}
        </span>
        <h1 className="text-[88px] font-bold leading-[0.78] tracking-[-0.06em]">{teamNumber}</h1>
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!teamData?.matchEntries || teamData.matchEntries.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs text-muted-foreground">
          {currentYear} {yearConfig?.gameName || ""}
        </span>
        <h1 className="text-[88px] font-bold leading-[0.78] tracking-[-0.06em]">{teamNumber}</h1>
        <p className="text-muted-foreground">
          No data available for Team {teamNumber} in {currentYear}.
        </p>
      </div>
    );
  }

  const pageConfig = yearConfig?.teamPageConfig;

  // Chart configuration for breakdown
  const scoringBreakdownConfig = pageConfig?.scoringBreakdownChart;
  const breakdownChartData = stats && scoringBreakdownConfig
    ? scoringBreakdownConfig.items.map((item) => ({
        name: item.name,
        value: stats.getMetricValue(item.key),
        fill: item.fill || "var(--chart-1)",
      }))
    : [];


  // Auto / Teleop KPI calculations
  const autoKpiVal =
    stats && pageConfig?.kpis?.auto?.key
      ? stats.getMetricValue(pageConfig.kpis.auto.key)
      : 0;

  const autoKpiSubVal = stats && pageConfig?.kpis?.auto?.subKey
    ? stats.getMetricValue(pageConfig.kpis.auto.subKey)
    : null;

  const teleopKpiVal =
    stats && pageConfig?.kpis?.teleop?.key
      ? stats.getMetricValue(pageConfig.kpis.teleop.key)
      : 0;

  const teleopKpiSubVal = stats && pageConfig?.kpis?.teleop?.subKey
    ? stats.getMetricValue(pageConfig.kpis.teleop.subKey)
    : null;


  // Endgame chart data if displayType === "chart"
  const endgameChartData = stats && pageConfig?.endgame
    ? pageConfig.endgame.states.map((state) => {
        const stateKey = pageConfig.endgame.stateKey;
        const rate =
          stats.rates[`${stateKey}.${state.value}`] ??
          stats.rates[`${stateKey.split(".").pop()}.${state.value}`] ??
          stats.rates[state.value] ??
          0;
        return {
          name: state.label,
          value: rate,
          fill: state.fill || "var(--chart-2)",
        };
      })
    : [];


  const breakdownRate = pageConfig?.endgame?.breakdownKey
    ? stats?.rates[pageConfig.endgame.breakdownKey]
    : undefined;
  const num = (v: number | undefined) => (v === undefined || isNaN(v) ? "0.0" : v.toFixed(1));
  const kpis = [
    { l: "Average score", v: num(averageScore), s: "points per match" },
    { l: "EPA", v: num(stats?.epa), s: "expected points added" },
    {
      l: pageConfig?.kpis?.auto?.label || "Autonomous",
      v: formatKpiValue(autoKpiVal, pageConfig?.kpis?.auto?.format),
      s: autoKpiSubVal != null
        ? `${pageConfig?.kpis?.auto?.subLabel}: ${formatKpiValue(autoKpiSubVal, pageConfig?.kpis?.auto?.subFormat)}`
        : "avg autonomous",
    },
    {
      l: pageConfig?.kpis?.teleop?.label || "Teleop",
      v: formatKpiValue(teleopKpiVal, pageConfig?.kpis?.teleop?.format),
      s: teleopKpiSubVal != null
        ? `${pageConfig?.kpis?.teleop?.subLabel}: ${formatKpiValue(teleopKpiSubVal, pageConfig?.kpis?.teleop?.subFormat)}`
        : "avg teleop",
    },
    { l: "Matches scouted", v: String(teamData.matchCount ?? teamData.matchEntries.length), s: teamData.pitEntry ? "pit entry on file" : "no pit entry" },
    breakdownRate !== undefined
      ? { l: "Breakdown rate", v: `${breakdownRate.toFixed(1)}%`, s: "of scouted matches" }
      : { l: "Penalty points", v: stats ? stats.points.penaltyPoints.toFixed(1) : "0.0", s: "estimated per match" },
  ];
  const pit = teamData.pitEntry;
  const facts = [
    `${teamData.matchCount ?? teamData.matchEntries.length} matches scouted`,
    pit?.driveTrain && `${pit.driveTrain} drivetrain`,
    pit?.weight && `${pit.weight} lbs`,
  ].filter(Boolean);

  // Pit answers flattened to label/value rows (config labels first, then any extra keys).
  const pitFacts: { label: string; value: string }[] = [];
  const show = (val: unknown) =>
    Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
  if (pit?.gameSpecificData) {
    const pitData = pit.gameSpecificData as Record<string, unknown>;
    const pitConfig = yearConfig?.pitScouting;
    const categories = pitConfig ? Object.keys(pitConfig) : ["autonomous", "teleoperated", "endgame", "driveTeam"];
    for (const catKey of categories) {
      const catFields = pitConfig?.[catKey as keyof typeof pitConfig] || {};
      const catData = (pitData[catKey] || {}) as Record<string, unknown>;
      for (const [fKey, fDef] of Object.entries(catFields)) {
        const val = pitData[`${catKey}_${fKey}`] ?? catData[fKey];
        if (val != null && val !== "") pitFacts.push({ label: fDef.label, value: show(val) });
      }
      for (const [rawKey, val] of Object.entries(pitData)) {
        const simpleKey = rawKey.startsWith(`${catKey}_`) ? rawKey.slice(catKey.length + 1) : null;
        if (simpleKey && !catFields[simpleKey] && val != null && val !== "") {
          pitFacts.push({ label: simpleKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), value: show(val) });
        }
      }
    }
  }
  if (pit?.length != null) pitFacts.push({ label: "Length", value: `${pit.length}"` });
  if (pit?.width != null) pitFacts.push({ label: "Width", value: `${pit.width}"` });

  return (
    <div className={`flex flex-col gap-9 ${flatCards}`}>
      <header className="flex flex-wrap items-stretch gap-9">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col justify-between gap-5">
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            {competitionType} · {currentYear} {yearConfig?.gameName} ·{" "}
            <Link href="/dashboard/teamlist" className="hover:text-foreground">Teams</Link> / {teamNumber}
          </span>
          <div className="flex flex-col gap-2.5">
            <span className="text-[88px] font-bold leading-[0.78] tracking-[-0.06em] sm:text-[136px]">{teamNumber}</span>
            {teamInfo?.nickname && (
              <span className="text-[26px] font-semibold tracking-tight">{teamInfo.nickname}</span>
            )}
            <span className="text-muted-foreground">{facts.join(" · ")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-10 rounded-full px-4">
              <Link href="/dashboard/picklist">Open picklist</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/dashboard/matchup">Match preview</Link>
            </Button>
            {competitionType === "FRC" && (
              <Button asChild variant="outline" className="h-10 rounded-full px-4">
                <a href={`https://www.thebluealliance.com/team/${teamNumber}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  The Blue Alliance
                </a>
              </Button>
            )}
          </div>
        </div>
        {competitionType !== "FTC" && (
          <div className="min-w-0 flex-[1.2_1_420px] [&>div]:rounded-[14px] [&>div]:border-0">
            <TeamImage
              teamNumber={teamNumber}
              yearLabel={`${currentYear} ${yearConfig?.gameName || ""}`}
              competitionType={competitionType}
            />
          </div>
        )}
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 border-y sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.l} className="flex flex-col gap-1.5 py-5 pr-4">
            <span className="text-sm text-muted-foreground">{k.l}</span>
            <span className="text-[34px] font-semibold leading-none tracking-[-0.03em]">{k.v}</span>
            <span className="font-mono text-xs text-muted-foreground">{k.s}</span>
          </div>
        ))}
      </section>

      {yearConfig && teamData.matchEntries.length > 1 ? (
        <PerformanceOverTimeChart
          matchEntries={teamData.matchEntries}
          yearConfig={yearConfig}
          year={currentYear}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Need 2+ matches for a points-per-match trend.</p>
      )}

      <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        <div className="flex flex-col gap-8">
          {(["auto", "teleop"] as const).map((phase) => {
            const perf = phase === "auto" ? pageConfig?.autoPerformance : pageConfig?.teleopPerformance;
            if (!perf?.metrics?.length) return null;
            return (
              <Section key={phase} title={phase === "auto" ? "Autonomous" : "Teleop"}>
                {perf.metrics.map((m) => {
                  const val = stats ? stats.getMetricValue(m.key) : 0;
                  return <KV key={m.key} label={m.label} value={`${val}${m.unit || (m.type === "rate" ? "%" : "")}`} />;
                })}
                {perf.showPointsEstimate && stats && (
                  <KV
                    label={`Total ${phase === "auto" ? "auto" : "teleop"} points`}
                    value={`${phase === "auto" ? stats.points.autoEstimatedPoints : stats.points.teleopEstimatedPoints} pts`}
                    strong
                  />
                )}
              </Section>
            );
          })}

          {scoringBreakdownConfig && breakdownChartData.length > 0 && (
            <Section title={scoringBreakdownConfig.title} description={scoringBreakdownConfig.description}>
              <div className="flex flex-col gap-2.5 pt-1">
                {breakdownChartData.map((item) => {
                  const max = Math.max(1, ...breakdownChartData.map((d) => d.value));
                  return (
                    <div key={item.name} className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3.5">
                      <span className="truncate text-sm text-muted-foreground">{item.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 min-w-0.5 rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: item.fill }} />
                        <span className="font-mono text-xs">{item.value.toFixed(1)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-8">
          {pageConfig?.endgame && (
            <Section
              title={pageConfig.endgame.summaryTitle || pageConfig.endgame.title}
              description={pageConfig.endgame.summaryDescription || pageConfig.endgame.description}
            >
              <StackBar
                parts={endgameChartData.map((d, i) => ({ label: d.name, value: d.value, color: d.fill.startsWith("var(") ? PALETTE[i % PALETTE.length] : d.fill }))}
                suffix={(d) => {
                  const pts = pageConfig.endgame.states.find((st) => st.label === d.label)?.points;
                  return pts != null ? ` (${pts} pts)` : "";
                }}
              />
            </Section>
          )}

          {pageConfig?.customSections?.map((section) => {
            if (section.type === "distribution" && section.fieldKey && section.items) {
              return (
                <Section key={section.id} title={section.title} description={section.description}>
                  <StackBar
                    parts={section.items.map((item, i) => ({
                      label: item.label,
                      value: stats?.rates[`${section.fieldKey}.${item.key}`] || 0,
                      color: PALETTE[i % PALETTE.length],
                    }))}
                  />
                </Section>
              );
            }
            if (section.type === "summaryCards" && section.items) {
              return (
                <Section key={section.id} title={section.title} description={section.description}>
                  {section.items.map((item) => {
                    const avg = stats ? stats.getMetricValue(item.key) : 0;
                    return (
                      <KV
                        key={item.key}
                        label={item.label}
                        value={item.pointsMultiplier ? `${avg.toFixed(1)} · ${(avg * item.pointsMultiplier).toFixed(1)} pts` : avg.toFixed(1)}
                      />
                    );
                  })}
                </Section>
              );
            }
            return null;
          })}

          {pageConfig?.penalties && (
            <Section title={pageConfig.penalties.title} description={pageConfig.penalties.description}>
              {breakdownRate !== undefined && (
                <KV
                  label="Breakdown rate"
                  value={`${breakdownRate.toFixed(1)}%`}
                  alert={breakdownRate > (pageConfig.penalties.breakdownAlertThreshold ?? 15)}
                />
              )}
              <KV label={pageConfig.penalties.minorLabel} value={(stats?.averages[pageConfig.penalties.minorKey] ?? 0).toFixed(1)} />
              <KV
                label={pageConfig.penalties.majorLabel}
                value={(stats?.averages[pageConfig.penalties.majorKey] ?? 0).toFixed(1)}
                alert={(stats?.averages[pageConfig.penalties.majorKey] ?? 0) > (pageConfig.penalties.techFoulAlertThreshold ?? 0.5)}
              />
              <KV label="Est. penalty points" value={`${stats ? stats.points.penaltyPoints.toFixed(1) : "0.0"} pts`} strong />
            </Section>
          )}
        </div>

        <Section title="From the pit">
          {pitFacts.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No pit entry yet.</p>
          ) : (
            pitFacts.map((f, i) => <KV key={`${f.label}-${i}`} label={f.label} value={f.value} />)
          )}
          {teamData.pitEntry?.notes?.trim() && (
            <p className="whitespace-pre-wrap pt-3 text-sm text-muted-foreground">{teamData.pitEntry.notes}</p>
          )}
        </Section>
      </div>

      {yearConfig && (
        <Section title="Match by match">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="border-b py-2.5 pr-2 font-medium">Match</th>
                  <th scope="col" className="border-b px-2 py-2.5 text-right font-medium">Auto</th>
                  <th scope="col" className="border-b px-2 py-2.5 text-right font-medium">Teleop</th>
                  <th scope="col" className="border-b px-2 py-2.5 text-right font-medium">Endgame</th>
                  <th scope="col" className="border-b px-2 py-2.5 text-right font-medium">Total</th>
                  <th scope="col" className="border-b py-2.5 pl-4 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {[...teamData.matchEntries]
                  .sort((x, y) => x.matchNumber - y.matchNumber)
                  .map((match, i) => {
                    const epa = calculateEPA([match], currentYear, yearConfig);
                    const cell = "border-b border-border/60 px-2 py-2.5 text-right font-mono";
                    return (
                      <tr key={`${match.matchNumber}-${i}`}>
                        <td className="border-b border-border/60 py-2.5 pr-2 font-mono font-semibold">Q{match.matchNumber}</td>
                        <td className={cell}>{epa.auto.toFixed(1)}</td>
                        <td className={cell}>{epa.teleop.toFixed(1)}</td>
                        <td className={cell}>{epa.endgame.toFixed(1)}</td>
                        <td className={`${cell} font-medium`}>{epa.totalEPA.toFixed(1)}</td>
                        <td className="max-w-[420px] truncate border-b border-border/60 py-2.5 pl-4 text-muted-foreground" title={match.notes || undefined}>
                          {match.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {teamData.pitEntry?.autoDrawing && (
        <Section title="Autonomous path" description="Drawn during pit scouting">
          <FieldDrawingCanvas initialData={teamData.pitEntry.autoDrawing} readOnly />
        </Section>
      )}

      <TeamNotes
        notes={teamNotes}
        searchNote={searchNote}
        setSearchNote={setSearchNote}
      />
    </div>
  );
}

const PALETTE = ["#00A63E", "#0D9488", "#3B7BF6", "#B7791F", "#8A8E94", "#111214"];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="pb-1 text-sm text-muted-foreground">{description}</p>}
      <div className="flex flex-col pt-1.5">{children}</div>
    </section>
  );
}

function KV({ label, value, strong, alert }: { label: string; value: string; strong?: boolean; alert?: boolean }) {
  return (
    <span className="flex justify-between gap-3 border-b border-border/60 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right tabular-nums ${strong ? "font-semibold" : ""} ${alert ? "font-medium text-destructive" : ""}`}>{value}</span>
    </span>
  );
}

type StackPart = { label: string; value: number; color: string };

function StackBar({ parts, suffix }: { parts: StackPart[]; suffix?: (p: StackPart) => string }) {
  const top = parts.reduce((a, b) => (b.value > a.value ? b : a), parts[0]);
  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <div
        role="img"
        aria-label={parts.map((p) => `${p.label} ${p.value.toFixed(1)}%`).join(", ")}
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-border"
      >
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} style={{ flex: `${p.value} 1 0`, background: p.color }} />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {parts.map((p, i) => (
          <span key={p.label}>
            {i > 0 && " · "}
            <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ background: p.color }} aria-hidden="true" />
            {p === top ? <b className="text-foreground">{p.value.toFixed(1)}%</b> : `${p.value.toFixed(1)}%`} {p.label}
            {suffix?.(p)}
          </span>
        ))}
      </span>
    </div>
  );
}

export default ConfigurableTeamPage;
