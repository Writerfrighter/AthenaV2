"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YearConfig, MetricDisplayConfig, MatchupCardConfig } from "@/lib/types";
import { buildDatapointRegistry, findDatapoint } from "@/lib/game-config/datapoint-registry";
import { buildPreviewStats, formatPreviewMetric } from "@/lib/game-config/preview-stats";
import { cn } from "@/lib/utils";
import { DatapointPicker } from "./datapoint-picker";
import { Choice, Field, Item, NumberField, TextField, Toggle, heading, hint, panel } from "./fields";

type MetricList = "autoMetrics" | "teleopMetrics";

const ICONS = ["Flame", "Zap", "Target", "Activity", "Package", "Puzzle", "Sparkles"] as const;

const WARNINGS = [
  ["breakdownThreshold", "Breakdown rate (%)", 15],
  ["foulThreshold", "Fouls per match", 1],
  ["techFoulThreshold", "Tech fouls per match", 0.5],
  ["majorPenaltyThreshold", "Major penalties per match", 0.3],
  ["minorPenaltyThreshold", "Minor penalties per match", 1],
] as const;

const EMPTY: MatchupCardConfig = { autoMetrics: [], teleopMetrics: [], endgame: { states: [] } };

export function VisualMatchupCanvas({ config, onUpdateConfig }: {
  config: YearConfig;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const [selected, setSelected] = useState<{ list: MetricList; index: number } | null>(null);
  const datapoints = React.useMemo(() => buildDatapointRegistry(config), [config]);
  const previewStats = React.useMemo(() => buildPreviewStats(config), [config]);

  const matchFields = datapoints.filter((d) => !d.pitSection);
  const enumFields = matchFields.filter((d) => d.valueType === "enum");
  const pitFields = datapoints.filter((d) => d.pitSection);

  const matchup = config.matchupCardConfig ?? EMPTY;
  const update = (patch: Partial<MatchupCardConfig>) =>
    onUpdateConfig((prev) => ({
      ...prev,
      matchupCardConfig: { ...(prev.matchupCardConfig ?? EMPTY), ...patch },
    }));

  const endgame = matchup.endgame ?? EMPTY.endgame;
  const updateEndgame = (patch: Partial<MatchupCardConfig["endgame"]>) =>
    update({ endgame: { ...endgame, ...patch } });
  const stateOptions = findDatapoint(enumFields, endgame.stateKey)?.states ?? [];

  const highlights = matchup.pitHighlights ?? [];
  const setHighlights = (pitHighlights: NonNullable<MatchupCardConfig["pitHighlights"]>) =>
    update({ pitHighlights: pitHighlights.length ? pitHighlights : undefined });

  const metric = selected ? matchup[selected.list]?.[selected.index] : undefined;
  const updateMetric = (patch: Partial<MetricDisplayConfig>) => {
    if (!selected) return;
    update({
      [selected.list]: matchup[selected.list].map((m, i) =>
        i === selected.index ? { ...m, ...patch } : m,
      ),
    });
  };

  const stateRate = (state: string) => {
    const field = endgame.stateKey;
    const rate =
      previewStats?.rates[`${field}.${state}`] ??
      previewStats?.rates[`${field?.split(".").pop()}.${state}`];
    return rate === undefined ? "—" : `${rate}%`;
  };

  const metricSection = (list: MetricList, title: string, iconKey: "autoIcon" | "teleopIcon") => (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            const first = matchFields.find((d) => d.valueType === "number");
            update({
              [list]: [...(matchup[list] || []), { key: first?.key ?? "", label: first?.label ?? "New metric" }],
            });
            setSelected({ list, index: (matchup[list] || []).length });
          }}
        >
          <Plus /> Add metric
        </Button>
      </div>
      {(matchup[list] || []).length === 0 && <p className={hint}>No metrics yet.</p>}
      <div className="grid grid-cols-2 gap-2">
        {(matchup[list] || []).map((m, index) => {
          const resolved = !!findDatapoint(datapoints, m.key);
          return (
            <button
              key={index}
              type="button"
              aria-pressed={selected?.list === list && selected.index === index}
              onClick={() => setSelected({ list, index })}
              className={cn(
                "flex items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected?.list === list && selected.index === index
                  ? "border-foreground"
                  : "hover:border-foreground/40",
              )}
            >
              <span className="truncate text-muted-foreground">{m.label}</span>
              <span className={cn("font-medium tabular-nums", !resolved && "text-amber-600")}>
                {formatPreviewMetric(previewStats, m.key, resolved)}
                {m.unit}
              </span>
            </button>
          );
        })}
      </div>
      <div className="w-40">
        <Choice
          label="Section icon"
          value={matchup[iconKey] ?? "Flame"}
          options={ICONS}
          onChange={(icon) => update({ [iconKey]: icon })}
        />
      </div>
    </section>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* Card-wide settings */}
      <div className="space-y-4">
        <div className={`${panel} space-y-3`}>
          <h2 className={heading}>Endgame</h2>
          <Field label="Robot state field">
            <DatapointPicker
              datapoints={enumFields}
              value={endgame.stateKey}
              onChange={(stateKey) =>
                updateEndgame({
                  stateKey,
                  states: (findDatapoint(enumFields, stateKey)?.states ?? []).map((state) => ({
                    key: state,
                    label: state,
                  })),
                })
              }
            />
          </Field>
          <Toggle
            label="Show most common result"
            checked={!!endgame.bestClimbKey}
            onChange={(on) => updateEndgame({ bestClimbKey: on ? endgame.stateKey : undefined })}
          />
          <p className={hint}>List the states best first. Each shows how often a team ends there.</p>
          {endgame.states.map((state, index) => {
            const edit = (patch: Partial<typeof state>) =>
              updateEndgame({ states: endgame.states.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
            return (
              <Item
                key={index}
                title={state.label || state.key || "State"}
                onRemove={() => updateEndgame({ states: endgame.states.filter((_, i) => i !== index) })}
              >
                {stateOptions.length > 0 ? (
                  <Choice label="State" value={state.key} options={stateOptions} onChange={(key) => edit({ key })} />
                ) : (
                  <TextField label="State" mono value={state.key} onChange={(key) => edit({ key })} />
                )}
                <TextField label="Label" value={state.label} onChange={(label) => edit({ label })} />
                <NumberField
                  label="Highlight above (%)"
                  value={state.threshold}
                  onChange={(threshold) => edit({ threshold })}
                />
              </Item>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateEndgame({
                states: [...endgame.states, { key: stateOptions[0] ?? "", label: stateOptions[0] ?? "New state" }],
              })
            }
          >
            <Plus /> Add state
          </Button>
        </div>

        <div className={`${panel} space-y-3`}>
          <h2 className={heading}>Playstyle</h2>
          <p className={hint}>A choice field with offensive, balanced and defensive options.</p>
          <DatapointPicker
            datapoints={enumFields}
            value={matchup.playstyleKey}
            placeholder="Default (endgame.robot_playstyle)"
            onChange={(playstyleKey) => update({ playstyleKey: playstyleKey || undefined })}
          />
          {matchup.playstyleKey && (
            <Button variant="ghost" size="sm" onClick={() => update({ playstyleKey: undefined })}>
              Use default
            </Button>
          )}
        </div>

        <div className={`${panel} space-y-3`}>
          <h2 className={heading}>Warnings</h2>
          <p className={hint}>A team is flagged when its average goes above these.</p>
          {WARNINGS.map(([key, label, fallback]) => (
            <NumberField
              key={key}
              label={label}
              placeholder={String(fallback)}
              value={matchup.warnings?.[key]}
              onChange={(value) => update({ warnings: { ...matchup.warnings, [key]: value } })}
            />
          ))}
        </div>
      </div>

      {/* Preview against sample data */}
      <div className="mx-auto w-full max-w-xl space-y-2">
        <p className={hint}>Preview with sample data. Select a metric to edit it.</p>
        <div className="space-y-5 rounded-xl border p-5">
          <div className="flex items-baseline justify-between gap-3 border-b pb-3">
            <span className="text-[22px] font-bold tracking-[-0.03em]">Team 492</span>
            <span className="font-mono text-xs text-muted-foreground">sample · rank 3</span>
          </div>
          {metricSection("autoMetrics", "Autonomous", "autoIcon")}
          {metricSection("teleopMetrics", "Teleop", "teleopIcon")}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Endgame</h3>
            {endgame.states.length === 0 && <p className={hint}>No endgame states yet.</p>}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {endgame.states.map((state, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{state.label}</span>
                  <span className="font-medium tabular-nums">{stateRate(state.key)}</span>
                </div>
              ))}
            </div>
          </section>
          {highlights.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">From the pit</h3>
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((highlight, index) => (
                  <span key={index} className="rounded-full border px-2.5 py-0.5 text-xs">
                    <span className="text-muted-foreground">{highlight.label}: </span>
                    {findDatapoint(pitFields, highlight.field)?.states?.[0] ?? "—"}
                    {highlight.unit}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Selected metric, then pit highlights */}
      <div className="space-y-4">
        <div className={`${panel} space-y-3`}>
          <h2 className={heading}>Metric</h2>
          {metric && selected ? (
            <>
              <TextField label="Label" value={metric.label} onChange={(label) => updateMetric({ label })} />
              <Field label="Field">
                <DatapointPicker
                  datapoints={matchFields}
                  value={metric.key}
                  onChange={(key) => updateMetric({ key })}
                />
              </Field>
              <Choice
                label="Shown as"
                value={metric.type ?? "number"}
                options={[
                  ["number", "Average"],
                  ["rate", "Rate (%)"],
                  ["badge", "Badge, highlighted above a threshold"],
                ]}
                onChange={(type) => updateMetric({ type })}
              />
              {metric.type === "badge" && (
                <NumberField
                  label="Highlight above"
                  placeholder="50"
                  value={metric.threshold}
                  onChange={(threshold) => updateMetric({ threshold })}
                />
              )}
              <TextField label="Unit" placeholder="%" value={metric.unit} onChange={(unit) => updateMetric({ unit: unit || undefined })} />
              <Toggle
                label="Hide when zero"
                checked={!!metric.hideIfZero}
                onChange={(hideIfZero) => updateMetric({ hideIfZero: hideIfZero || undefined })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  update({ [selected.list]: matchup[selected.list].filter((_, i) => i !== selected.index) });
                  setSelected(null);
                }}
              >
                Remove metric
              </Button>
            </>
          ) : (
            <p className={hint}>Select a metric in the preview to edit it.</p>
          )}
        </div>

        <div className={`${panel} space-y-3`}>
          <h2 className={heading}>Pit highlights</h2>
          <p className={hint}>Pit answers shown as badges. With none set, the card picks its own.</p>
          {highlights.map((highlight, index) => {
            const edit = (patch: Partial<typeof highlight>) =>
              setHighlights(highlights.map((h, i) => (i === index ? { ...h, ...patch } : h)));
            return (
              <Item
                key={index}
                title={highlight.label || highlight.field}
                onRemove={() => setHighlights(highlights.filter((_, i) => i !== index))}
              >
                <Field label="Pit question">
                  <DatapointPicker
                    datapoints={pitFields}
                    value={highlight.field}
                    onChange={(field) => {
                      const picked = pitFields.find((d) => d.key === field);
                      edit({
                        field,
                        section: picked?.pitSection ?? highlight.section,
                        label: picked && highlight.label === "New highlight" ? picked.label : highlight.label,
                      });
                    }}
                  />
                </Field>
                <TextField label="Label" value={highlight.label} onChange={(label) => edit({ label })} />
                <TextField label="Unit" placeholder="s" value={highlight.unit} onChange={(unit) => edit({ unit: unit || undefined })} />
              </Item>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={pitFields.length === 0}
            onClick={() =>
              setHighlights([
                ...highlights,
                { section: pitFields[0].pitSection!, field: pitFields[0].key, label: "New highlight" },
              ])
            }
          >
            <Plus /> Add highlight
          </Button>
        </div>
      </div>
    </div>
  );
}
