"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AnalysisInsightDefinition,
  DerivedMetricDefinition,
  InsightCalculation,
  YearConfig,
} from "@/lib/types";
import { buildDatapointRegistry, type Datapoint } from "@/lib/game-config/datapoint-registry";
import {
  PREVIEW_OTHER_TEAMS,
  PREVIEW_TEAM_NUMBER,
  buildPreviewAnalysisTeams,
  buildPreviewStats,
} from "@/lib/game-config/preview-stats";
import { InsightSection, buildInsightResults, type InsightItem } from "@/components/analysis/insights";
import { cn } from "@/lib/utils";
import { DatapointMultiPicker, DatapointPicker } from "./datapoint-picker";
import { Field, Segmented, TextField, Toggle, heading, hint, panel } from "./fields";
import { uniqueKey } from "./types";

const BLANK_CALCULATION: { [T in InsightCalculation["type"]]: Extract<InsightCalculation, { type: T }> } = {
  booleanRate: { type: "booleanRate", key: "" },
  ratio: { type: "ratio", numeratorKeys: [], denominatorKeys: [] },
  sum: { type: "sum", keys: [] },
};

const CALCULATION_CHIP: Record<InsightCalculation["type"], string> = { booleanRate: "Rate", ratio: "Ratio", sum: "Total" };

type Selection = { kind: "insight" | "derived"; index: number } | null;

const taken = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, true]));

/** Fields added together, or one over the other, drawn as a fraction. */
function Formula({ top, bottom, datapoints, onTop, onBottom }: {
  top: string[];
  bottom?: string[];
  datapoints: Datapoint[];
  onTop: (keys: string[]) => void;
  onBottom?: (keys: string[]) => void;
}) {
  return (
    <div className="space-y-2.5 rounded-xl border p-3">
      <DatapointMultiPicker datapoints={datapoints} values={top} onChange={onTop} placeholder="+ field" />
      {bottom && onBottom && (
        <>
          <div aria-hidden="true" className="h-0.5 rounded bg-foreground" />
          <span className="sr-only">divided by</span>
          <DatapointMultiPicker datapoints={datapoints} values={bottom} onChange={onBottom} placeholder="+ field" />
        </>
      )}
    </div>
  );
}

