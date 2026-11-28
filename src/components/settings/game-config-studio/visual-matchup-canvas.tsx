"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YearConfig, MetricDisplayConfig, MatchupCardConfig } from "@/lib/types";
import { buildDatapointRegistry, findDatapoint } from "@/lib/game-config/datapoint-registry";
import {
  PREVIEW_OTHER_TEAMS,
  buildPreviewStats,
  buildPreviewTeamData,
  formatPreviewMetric,
} from "@/lib/game-config/preview-stats";
import {
  ConfigurableMatchupCard,
  defaultMatchupMetrics,
  type MatchupMetricList,
} from "@/components/matchup/configurable-matchup-card";
import { DatapointPicker } from "./datapoint-picker";
import { Choice, Disclosure, Field, Item, NumberField, Segmented, TextField, Toggle, blockLinks, hint, panel } from "./fields";

const ICONS = ["Flame", "Zap", "Target", "Activity", "Package", "Puzzle", "Sparkles"] as const;

const WARNINGS = [
  ["breakdownThreshold", "Breakdown rate (%)", 15],
  ["foulThreshold", "Fouls per match", 1],
  ["techFoulThreshold", "Tech fouls per match", 0.5],
  ["majorPenaltyThreshold", "Major penalties per match", 0.3],
  ["minorPenaltyThreshold", "Minor penalties per match", 1],
] as const;

const LIST_NAMES: Record<MatchupMetricList, string> = { autoMetrics: "Autonomous", teleopMetrics: "Teleop" };

/** The card as it is configured, or the defaults the real card falls back to. */
function matchupOf(config: YearConfig): MatchupCardConfig {
  return (
    config.matchupCardConfig ?? {
      autoMetrics: defaultMatchupMetrics(config, "autoMetrics"),
      teleopMetrics: defaultMatchupMetrics(config, "teleopMetrics"),
      endgame: { states: [] },
    }
  );
}

