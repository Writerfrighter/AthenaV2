"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AnalysisInsightDefinition,
  DerivedMetricDefinition,
  InsightCalculation,
  YearConfig,
} from "@/lib/types";
import { buildDatapointRegistry } from "@/lib/game-config/datapoint-registry";
import { buildPreviewStats, formatPreviewMetric } from "@/lib/game-config/preview-stats";
import { DatapointMultiPicker, DatapointPicker } from "./datapoint-picker";
import { Choice, Field, Item, TextField, Toggle, heading, hint, panel } from "./fields";
import { uniqueKey } from "./types";

const BLANK_CALCULATION: { [T in InsightCalculation["type"]]: Extract<InsightCalculation, { type: T }> } = {
  booleanRate: { type: "booleanRate", key: "" },
  ratio: { type: "ratio", numeratorKeys: [], denominatorKeys: [] },
  sum: { type: "sum", keys: [] },
};

/** Derived metrics and the insight rankings shown on the analysis page. */
export function AnalysisEditor({ config, onUpdateConfig }: {
  config: YearConfig;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const previewStats = React.useMemo(() => buildPreviewStats(config), [config]);
  const derived = config.derivedMetrics ?? [];
  const insights = config.analysisInsights?.insights ?? [];

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

  const taken = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, true]));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <div className={`${panel} space-y-3`}>
        <h2 className={heading}>Derived metrics</h2>
        <p className={hint}>
          Numbers calculated from scouted fields, such as a total across levels or an
          accuracy. They can be used anywhere a field can: matchup card, team page and charts.
        </p>
        {derived.map((metric, index) => {
          const edit = (patch: Partial<DerivedMetricDefinition>) =>
            setDerived(derived.map((m, i) => (i === index ? { ...m, ...patch } : m)));
          return (
            <Item
              key={index}
              title={`${metric.label || metric.key} · sample ${formatPreviewMetric(previewStats, metric.key, true)}`}
              onRemove={() => setDerived(derived.filter((_, i) => i !== index))}
            >
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Label" value={metric.label} onChange={(label) => edit({ label })} />
                <TextField label="Key" mono value={metric.key} onChange={(key) => edit({ key: key.replace(/\s+/g, "_") })} />
              </div>
              <Choice
                label="Calculation"
                value={metric.op}
                options={[
                  ["sum", "Sum of fields, averaged per match"],
                  ["ratio", "Ratio of two sums"],
                ]}
                onChange={(op) => edit({ op, denominator: op === "ratio" ? (metric.denominator ?? []) : undefined })}
              />
              <Field label={metric.op === "ratio" ? "Top of the ratio" : "Fields to add up"}>
                <DatapointMultiPicker datapoints={numeric} values={metric.inputs} onChange={(inputs) => edit({ inputs })} />
              </Field>
              {metric.op === "ratio" && (
                <>
                  <Field label="Bottom of the ratio">
                    <DatapointMultiPicker
                      datapoints={numeric}
                      values={metric.denominator ?? []}
                      onChange={(denominator) => edit({ denominator })}
                    />
                  </Field>
                  <Toggle
                    label="Show as a percentage"
                    checked={metric.asPercent !== false}
                    onChange={(asPercent) => edit({ asPercent: asPercent ? undefined : false })}
                  />
                </>
              )}
            </Item>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setDerived([
              ...derived,
              {
                key: uniqueKey(taken(derived.map((m) => m.key)), "calculated.new_metric"),
                label: "New metric",
                op: "sum",
                inputs: [],
              },
            ])
          }
        >
          <Plus /> Add derived metric
        </Button>
      </div>

      <div className={`${panel} space-y-3`}>
        <h2 className={heading}>Insights</h2>
        <p className={hint}>Team rankings shown on the Analysis page.</p>
        {insights.map((insight, index) => {
          const edit = (patch: Partial<AnalysisInsightDefinition>) =>
            setInsights(insights.map((item, i) => (i === index ? { ...item, ...patch } : item)));
          const calculation = insight.calculation;
          return (
            <Item
              key={index}
              title={insight.title || insight.id}
              onRemove={() => setInsights(insights.filter((_, i) => i !== index))}
            >
              <TextField label="Title" value={insight.title} onChange={(title) => edit({ title })} />
              <TextField
                label="Description"
                value={insight.description}
                onChange={(description) => edit({ description: description || undefined })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Choice
                  label="Best teams have"
                  value={insight.ranking}
                  options={[
                    ["higher", "Higher values"],
                    ["lower", "Lower values"],
                  ]}
                  onChange={(ranking) => edit({ ranking })}
                />
                <Choice
                  label="Shown as"
                  value={insight.valueFormat ?? "number"}
                  options={[
                    ["number", "Number"],
                    ["percent", "Percent"],
                  ]}
                  onChange={(valueFormat) => edit({ valueFormat })}
                />
              </div>
              <Choice
                label="Calculation"
                value={calculation.type}
                options={[
                  ["booleanRate", "How often a yes/no field is yes"],
                  ["sum", "Sum of fields"],
                  ["ratio", "Ratio of two sums"],
                ]}
                onChange={(type) => edit({ calculation: BLANK_CALCULATION[type] })}
              />
              {calculation.type === "booleanRate" && (
                <Field label="Yes/no field">
                  <DatapointPicker
                    datapoints={booleans}
                    value={calculation.key}
                    onChange={(key) => edit({ calculation: { ...calculation, key } })}
                  />
                </Field>
              )}
              {calculation.type === "sum" && (
                <Field label="Fields to add up">
                  <DatapointMultiPicker
                    datapoints={numeric}
                    values={calculation.keys}
                    onChange={(keys) => edit({ calculation: { ...calculation, keys } })}
                  />
                </Field>
              )}
              {calculation.type === "ratio" && (
                <>
                  <Field label="Top of the ratio">
                    <DatapointMultiPicker
                      datapoints={numeric}
                      values={calculation.numeratorKeys}
                      onChange={(numeratorKeys) => edit({ calculation: { ...calculation, numeratorKeys } })}
                    />
                  </Field>
                  <Field label="Bottom of the ratio">
                    <DatapointMultiPicker
                      datapoints={numeric}
                      values={calculation.denominatorKeys}
                      onChange={(denominatorKeys) => edit({ calculation: { ...calculation, denominatorKeys } })}
                    />
                  </Field>
                </>
              )}
              <TextField
                label="Caption under the value"
                placeholder="Breakdowns / Matches"
                value={insight.rawLabel}
                onChange={(rawLabel) => edit({ rawLabel: rawLabel || undefined })}
              />
            </Item>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setInsights([
              ...insights,
              {
                id: uniqueKey(taken(insights.map((item) => item.id)), "insight"),
                title: "New insight",
                ranking: "higher",
                calculation: BLANK_CALCULATION.sum,
              },
            ])
          }
        >
          <Plus /> Add insight
        </Button>
      </div>
    </div>
  );
}
