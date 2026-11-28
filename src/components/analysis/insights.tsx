"use client";

import type { AnalysisInsightDefinition } from "@/lib/types";

/** Per-team data an insight is computed from, as the analysis API returns it. */
export interface InsightTeam {
  team: string;
  matchesPlayed: number;
  detailMetrics: Record<string, number>;
}

export type InsightItem = {
  team: string;
  value: number;
  raw: string;
  displayValue?: string;
  rawLabel?: string;
};

type InsightResult = {
  best: InsightItem[];
  worst: InsightItem[];
};

function buildTopBottom(
  items: InsightItem[],
  count: number,
  better: "higher" | "lower",
): InsightResult {
  const best = [...items]
    .sort((a, b) =>
      better === "higher" ? b.value - a.value : a.value - b.value,
    )
    .slice(0, count);
  const worst = [...items]
    .sort((a, b) =>
      better === "higher" ? a.value - b.value : b.value - a.value,
    )
    .slice(0, count);
  return { best, worst };
}

function formatInsightValue(item: InsightItem) {
  const raw = item.rawLabel ? `${item.rawLabel}: ${item.raw}` : item.raw;
  if (item.displayValue) return `${raw} • ${item.displayValue}`;
  return raw;
}

export function InsightSection({
  title,
  description,
  best,
  worst,
}: {
  title: string;
  description?: string;
  best: InsightItem[];
  worst: InsightItem[];
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Best</p>
          {best.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {best.map((item) => (
                <li
                  key={`best-${title}-${item.team}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    Team {item.team}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatInsightValue(item)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Worst</p>
          {worst.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {worst.map((item) => (
                <li
                  key={`worst-${title}-${item.team}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    Team {item.team}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatInsightValue(item)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Each insight's best and worst teams; shared by the Analysis page and the config studio preview. */
export function buildInsightResults(definitions: AnalysisInsightDefinition[], teams: InsightTeam[], count = 3) {
  function formatValue(value: number, format?: "percent" | "number") {
    if (format === "percent") return `${(value * 100).toFixed(1)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  function buildItems(definition: AnalysisInsightDefinition): InsightItem[] {
    return teams
      .map<InsightItem | null>((team) => {
        const matches = team.matchesPlayed;
        const rawLabel = definition.rawLabel;

        if (definition.calculation.type === "booleanRate") {
          const ratePercent =
            team.detailMetrics[definition.calculation.key];
          if (ratePercent === undefined || matches === 0) return null;
          const rate = ratePercent / 100;
          const count = Math.round(rate * matches);
          const item: InsightItem = {
            team: team.team,
            value: rate,
            raw: `${count}/${matches}`,
            displayValue: formatValue(rate, definition.valueFormat),
          };
          if (rawLabel) item.rawLabel = rawLabel;
          return item;
        }

        if (definition.calculation.type === "ratio") {
          const numeratorAvg = definition.calculation.numeratorKeys.reduce(
            (sum, key) => sum + (team.detailMetrics[key] ?? 0),
            0,
          );
          const denominatorAvg =
            definition.calculation.denominatorKeys.reduce(
              (sum, key) => sum + (team.detailMetrics[key] ?? 0),
              0,
            );
          if (denominatorAvg <= 0 || matches === 0) return null;
          const numeratorTotal = numeratorAvg * matches;
          const denominatorTotal = denominatorAvg * matches;
          const ratio = numeratorTotal / denominatorTotal;
          const item: InsightItem = {
            team: team.team,
            value: ratio,
            raw: `${Math.round(numeratorTotal)}/${Math.round(denominatorTotal)}`,
            displayValue: formatValue(ratio, definition.valueFormat),
          };
          if (rawLabel) item.rawLabel = rawLabel;
          return item;
        }

        const sumAvg = definition.calculation.keys.reduce(
          (sum, key) => sum + (team.detailMetrics[key] ?? 0),
          0,
        );
        if (matches === 0) return null;
        const total = sumAvg * matches;
        const item: InsightItem = {
          team: team.team,
          value: total,
          raw: `${Math.round(total)}`,
          displayValue: formatValue(total, definition.valueFormat),
        };
        if (rawLabel) item.rawLabel = rawLabel;
        return item;
      })
      .filter((item): item is InsightItem => item !== null);
  }

  return definitions.map((definition) => {
    const items = buildItems(definition);
    return { definition, items, result: buildTopBottom(items, count, definition.ranking) };
  });
}