/** Derived metrics and the insight rankings shown on the analysis page. */
export function AnalysisEditor({ config, onUpdateConfig }: {
  config: YearConfig;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const derived = config.derivedMetrics ?? [];
  const insights = React.useMemo(() => config.analysisInsights?.insights ?? [], [config.analysisInsights]);
  const [selection, setSelection] = useState<Selection>(() => (insights.length ? { kind: "insight", index: 0 } : null));

  const teams = React.useMemo(() => buildPreviewAnalysisTeams(config), [config]);
  const results = React.useMemo(() => buildInsightResults(insights, teams), [insights, teams]);
  const teamStats = React.useMemo(
    () => [PREVIEW_TEAM_NUMBER, ...PREVIEW_OTHER_TEAMS].map((team) => ({ team, stats: buildPreviewStats(config, team) })),
    [config],
  );

  // Both features aggregate raw scouted match fields, never each other.
  const derivedKeys = new Set(derived.map((metric) => metric.key));
  const scouted = buildDatapointRegistry(config).filter(
    (d) => !d.pitSection && d.key !== "epa" && !derivedKeys.has(d.key),
  );
  const numeric = scouted.filter((d) => d.valueType === "number");
  const booleans = scouted.filter((d) => d.valueType === "boolean");

  const setDerived = (next: DerivedMetricDefinition[]) =>
    onUpdateConfig((prev) => ({ ...prev, derivedMetrics: next.length ? next : undefined }));
  const setInsights = (next: AnalysisInsightDefinition[]) =>
    onUpdateConfig((prev) => ({ ...prev, analysisInsights: { insights: next } }));

  const insight = selection?.kind === "insight" ? insights[selection.index] : undefined;
  const metric = selection?.kind === "derived" ? derived[selection.index] : undefined;
  const editInsight = (patch: Partial<AnalysisInsightDefinition>) =>
    selection && setInsights(insights.map((item, i) => (i === selection.index ? { ...item, ...patch } : item)));
  const editDerived = (patch: Partial<DerivedMetricDefinition>) =>
    selection && setDerived(derived.map((m, i) => (i === selection.index ? { ...m, ...patch } : m)));

  const insightResult = insight && selection ? results[selection.index] : undefined;
  const sample: InsightItem | undefined = insightResult?.items.find((item) => item.team === String(PREVIEW_TEAM_NUMBER));

  const row = (on: boolean) =>
    cn(
      "flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm",
      on ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "hover:bg-accent",
    );
  const chip = "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground";

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
      {/* Everything the analysis page computes, in two plain groups */}
      <nav aria-label="Analysis items" className={`${panel} flex flex-col gap-0.5 p-3`}>
        <div className="px-2.5 pb-1.5">
          <h2 className={heading}>Rankings</h2>
          <p className={hint}>Shown on the Analysis page</p>
        </div>
        {insights.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selection?.kind === "insight" && selection.index === index}
            onClick={() => setSelection({ kind: "insight", index })}
            className={row(selection?.kind === "insight" && selection.index === index)}
          >
            <span className="min-w-0 flex-1 truncate">{item.title || item.id}</span>
            <span className={chip}>{CALCULATION_CHIP[item.calculation.type]}</span>
          </button>
        ))}
        <button
          type="button"
          className={`${row(false)} text-[13px] text-blue-700 dark:text-blue-400`}
          onClick={() => {
            setInsights([
              ...insights,
              {
                id: uniqueKey(taken(insights.map((item) => item.id)), "insight"),
                title: "New ranking",
                ranking: "higher",
                calculation: BLANK_CALCULATION.sum,
              },
            ]);
            setSelection({ kind: "insight", index: insights.length });
          }}
        >
          <Plus className="size-4" aria-hidden="true" /> Add ranking
        </button>

        <div className="mt-1.5 border-t px-2.5 pb-1.5 pt-3">
          <h2 className={heading}>Calculated numbers</h2>
          <p className={hint}>Usable on cards, team pages and charts</p>
        </div>
        {derived.map((item, index) => (
          <button
            key={`${item.key}-${index}`}
            type="button"
            aria-pressed={selection?.kind === "derived" && selection.index === index}
            onClick={() => setSelection({ kind: "derived", index })}
            className={row(selection?.kind === "derived" && selection.index === index)}
          >
            <span className="min-w-0 flex-1 truncate">{item.label || item.key}</span>
            <span className={chip}>{item.op === "ratio" ? (item.asPercent !== false ? "%" : "Ratio") : "Sum"}</span>
          </button>
        ))}
        <button
          type="button"
          className={`${row(false)} text-[13px] text-blue-700 dark:text-blue-400`}
          onClick={() => {
            setDerived([
              ...derived,
              {
                key: uniqueKey(taken(derived.map((m) => m.key)), "calculated.new_metric"),
                label: "New number",
                op: "sum",
                inputs: [],
              },
            ]);
            setSelection({ kind: "derived", index: derived.length });
          }}
        >
          <Plus className="size-4" aria-hidden="true" /> Add calculated number
        </button>
      </nav>

      {/* Live preview against sample teams */}
      <section className="flex min-w-0 flex-col gap-2">
        <p className={hint}>Live preview with sample teams. Updates as you edit.</p>
        {insight && insightResult ? (
          <div className="max-w-md">
            <InsightSection
              title={insight.title}
              description={insight.description}
              best={insightResult.result.best}
              worst={insightResult.result.worst}
            />
          </div>
        ) : metric ? (
          <div className={`${panel} max-w-md`}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</h3>
            <p className={`${hint} mb-3`}>Average per match for each sample team</p>
            <ul className="space-y-2">
              {teamStats.map(({ team, stats }) => (
                <li key={team} className="flex items-center justify-between text-sm">
                  <span className="font-medium">Team {team}</span>
                  <span className="font-mono text-muted-foreground">
                    {stats ? stats.getMetricValue(metric.key) : "—"}
                    {metric.op === "ratio" && metric.asPercent !== false ? "%" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={`${panel} ${hint}`}>Pick a ranking or calculated number to edit it, or add one.</p>
        )}
      </section>

      {/* The selected item, read as a formula */}
      <aside className={`${panel} space-y-4`}>
        {insight ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate text-[15px] font-semibold">{insight.title || "Ranking"}</h2>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Delete ranking"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setInsights(insights.filter((_, i) => i !== selection!.index));
                  setSelection(null);
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <TextField label="Title" value={insight.title} onChange={(title) => editInsight({ title })} />
            <TextField
              label="Description"
              value={insight.description}
              onChange={(description) => editInsight({ description: description || undefined })}
            />
            <Field label="How it is worked out">
              <Segmented
                label="Calculation"
                value={insight.calculation.type}
                options={[
                  ["booleanRate", "How often"],
                  ["ratio", "A ÷ B"],
                  ["sum", "Total"],
                ]}
                onChange={(type) => {
                  if (type !== insight.calculation.type) editInsight({ calculation: BLANK_CALCULATION[type] });
                }}
              />
            </Field>
            {insight.calculation.type === "booleanRate" && (
              <Field label="Yes / No field">
                <DatapointPicker
                  datapoints={booleans}
                  value={insight.calculation.key}
                  onChange={(key) => editInsight({ calculation: { type: "booleanRate", key } })}
                />
              </Field>
            )}
            {insight.calculation.type === "ratio" && (() => {
              const calculation = insight.calculation;
              return (
                <Formula
                  datapoints={numeric}
                  top={calculation.numeratorKeys}
                  bottom={calculation.denominatorKeys}
                  onTop={(numeratorKeys) => editInsight({ calculation: { ...calculation, numeratorKeys } })}
                  onBottom={(denominatorKeys) => editInsight({ calculation: { ...calculation, denominatorKeys } })}
                />
              );
            })()}
            {insight.calculation.type === "sum" && (() => {
              const calculation = insight.calculation;
              return (
                <Formula
                  datapoints={numeric}
                  top={calculation.keys}
                  onTop={(keys) => editInsight({ calculation: { ...calculation, keys } })}
                />
              );
            })()}
            <p className={hint}>
              {sample
                ? <>Team {PREVIEW_TEAM_NUMBER} sample: {sample.raw}{sample.displayValue && <> = <strong className="text-foreground">{sample.displayValue}</strong></>}</>
                : "No sample value yet: pick the fields above."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Better is">
                <Segmented
                  label="Better is"
                  value={insight.ranking}
                  options={[
                    ["lower", "Lower"],
                    ["higher", "Higher"],
                  ]}
                  onChange={(ranking) => editInsight({ ranking })}
                />
              </Field>
              <Field label="Show as">
                <Segmented
                  label="Show as"
                  value={insight.valueFormat ?? "number"}
                  options={[
                    ["percent", "%"],
                    ["number", "Number"],
                  ]}
                  onChange={(valueFormat) => editInsight({ valueFormat })}
                />
              </Field>
            </div>
            <TextField
              label="Caption under the value"
              placeholder="Breakdowns / Matches"
              value={insight.rawLabel}
              onChange={(rawLabel) => editInsight({ rawLabel: rawLabel || undefined })}
            />
          </>
        ) : metric ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate text-[15px] font-semibold">{metric.label || "Calculated number"}</h2>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Delete calculated number"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setDerived(derived.filter((_, i) => i !== selection!.index));
                  setSelection(null);
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Label" value={metric.label} onChange={(label) => editDerived({ label })} />
              <TextField label="Key" mono value={metric.key} onChange={(key) => editDerived({ key: key.replace(/\s+/g, "_") })} />
            </div>
            <Field label="How it is worked out">
              <Segmented
                label="Calculation"
                value={metric.op}
                options={[
                  ["sum", "Total per match"],
                  ["ratio", "A ÷ B"],
                ]}
                onChange={(op) => editDerived({ op, denominator: op === "ratio" ? (metric.denominator ?? []) : undefined })}
              />
            </Field>
            <Formula
              datapoints={numeric}
              top={metric.inputs}
              bottom={metric.op === "ratio" ? (metric.denominator ?? []) : undefined}
              onTop={(inputs) => editDerived({ inputs })}
              onBottom={(denominator) => editDerived({ denominator })}
            />
            {metric.op === "ratio" && (
              <Toggle
                label="Show as a percentage"
                checked={metric.asPercent !== false}
                onChange={(asPercent) => editDerived({ asPercent: asPercent ? undefined : false })}
              />
            )}
          </>
        ) : (
          <p className={hint}>Nothing selected.</p>
        )}
      </aside>
    </div>
  );
}
