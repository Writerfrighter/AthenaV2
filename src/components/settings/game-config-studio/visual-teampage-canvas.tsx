"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YearConfig, TeamPageConfig, TeamPageSectionId } from "@/lib/types";
import { buildPreviewTeamData } from "@/lib/game-config/preview-stats";
import {
  ConfigurableTeamPage,
  TEAM_PAGE_COLUMNS,
  TEAM_PAGE_SECTIONS,
} from "@/components/team-pages/configurable-team-page";
import { buildTeamPageDefaults } from "@/lib/game-config/team-page-defaults";
import { cn } from "@/lib/utils";
import { TeamPageInspector } from "./team-page-inspector";
import { blockLinks, heading, hint, panel } from "./fields";

const DESCRIPTIONS: Record<TeamPageSectionId, string> = {
  kpi: "Big numbers along the top of every team page.",
  autoPerformance: "Averages from the autonomous period.",
  teleopPerformance: "Averages from the teleop period.",
  chart: "Bars comparing scoring actions per match.",
  endgame: "How often a team ends in each state.",
  custom: "Extra sections of your own, after the built-in ones.",
  penalties: "Foul averages and breakdown alerts.",
};

/** The layout list's groups; order changes only apply within a group, like the page's columns. */
const GROUPS: [string, TeamPageSectionId[]][] = [
  ["Top", ["kpi"]],
  ["Left column", TEAM_PAGE_COLUMNS[0]],
  ["Right column", TEAM_PAGE_COLUMNS[1]],
];

const nameOf = (id: TeamPageSectionId) => TEAM_PAGE_SECTIONS.find(([s]) => s === id)?.[1] ?? id;

