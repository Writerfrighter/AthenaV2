"use client";

import React, { useState } from "react";
import { Lock, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldDrawingCanvas } from "@/components/forms/field-drawing-canvas";
import { ScoringField } from "@/components/forms/scoring-field";
import { encodeStartPosition, getFieldType } from "@/components/forms/match-form-utils";
import { cn } from "@/lib/utils";
import type {
  YearConfig,
  ScoringDefinition,
  PitScoutingFieldDefinition,
} from "@/lib/types";
import type { SelectedComponentInfo } from "./property-inspector";
import type { PaletteComponentType } from "./component-palette";
import { AddFieldMenu, FORM_SECTIONS, TAB_LABELS, fieldKind } from "./form-outline";
import { getSection } from "./types";
import { hint } from "./fields";

/** A value entered while trying the form out in test mode. */
type TestValue = string | number | boolean | string[];

export type PreviewDevice = "tablet" | "phone" | "desktop";

const DEVICE_WIDTH: Record<PreviewDevice, string> = {
  tablet: "max-w-[680px]",
  phone: "max-w-[390px]",
  desktop: "max-w-5xl",
};

interface VisualCanvasProps {
  config: YearConfig;
  scoutingMode: "match" | "pit";
  activeSection: string;
  isTestMode: boolean;
  device: PreviewDevice;
  selectedComponent: SelectedComponentInfo | null;
  onSectionChange: (section: string) => void;
  onSelectComponent: (comp: SelectedComponentInfo | null) => void;
  /** Adds a field to the section, after `afterKey` or at the end. */
  onInsertComponent: (type: PaletteComponentType, section: string, afterKey?: string) => void;
  onReorderComponents: (section: string, newKeysOrder: string[]) => void;
}