export function VisualMatchupCanvas({ config, onUpdateConfig }: {
  config: YearConfig;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const [selected, setSelected] = useState<{ list: MatchupMetricList; index: number } | null>(null);
  const [inAlliance, setInAlliance] = useState(true);
  const datapoints = React.useMemo(() => buildDatapointRegistry(config), [config]);
  const previewStats = React.useMemo(() => buildPreviewStats(config), [config]);
  const previewTeams = React.useMemo(
    () => [buildPreviewTeamData(config), ...PREVIEW_OTHER_TEAMS.slice(0, 2).map((team) => buildPreviewTeamData(config, team))],
    [config],
  );

  const matchFields = datapoints.filter((d) => !d.pitSection);
  const enumFields = matchFields.filter((d) => d.valueType === "enum");
  const pitFields = datapoints.filter((d) => d.pitSection);

  const matchup = matchupOf(config);
  const update = (patch: Partial<MatchupCardConfig>) =>
    onUpdateConfig((prev) => ({ ...prev, matchupCardConfig: { ...matchupOf(prev), ...patch } }));

  const endgame = matchup.endgame ?? { states: [] };
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
      [selected.list]: matchup[selected.list].map((m, i) => (i === selected.index ? { ...m, ...patch } : m)),
    });
  };

  const addMetric = (list: MatchupMetricList) => {
    const first = matchFields.find((d) => d.valueType === "number");
    update({ [list]: [...matchup[list], { key: first?.key ?? "", label: first?.label ?? "New metric" }] });
    setSelected({ list, index: matchup[list].length });
  };

  const editor = { selected, onSelect: (list: MatchupMetricList, index: number) => setSelected({ list, index }), onAdd: addMetric };
  const iconKey = selected?.list === "teleopMetrics" ? "teleopIcon" : "autoIcon";
  const resolved = !!findDatapoint(datapoints, metric?.key);

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* The real matchup card, against sample data, where it is used */}
      {/* Links on the card would leave the studio, so a preview click never follows one */}
      <section className="flex min-w-0 flex-col gap-3" onClickCapture={blockLinks}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={hint}>
            Real card with sample data for <strong className="text-foreground">Team {previewTeams[0].teamNumber}</strong>. Click a row to edit it.
          </p>
          <Segmented
            label="Preview layout"
            className="w-auto"
            value={inAlliance ? "alliance" : "card"}
            options={[
              ["card", "Card only"],
              ["alliance", "In an alliance"],
            ]}
            onChange={(value) => setInAlliance(value === "alliance")}
          />
        </div>
        {inAlliance ? (
          // Same column as the real matchup page: heading, then the alliance's cards stacked.
          <div className="mx-auto flex w-full max-w-md flex-col gap-4">
            <h3 className="border-b-2 border-[#E5484D] pb-2 font-semibold text-[#C2272D]">
              Red alliance · {previewTeams.length} robots · sample
            </h3>
            {previewTeams.map((team, index) => (
              // Teammates are dimmed and inert: there to judge length and density.
              <div key={team.teamNumber} inert={index > 0} className={index > 0 ? "opacity-55" : "rounded-xl ring-4 ring-blue-600/15"}>
                <ConfigurableMatchupCard
                  teamNumber={String(team.teamNumber)}
                  configOverride={{ ...config, matchupCardConfig: matchup }}
                  teamDataOverride={team}
                  editor={index === 0 ? editor : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md">
            <ConfigurableMatchupCard
              teamNumber={String(previewTeams[0].teamNumber)}
              configOverride={{ ...config, matchupCardConfig: matchup }}
              teamDataOverride={previewTeams[0]}
              editor={editor}
            />
          </div>
        )}
      </section>

      {/* Everything about the selected row, then card-wide settings */}
      <aside className="flex flex-col gap-3">
        <div className={`${panel} space-y-3`}>
          {metric && selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold">{metric.label || "Metric"}</h2>
                  <p className={hint}>
                    {LIST_NAMES[selected.list]} · row {selected.index + 1} of {matchup[selected.list].length}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Remove metric"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    update({ [selected.list]: matchup[selected.list].filter((_, i) => i !== selected.index) });
                    setSelected(null);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
              <TextField label="Label" value={metric.label} onChange={(label) => updateMetric({ label })} />
              <Field label="Data">
                <DatapointPicker datapoints={matchFields} value={metric.key} onChange={(key) => updateMetric({ key })} />
              </Field>
              <Field label="Show as">
                <Segmented
                  label="Show as"
                  value={metric.type ?? "number"}
                  options={[
                    ["number", "Average"],
                    ["rate", "Rate %"],
                    ["badge", "Badge"],
                  ]}
                  onChange={(type) => updateMetric({ type })}
                />
                <p className={hint}>
                  {metric.type === "badge" ? "Highlighted above the threshold. " : ""}
                  Sample: {formatPreviewMetric(previewStats, metric.key, resolved)}
                  {metric.unit}
                </p>
              </Field>
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
              <Choice
                label={`${LIST_NAMES[selected.list]} section icon`}
                value={matchup[iconKey] ?? "Flame"}
                options={ICONS}
                onChange={(icon) => update({ [iconKey]: icon })}
              />
            </>
          ) : (
            <p className={hint}>Click a row on the card to edit it, or use + Add metric.</p>
          )}
        </div>

        <Disclosure title="Warnings" defaultOpen>
          <p className={hint}>Flag a team when its average goes above:</p>
          {WARNINGS.map(([key, label, fallback]) => (
            <NumberField
              key={key}
              label={label}
              placeholder={String(fallback)}
              value={matchup.warnings?.[key]}
              onChange={(value) => update({ warnings: { ...matchup.warnings, [key]: value } })}
            />
          ))}
        </Disclosure>

        <Disclosure title="Endgame and playstyle">
          <Field label="Robot state field">
            <DatapointPicker
              datapoints={enumFields}
              value={endgame.stateKey}
              onChange={(stateKey) =>
                updateEndgame({
                  stateKey,
                  states: (findDatapoint(enumFields, stateKey)?.states ?? []).map((state) => ({ key: state, label: state })),
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
                <NumberField label="Highlight above (%)" value={state.threshold} onChange={(threshold) => edit({ threshold })} />
              </Item>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateEndgame({ states: [...endgame.states, { key: stateOptions[0] ?? "", label: stateOptions[0] ?? "New state" }] })
            }
          >
            <Plus /> Add state
          </Button>
          <Field label="Playstyle field">
            <p className={hint}>A choice with offensive, balanced and defensive options.</p>
            <DatapointPicker
              datapoints={enumFields}
              value={matchup.playstyleKey}
              placeholder="Default (endgame.robot_playstyle)"
              onChange={(playstyleKey) => update({ playstyleKey: playstyleKey || undefined })}
            />
          </Field>
          {matchup.playstyleKey && (
            <Button variant="ghost" size="sm" onClick={() => update({ playstyleKey: undefined })}>
              Use default playstyle field
            </Button>
          )}
        </Disclosure>

        <Disclosure title={`Pit highlights · ${highlights.length}`}>
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
              setHighlights([...highlights, { section: pitFields[0].pitSection!, field: pitFields[0].key, label: "New highlight" }])
            }
          >
            <Plus /> Add highlight
          </Button>
        </Disclosure>
      </aside>
    </div>
  );
}