export function VisualTeamPageCanvas({ config, year, onUpdateConfig }: {
  config: YearConfig;
  year: number;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const [selected, setSelected] = useState<TeamPageSectionId>("kpi");
  const [dragged, setDragged] = useState<TeamPageSectionId | null>(null);
  const previewTeamData = React.useMemo(() => buildPreviewTeamData(config), [config]);
  const teamPageConfig = config.teamPageConfig ?? buildTeamPageDefaults(config);

  const updateTeamPage = (patch: Partial<TeamPageConfig>) =>
    onUpdateConfig((prev) => ({
      ...prev,
      teamPageConfig: { ...(prev.teamPageConfig ?? buildTeamPageDefaults(prev)), ...patch },
    }));

  const hidden = new Set(teamPageConfig.layout?.hidden ?? []);
  const savedOrder = teamPageConfig.layout?.order ?? [];
  // Sections missing from a saved order go after it, as on the real page.
  const order = [...savedOrder, ...TEAM_PAGE_SECTIONS.map(([id]) => id).filter((id) => !savedOrder.includes(id))];
  const ordered = (ids: TeamPageSectionId[]) => [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const setLayout = (patch: NonNullable<TeamPageConfig["layout"]>) =>
    updateTeamPage({ layout: { ...teamPageConfig.layout, ...patch } });

  const toggleHidden = (id: TeamPageSectionId) => {
    const next = hidden.has(id) ? [...hidden].filter((h) => h !== id) : [...hidden, id];
    setLayout({ hidden: next.length ? next : undefined });
  };
  /** Moves a section to `to` within its group. */
  const moveTo = (id: TeamPageSectionId, to: number) => {
    const group = GROUPS.find(([, ids]) => ids.includes(id))![1];
    const inGroup = ordered(group).filter((s) => s !== id);
    inGroup.splice(Math.max(0, Math.min(to, inGroup.length)), 0, id);
    const slots = order.filter((s) => group.includes(s)).map((s) => order.indexOf(s)).sort((a, b) => a - b);
    const next = [...order];
    // Keep other groups where they are; refill this group's slots in the new order.
    slots.forEach((slot, i) => (next[slot] = inGroup[i]));
    setLayout({ order: next });
  };
  const groupOf = (id: TeamPageSectionId) => ordered(GROUPS.find(([, ids]) => ids.includes(id))![1]);
  const position = groupOf(selected).indexOf(selected);

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <nav aria-label="Page layout" className={`${panel} flex flex-col gap-0.5 p-3`}>
        <div className="px-2 pb-2">
          <h2 className={heading}>Page layout</h2>
          <p className={hint}>Drag to reorder. Eye to hide.</p>
        </div>
        {GROUPS.map(([group, ids]) => (
          <div key={group} className="flex flex-col gap-0.5 pb-2">
            {ids.length > 1 && <span className="px-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{group}</span>}
            {ordered(ids).map((id, index) => (
              <div
                key={id}
                draggable={ids.length > 1}
                onDragStart={() => setDragged(id)}
                onDragEnd={() => setDragged(null)}
                onDragOver={(e) => {
                  if (dragged && ids.includes(dragged)) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragged && dragged !== id) moveTo(dragged, index);
                  setDragged(null);
                }}
                className={cn(
                  "flex min-h-10 items-center gap-1 rounded-lg pl-2",
                  selected === id ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "hover:bg-accent",
                  dragged === id && "opacity-50",
                )}
              >
                <GripVertical
                  aria-hidden="true"
                  className={cn("size-4 shrink-0 text-muted-foreground", ids.length > 1 ? "cursor-grab" : "invisible")}
                />
                <button
                  type="button"
                  aria-pressed={selected === id}
                  onClick={() => setSelected(id)}
                  className={cn("min-h-10 flex-1 text-left text-sm", hidden.has(id) && "text-muted-foreground line-through")}
                >
                  {nameOf(id)}
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${hidden.has(id) ? "Show" : "Hide"} ${nameOf(id)}`}
                  onClick={() => toggleHidden(id)}
                >
                  {hidden.has(id) ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            ))}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="text-blue-700 dark:text-blue-400"
          onClick={() => {
            updateTeamPage({
              customSections: [
                ...(teamPageConfig.customSections ?? []),
                { id: `custom_${Date.now()}`, title: "New section", type: "summaryCards", items: [] },
              ],
            });
            setSelected("custom");
          }}
        >
          <Plus /> Add custom section
        </Button>
      </nav>

      <section className="flex min-w-0 flex-col gap-2">
        <p className={hint}>Real team page with sample data. Click a section to edit it.</p>
        {hidden.size > 0 && (
          <p className={hint}>
            Hidden:{" "}
            {[...hidden].map((id, i) => (
              <span key={id}>
                {i > 0 && ", "}
                {nameOf(id)}{" "}
                <button type="button" className="text-blue-700 underline dark:text-blue-400" onClick={() => toggleHidden(id)}>
                  Show
                </button>
              </span>
            ))}
          </p>
        )}
        <div className="max-h-[1100px] overflow-y-auto rounded-xl border bg-background p-6" onClickCapture={blockLinks}>
          <ConfigurableTeamPage
            teamNumber={String(previewTeamData.teamNumber)}
            yearOverride={year}
            configOverride={{ ...config, teamPageConfig }}
            teamDataOverride={previewTeamData}
            editor={{ selected, onSelect: setSelected }}
          />
        </div>
      </section>

      <aside className={`${panel} min-w-0 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold">{nameOf(selected)}</h2>
            <p className={hint}>{DESCRIPTIONS[selected]}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {groupOf(selected).length > 1 && (
              <>
                <Button variant="outline" size="icon-sm" aria-label="Move up" disabled={position === 0} onClick={() => moveTo(selected, position - 1)}>
                  <ChevronUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={position === groupOf(selected).length - 1}
                  onClick={() => moveTo(selected, position + 1)}
                >
                  <ChevronDown />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={hidden.has(selected) ? "Show section" : "Hide section"}
              onClick={() => toggleHidden(selected)}
            >
              {hidden.has(selected) ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>
        {hidden.has(selected) && <p className={hint}>Hidden from the team page.</p>}
        <TeamPageInspector section={selected} config={config} value={teamPageConfig} onChange={updateTeamPage} />
      </aside>
    </div>
  );
}
