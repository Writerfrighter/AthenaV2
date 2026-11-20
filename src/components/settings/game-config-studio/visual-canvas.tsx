"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  GripVertical,
  Lock,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PALETTE, type PaletteComponentType } from "./component-palette";
import { getSection } from "./types";
import { hint } from "./fields";

/** A value entered while trying the form out in test mode. */
type TestValue = string | number | boolean | string[];

const SECTIONS = {
  match: [
    ["autonomous", "Auto"],
    ["teleop", "Teleop"],
    ["endgame", "Endgame"],
    ["fouls", "Fouls"],
  ],
  pit: [
    ["autonomous", "Auto"],
    ["teleoperated", "Teleop"],
    ["driveTeam", "Drive team"],
    ["endgame", "Endgame"],
  ],
} as const;

const VIEWPORTS = {
  responsive: "max-w-5xl",
  tablet: "max-w-[768px]",
  phone: "max-w-[420px]",
};

interface VisualCanvasProps {
  config: YearConfig;
  year: number;
  scoutingMode: "match" | "pit";
  activeSection: string;
  isTestMode: boolean;
  viewportDevice: keyof typeof VIEWPORTS;
  selectedComponent: SelectedComponentInfo | null;
  onSectionChange: (section: string) => void;
  onSelectComponent: (comp: SelectedComponentInfo | null) => void;
  onDuplicateComponent: (comp: SelectedComponentInfo) => void;
  onDeleteComponent: (comp: SelectedComponentInfo) => void;
  onDropComponent: (type: PaletteComponentType, section: string) => void;
  onReorderComponents: (section: string, newKeysOrder: string[]) => void;
}

export function VisualCanvas({
  config,
  year,
  scoutingMode,
  activeSection,
  isTestMode,
  viewportDevice,
  selectedComponent,
  onSectionChange,
  onSelectComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onDropComponent,
  onReorderComponents,
}: VisualCanvasProps) {
  const [isPaletteDragOver, setIsPaletteDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [testData, setTestData] = useState<Record<string, TestValue>>({});
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  useEffect(() => {
    const reset = () => {
      dragCounterRef.current = 0;
      setIsPaletteDragOver(false);
      setDraggedKey(null);
      setDropTargetKey(null);
    };
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    return () => {
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
    };
  }, []);

  const isPaletteDrag = (e: React.DragEvent) =>
    e.dataTransfer.types.includes("application/athena-component");

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

  const info = (fieldKey: string): SelectedComponentInfo => ({
    mode: scoutingMode,
    section: activeSection,
    fieldKey,
  });

  return (
    <div
      onDragEnter={(e) => {
        if (!isPaletteDrag(e)) return;
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsPaletteDragOver(true);
      }}
      onDragOver={(e) => {
        if (!isPaletteDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!isPaletteDrag(e)) return;
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current === 0) setIsPaletteDragOver(false);
      }}
      onDrop={(e) => {
        if (!isPaletteDrag(e)) return;
        e.preventDefault();
        const type = e.dataTransfer.getData("application/athena-component") as PaletteComponentType;
        if (type) onDropComponent(type, activeSection);
      }}
      className={cn("relative mx-auto w-full rounded-xl border", VIEWPORTS[viewportDevice])}
    >
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              {config.competitionType} {year} · {scoutingMode === "match" ? "match form" : "pit form"}
            </span>
            <p className={hint}>
              {isTestMode
                ? "Testing: use the form as a scout would. Nothing is saved."
                : "Select a field to edit it. Drag the handle or use the arrows to reorder."}
            </p>
          </div>
          {isTestMode && (
            <Button size="sm" variant="outline" onClick={() => setTestData({})}>
              <RotateCcw /> Reset values
            </Button>
          )}
        </div>
        <Tabs value={activeSection} onValueChange={onSectionChange}>
          <TabsList>
            {SECTIONS[scoutingMode].map(([id, label]) => (
              <TabsTrigger key={id} value={id} className="flex-none">
                {label}
                <span className="font-mono text-[11px] opacity-70">
                  {Object.keys(getSection(config, scoutingMode, id)).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="relative min-h-[420px] space-y-5 p-4 sm:p-6">
        {isPaletteDragOver && (
          <div className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-xl border border-dashed border-primary bg-primary/10 text-sm font-medium">
            Drop to add to this section
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

        {scoutingMode === "pit" && (
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

        {keys.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium">This section has no fields yet</p>
            <p className={hint}>Drag a field in, or start with one of these.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PALETTE[scoutingMode].slice(0, 3).map((item) => (
                <Button key={item.type} size="sm" variant="outline" onClick={() => onDropComponent(item.type, activeSection)}>
                  <Plus /> {item.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className={scoutingMode === "match" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-2"}>
            {visibleKeys.map((key) => {
              const index = keys.indexOf(key);
              const definition = fields[key];
              const isNumber =
                scoutingMode === "match" && getFieldType(definition as ScoringDefinition) === "number";
              return (
                <div
                  key={key}
                  onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes("application/athena-reorder")) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setDropTargetKey(key);
                  }}
                  onDrop={(e) => {
                    if (!draggedKey) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedKey !== key) move(draggedKey, index);
                  }}
                  onClick={() => {
                    if (!isTestMode) onSelectComponent(info(key));
                  }}
                  className={cn(
                    "rounded-xl border bg-card transition-colors",
                    isNumber && "sm:col-span-2",
                    !isTestMode && "cursor-pointer",
                    dropTargetKey === key && draggedKey && draggedKey !== key
                      ? "border-primary bg-primary/5"
                      : !isTestMode &&
                          selectedComponent?.mode === scoutingMode &&
                          selectedComponent.section === activeSection &&
                          selectedComponent.fieldKey === key
                        ? "border-foreground"
                        : !isTestMode && "hover:border-foreground/40",
                  )}
                >
                  {!isTestMode && (
                    <div className="flex items-center gap-0.5 border-b px-1.5 py-1 text-muted-foreground">
                      <span
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggedKey(key);
                          e.dataTransfer.setData("application/athena-reorder", key);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        title="Drag to reorder"
                        className="cursor-grab p-1 active:cursor-grabbing"
                      >
                        <GripVertical className="size-3.5" />
                      </span>
                      <button
                        type="button"
                        aria-label={`Edit ${definition.label}`}
                        className="min-w-0 flex-1 truncate text-left font-mono text-[11px]"
                      >
                        {key}
                        {definition.dependsOn && honoursDependsOn && (
                          <span className="font-sans"> · shown if {definition.dependsOn}</span>
                        )}
                      </button>
                      {(
                        [
                          ["Move earlier", ArrowLeft, index === 0, () => move(key, index - 1)],
                          ["Move later", ArrowRight, index === keys.length - 1, () => move(key, index + 1)],
                          ["Duplicate", Copy, false, () => onDuplicateComponent(info(key))],
                          ["Delete", Trash2, false, () => onDeleteComponent(info(key))],
                        ] as const
                      ).map(([label, Icon, disabled, action]) => (
                        <Button
                          key={label}
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${label}: ${definition.label}`}
                          title={label}
                          disabled={disabled}
                          className={label === "Delete" ? "hover:text-destructive" : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            action();
                          }}
                        >
                          <Icon />
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* inert while editing, so a click selects the field instead of operating it */}
                  <div inert={!isTestMode} className="p-4">
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