/** The real scouting form inside a device frame, with fields selectable in place. */
export function VisualCanvas({
  config,
  scoutingMode,
  activeSection,
  isTestMode,
  device,
  selectedComponent,
  onSectionChange,
  onSelectComponent,
  onInsertComponent,
  onReorderComponents,
}: VisualCanvasProps) {
  const [testData, setTestData] = useState<Record<string, TestValue>>({});
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const fields = getSection(config, scoutingMode, activeSection);
  const keys = Object.keys(fields);

  // Test values are per section: two sections may reuse a field key.
  const testKey = (key: string) => `${scoutingMode}.${activeSection}.${key}`;
  const setTestValue = (key: string, value: TestValue) =>
    setTestData((prev) => ({ ...prev, [testKey(key)]: value }));

  // Same rule as the real forms: match sections, and the pit endgame section.
  const honoursDependsOn = scoutingMode === "match" || activeSection === "endgame";
  const visibleKeys =
    isTestMode && honoursDependsOn
      ? keys.filter((key) => {
          const dependsOn = fields[key].dependsOn;
          return !dependsOn || Boolean(testData[testKey(dependsOn)]);
        })
      : keys;

  const move = (key: string, to: number) => {
    const next = keys.filter((k) => k !== key);
    next.splice(to, 0, key);
    onReorderComponents(activeSection, next);
  };

  const select = (fieldKey: string) => onSelectComponent({ mode: scoutingMode, section: activeSection, fieldKey });
  const isSelected = (key: string) =>
    !isTestMode &&
    selectedComponent?.mode === scoutingMode &&
    selectedComponent.section === activeSection &&
    selectedComponent.fieldKey === key;

  const framed = device !== "desktop";

  return (
    <div className={cn("mx-auto w-full", DEVICE_WIDTH[device])}>
      <div
        className={cn(
          framed ? "bg-neutral-800 p-3 dark:bg-neutral-700" : "border",
          device === "phone" ? "rounded-[40px]" : framed ? "rounded-[28px]" : "rounded-xl",
        )}
      >
        <div className={cn("overflow-hidden bg-background", device === "phone" ? "rounded-[30px]" : "rounded-2xl")}>
          {/* Same tab bar as the real scouting form */}
          <div
            role="tablist"
            aria-label="Form section"
            className="grid border-b"
            style={{ gridTemplateColumns: `repeat(${FORM_SECTIONS[scoutingMode].length}, minmax(0, 1fr))` }}
          >
            {FORM_SECTIONS[scoutingMode].map(([id]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={id === activeSection}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "py-3.5 text-[15px] transition-colors",
                  id === activeSection
                    ? "font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {TAB_LABELS[id]}
              </button>
            ))}
          </div>

          <div className="relative min-h-[420px] space-y-5 p-4 sm:p-5">
            {isTestMode && (
              <div className="flex items-center justify-between gap-2">
                <p className={hint}>Use the form as a scout would. Nothing is saved.</p>
                <Button size="sm" variant="outline" onClick={() => setTestData({})}>
                  <RotateCcw /> Reset values
                </Button>
              </div>
            )}

            {scoutingMode === "match" && activeSection === "autonomous" && (
              <FixedFormSection title="Starting position">
                <Select defaultValue={encodeStartPosition(config.startPositions?.[0] || "Center")}>
                  <SelectTrigger aria-label="Starting position" className="h-12 w-full rounded-xl sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(config.startPositions?.length ? config.startPositions : ["Left", "Center", "Right"]).map((position) => (
                      <SelectItem key={position} value={encodeStartPosition(position)}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FixedFormSection>
            )}

            {scoutingMode === "pit" && activeSection === "autonomous" && (
              <FixedFormSection title="Robot specifications">
                <div className="grid grid-cols-3 gap-3">
                  {["Length (in)", "Width (in)", "Weight (lbs)"].map((label) => (
                    <div key={label} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input readOnly placeholder="0" />
                    </div>
                  ))}
                </div>
              </FixedFormSection>
            )}

            {scoutingMode === "pit" && (
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {FORM_SECTIONS.pit.find(([id]) => id === activeSection)?.[1]}
              </h3>
            )}

            {keys.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-medium">This section has no fields yet</p>
                <AddFieldMenu mode={scoutingMode} onPick={(type) => onInsertComponent(type, activeSection)}>
                  <Button size="sm" variant="outline"><Plus /> Add a field</Button>
                </AddFieldMenu>
              </div>
            ) : (
              <div className={scoutingMode === "match" ? "grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2" : "flex flex-col gap-4"}>
                {visibleKeys.map((key) => {
                  const index = keys.indexOf(key);
                  const definition = fields[key];
                  const selected = isSelected(key);
                  const wide = scoutingMode === "match" && getFieldType(definition as ScoringDefinition) === "number";
                  return (
                    <div key={key} className={cn("flex flex-col gap-2", wide && "sm:col-span-2")}>
                      {/* The tag button is the keyboard route to a field; clicking the card is a mouse shortcut. */}
                      <div
                        draggable={!isTestMode}
                        onDragStart={(e) => {
                          setDraggedKey(key);
                          e.dataTransfer.setData("application/athena-reorder", key);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggedKey(null);
                          setDropTargetKey(null);
                        }}
                        onDragOver={(e) => {
                          if (!draggedKey) return;
                          e.preventDefault();
                          setDropTargetKey(key);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedKey && draggedKey !== key) move(draggedKey, index);
                          setDraggedKey(null);
                          setDropTargetKey(null);
                        }}
                        onClick={() => {
                          if (!isTestMode) select(key);
                        }}
                        className={cn(
                          "group relative rounded-xl border-[1.5px] bg-card p-4 transition-colors",
                          !isTestMode && "cursor-pointer",
                          selected
                            ? "border-blue-600 ring-4 ring-blue-600/15"
                            : dropTargetKey === key && draggedKey !== key
                              ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                              : isTestMode
                                ? "border-transparent"
                                : "border-transparent hover:border-border",
                          draggedKey === key && "opacity-50",
                        )}
                      >
                        {!isTestMode && (
                          <button
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Edit ${definition.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              select(key);
                            }}
                            className={cn(
                              "absolute -top-3 left-3 z-10 flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium transition-opacity focus-visible:opacity-100",
                              selected
                                ? "bg-blue-600 text-white opacity-100"
                                : "bg-foreground text-background opacity-0 group-hover:opacity-100",
                            )}
                          >
                            {fieldKind(scoutingMode, definition)} · <span className="font-mono">{key}</span>
                            {definition.dependsOn && honoursDependsOn && <span> · if {definition.dependsOn}</span>}
                          </button>
                        )}
                        {/* inert while editing, so a click selects the field instead of operating it */}
                        <div inert={!isTestMode}>
                          {scoutingMode === "match" ? (
                            <MatchPreview
                              section={activeSection}
                              fieldKey={key}
                              definition={definition as ScoringDefinition}
                              value={testData[testKey(key)]}
                              onChange={(value) => setTestValue(key, value)}
                            />
                          ) : (
                            <PitPreview
                              field={definition as PitScoutingFieldDefinition}
                              value={testData[testKey(key)]}
                              onChange={(value) => setTestValue(key, value)}
                            />
                          )}
                        </div>
                      </div>
                      {selected && (
                        <AddFieldMenu mode={scoutingMode} onPick={(type) => onInsertComponent(type, activeSection, key)}>
                          <button
                            type="button"
                            className="flex h-6 items-center gap-2 text-xs font-medium text-blue-700 before:h-px before:flex-1 before:bg-blue-200 after:h-px after:flex-1 after:bg-blue-200 dark:text-blue-400 dark:before:bg-blue-900 dark:after:bg-blue-900"
                          >
                            <Plus className="size-3.5" aria-hidden="true" /> Add a field here
                          </button>
                        </AddFieldMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {scoutingMode === "pit" && activeSection === "autonomous" && (
              <FixedFormSection title="Autonomous path drawing">
                <FieldDrawingCanvas fieldImageSrc={config.fieldImage} initialData="" readOnly />
              </FixedFormSection>
            )}

            <FixedFormSection title="Notes">
              <Textarea readOnly placeholder="Additional observations..." className="min-h-20 resize-none" />
            </FixedFormSection>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A built-in part of the scouting form: shown for fidelity, not editable. */
function FixedFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" />
        <span className="font-medium">{title}</span>
        <span className="ml-auto">Always on the form</span>
      </div>
      {children}
    </div>
  );
}

/** The real match-form field, so the canvas cannot drift from what scouts see. */
function MatchPreview({ section, fieldKey, definition, value, onChange }: {
  section: string;
  fieldKey: string;
  definition: ScoringDefinition;
  value: TestValue | undefined;
  onChange: (value: TestValue) => void;
}) {
  const type = getFieldType(definition);
  const current =
    typeof value === "object" || value === undefined
      ? type === "boolean"
        ? false
        : type === "select"
          ? Object.keys(definition.pointValues || {})[0] || ""
          : 0
      : value;
  return (
    <div className="flex flex-col gap-1.5">
      <ScoringField
        section={section as "autonomous" | "teleop" | "endgame" | "fouls"}
        fieldKey={fieldKey}
        fieldConfig={definition}
        currentValue={current}
        onValueChange={(_section, _field, next) => onChange(next)}
        onNumberChange={(_section, _field, increment) =>
          onChange(Math.max(0, (Number(current) || 0) + (increment ? 1 : -1)))
        }
      />
      {definition.description && <p className={hint}>{definition.description}</p>}
    </div>
  );
}

/** Mirrors the row layout of the pit scouting form. */
function PitPreview({ field, value, onChange }: {
  field: PitScoutingFieldDefinition;
  value: TestValue | undefined;
  onChange: (value: TestValue) => void;
}) {
  const multi = field.type === "multiselect";
  const selected = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[15px]">{field.label}</span>
      {(field.type === "text" || field.type === "number") && (
        <Input
          aria-label={field.label}
          type={field.type}
          value={typeof value === "boolean" || Array.isArray(value) ? "" : (value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-11 rounded-xl", field.type === "number" ? "w-28 text-center" : "w-full sm:w-64")}
        />
      )}
      {field.type === "boolean" && (
        <Switch aria-label={field.label} checked={value === true} onCheckedChange={onChange} />
      )}
      {(field.type === "select" || multi) && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {(field.options || []).map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                className={cn(
                  "min-h-11 rounded-full px-4 py-2 text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-accent",
                )}
                onClick={() =>
                  onChange(
                    multi
                      ? active
                        ? selected.filter((o) => o !== option)
                        : [...selected, option]
                      : option,
                  )
                }
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
