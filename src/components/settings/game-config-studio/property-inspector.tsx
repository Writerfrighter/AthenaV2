"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronRight, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  YearConfig,
  ScoringDefinition,
  PitScoutingFieldDefinition,
} from "@/lib/types";
import { getFieldType } from "@/components/forms/match-form-utils";
import { MAX_FIELD_IMAGE_LENGTH } from "@/lib/game-config/config-validator";
import { imageFileToDataUrl } from "@/lib/image-upload";
import { cn, getErrorMessage } from "@/lib/utils";
import { getSection, renameField, renameKey, slugifyKey, updateSection } from "./types";
import { Choice, Field, Segmented, TextField, heading, hint, panel } from "./fields";
import { findUsages, type UsageMode } from "./usages";

export interface SelectedComponentInfo {
  mode: "match" | "pit";
  section: string;
  fieldKey: string;
}

interface PropertyInspectorProps {
  config: YearConfig;
  year: number;
  selectedComponent: SelectedComponentInfo | null;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
  onSelectComponent: (comp: SelectedComponentInfo | null) => void;
  onDuplicateComponent: (comp: SelectedComponentInfo) => void;
  onDeleteComponent: (comp: SelectedComponentInfo) => void;
  /** Opens another studio mode, from a "Used in" link. */
  onNavigate: (mode: UsageMode) => void;
}

function AddRow({ placeholder, type, onAdd }: {
  placeholder: string;
  type?: "number";
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };
  return (
    <div className="flex gap-1.5">
      <Input
        aria-label={placeholder}
        type={type}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          submit();
        }}
        className="border-dashed"
      />
      <Button type="button" variant="outline" onClick={submit}>Add</Button>
    </div>
  );
}

function Chips({ items, onRemove }: { items: string[]; onRemove: (index: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex h-8 items-center gap-1 rounded-lg bg-muted px-2.5 text-sm font-medium">
          {item}
          <button
            type="button"
            aria-label={`Remove ${item}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

/** A labelled group of inspector controls. */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

const NO_DEPENDENCY = "__none__";

// shortcut: the image is kept in the config as a JPEG data URL, so it reaches
// offline scouts with the config and needs no upload endpoint. Move it to file
// storage if configs become slow to load.
function FieldImage({ value, onChange }: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <Field label="Field image">
      {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise */}
      {value && <img src={value} alt="Field diagram" className="w-full rounded-lg border" />}
      <input
        ref={input}
        type="file"
        accept="image/*"
        aria-label="Field image file"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            // Scaled down automatically; any aspect ratio is kept.
            onChange(await imageFileToDataUrl(file, 1600, MAX_FIELD_IMAGE_LENGTH));
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />
      <div className="flex gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Use default
          </Button>
        )}
      </div>
      <p className={hint}>
        Scouts draw autonomous paths on this. Drawings already saved are not moved if you change it mid-season.
      </p>
    </Field>
  );
}

type MatchType = "number" | "boolean" | "select";

/** What a match field becomes when its type changes; points and steps carry over where they still apply. */
function convertMatchField(field: ScoringDefinition, to: MatchType): ScoringDefinition {
  const base = { label: field.label, description: field.description, dependsOn: field.dependsOn };
  if (to === "select") return { ...base, type: "select", pointValues: field.pointValues ?? { none: 0 } };
  if (to === "boolean") return { ...base, type: "boolean", points: field.points ?? 0 };
  return { ...base, type: "number", points: field.points ?? 0, increments: field.increments ?? [1] };
}

const PIT_TYPES = [
  ["text", "Text"],
  ["number", "Number"],
  ["boolean", "Yes / No"],
  ["select", "One"],
  ["multiselect", "Several"],
] as const;

export function PropertyInspector({
  config,
  year,
  selectedComponent,
  onUpdateConfig,
  onSelectComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onNavigate,
}: PropertyInspectorProps) {
  if (!selectedComponent) {
    const positions = config.startPositions || [];
    return (
      <div className={`${panel} space-y-4`}>
        <div>
          <h2 className={heading}>Game</h2>
          <p className={hint}>
            {config.competitionType} {year}. Rename it from the ⋯ menu to change the program or year.
          </p>
        </div>
        <TextField
          label="Game name"
          value={config.gameName}
          onChange={(gameName) => onUpdateConfig((prev) => ({ ...prev, gameName }))}
        />
        <Field label="Starting positions">
          <Chips
            items={positions}
            onRemove={(index) =>
              onUpdateConfig((prev) => ({
                ...prev,
                startPositions: (prev.startPositions || []).filter((_, i) => i !== index),
              }))
            }
          />
          <AddRow
            placeholder="Add a position"
            onAdd={(position) => {
              if (positions.includes(position)) return;
              onUpdateConfig((prev) => ({
                ...prev,
                startPositions: [...(prev.startPositions || []), position],
              }));
            }}
          />
        </Field>
        <FieldImage
          value={config.fieldImage}
          onChange={(fieldImage) => onUpdateConfig((prev) => ({ ...prev, fieldImage }))}
        />
        <p className={hint}>Select a field on the form to edit it.</p>
      </div>
    );
  }

  const { mode, section, fieldKey } = selectedComponent;
  const fields = getSection(config, mode, section);
  const definition = fields[fieldKey];

  if (!definition) {
    return (
      <div className={`${panel} ${hint}`}>
        This field no longer exists.{" "}
        <Button variant="link" size="sm" onClick={() => onSelectComponent(null)}>Deselect</Button>
      </div>
    );
  }

  const replace = (next: ScoringDefinition | PitScoutingFieldDefinition) =>
    onUpdateConfig((prev) =>
      updateSection(prev, mode, section, (current) => ({ ...current, [fieldKey]: next as (typeof current)[string] })),
    );
  const update = (patch: Partial<ScoringDefinition> | Partial<PitScoutingFieldDefinition>) =>
    onUpdateConfig((prev) =>
      updateSection(prev, mode, section, (current) => ({
        ...current,
        [fieldKey]: { ...current[fieldKey], ...patch } as (typeof current)[string],
      })),
    );

  const rename = (raw: string) => {
    const next = slugifyKey(raw);
    if (!next || next === fieldKey) return false;
    if (next in fields) {
      toast.error(`"${next}" is already used in this section`);
      return false;
    }
    onUpdateConfig((prev) => renameField(prev, mode, section, fieldKey, next));
    onSelectComponent({ mode, section, fieldKey: next });
    return true;
  };

  // The real forms only honour dependsOn within a match section, and within
  // the pit form's endgame section.
  const canDepend = mode === "match" || section === "endgame";
  const dependencies = Object.entries(fields).filter(
    ([key, other]) => key !== fieldKey && other.type === "boolean",
  );

  const match = mode === "match" ? (definition as ScoringDefinition) : null;
  const pit = mode === "pit" ? (definition as PitScoutingFieldDefinition) : null;
  const matchType = match ? getFieldType(match) : null;
  const usages = findUsages(config, mode, section, fieldKey);

  let body: ReactNode = null;

  if (match && matchType === "select") {
    const options = match.pointValues || {};
    body = (
      <Group label="Options and points">
        {Object.entries(options).map(([option, points]) => (
          <div key={option} className="flex items-center gap-1.5">
            <Input
              aria-label={`Option ${option}`}
              defaultValue={option}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== option && !(name in options)) {
                  update({ pointValues: renameKey(options, option, name) });
                } else {
                  e.target.value = option;
                }
              }}
            />
            <Input
              aria-label={`Points for ${option}`}
              type="number"
              value={points}
              onChange={(e) => update({ pointValues: { ...options, [option]: Number(e.target.value) || 0 } })}
              className="w-20 text-center"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${option}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                const next = { ...options };
                delete next[option];
                update({ pointValues: next });
              }}
            >
              <X />
            </Button>
          </div>
        ))}
        <AddRow
          placeholder="Type an option, press Enter"
          onAdd={(option) => {
            if (!(option in options)) update({ pointValues: { ...options, [option]: 0 } });
          }}
        />
      </Group>
    );
  } else if (match) {
    const increments = match.increments || [];
    body = (
      <div className={cn("grid gap-3", matchType === "number" && "grid-cols-[96px_minmax(0,1fr)]")}>
        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">
            {matchType === "boolean" ? "Points when yes" : "Points each"}
          </span>
          <Input
            type="number"
            step="any"
            value={match.points ?? ""}
            onChange={(e) => update({ points: e.target.value === "" ? 0 : Number(e.target.value) })}
          />
        </label>
        {matchType === "number" && (
          <Group label="Buttons">
            <Chips
              items={(increments.length ? increments : [1]).map((step) => `+${step}`)}
              onRemove={(index) => {
                const next = increments.filter((_, i) => i !== index);
                update({ increments: next.length ? next : [1] });
              }}
            />
            <AddRow
              type="number"
              placeholder="Add a step, such as 5"
              onAdd={(text) => {
                const step = parseInt(text, 10);
                if (step > 0 && !increments.includes(step)) {
                  update({ increments: [...increments, step].sort((a, b) => a - b) });
                }
              }}
            />
          </Group>
        )}
      </div>
    );
  } else if (pit) {
    const options = pit.options || [];
    const hasOptions = pit.type === "select" || pit.type === "multiselect";
    body = (
      <>
        <Group label="Answer type">
          <div className="grid grid-cols-3 gap-1.5">
            {PIT_TYPES.map(([type, text]) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={pit.type === type}
                onClick={() => update({ type })}
                className={cn(pit.type === type && "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300")}
              >
                {text}
              </Button>
            ))}
          </div>
        </Group>
        {hasOptions && (
          <Group label="Options">
            {options.map((option, index) => (
              <div key={`${option}-${index}`} className="flex items-center gap-1.5">
                <Input
                  aria-label={`Option ${index + 1}`}
                  defaultValue={option}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== option && !options.includes(name)) {
                      update({ options: options.map((o, i) => (i === index ? name : o)) });
                    } else {
                      e.target.value = option;
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${option}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => update({ options: options.filter((_, i) => i !== index) })}
                >
                  <X />
                </Button>
              </div>
            ))}
            <AddRow
              placeholder="Type an option, press Enter"
              onAdd={(option) => {
                if (!options.includes(option)) update({ options: [...options, option] });
              }}
            />
          </Group>
        )}
      </>
    );
  }

  return (
    <div className={`${panel} space-y-4`}>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">{definition.label}</h2>
          <p className={`${hint} truncate font-mono`}>{section}.{fieldKey}</p>
        </div>
        <Button variant="outline" size="icon-sm" aria-label="Duplicate field" onClick={() => onDuplicateComponent(selectedComponent)}>
          <Copy />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Delete field"
          className="text-destructive hover:text-destructive"
          onClick={() => onDeleteComponent(selectedComponent)}
        >
          <Trash2 />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close and show game settings" onClick={() => onSelectComponent(null)}>
          <X />
        </Button>
      </div>

      <TextField
        label={mode === "match" ? "Label scouts see" : "Question"}
        value={definition.label}
        onChange={(label) => update({ label })}
      />

      {match && matchType && (
        <Group label="Field type">
          <Segmented
            label="Field type"
            value={matchType}
            options={[
              ["number", "Counter"],
              ["boolean", "Yes / No"],
              ["select", "Choice"],
            ]}
            onChange={(to) => {
              if (to !== matchType) replace(convertMatchField(match, to));
            }}
          />
        </Group>
      )}

      {body}

      {match && (
        <TextField
          label="Help text (optional)"
          placeholder="Shown under the field"
          value={match.description || ""}
          onChange={(description) => update({ description })}
        />
      )}

      {canDepend && (
        <details open={!!definition.dependsOn} className="border-t pt-3">
          <summary className="cursor-pointer text-[13px] font-medium">Only show when…</summary>
          <div className="mt-2 space-y-2">
            <p className={hint}>Hide this until another yes/no answer in this section is yes.</p>
            <Choice
              label="Show"
              value={definition.dependsOn || NO_DEPENDENCY}
              options={[
                [NO_DEPENDENCY, "Always"],
                ...dependencies.map(([key, other]) => [key, `Only if "${other.label}" is yes`] as const),
              ]}
              onChange={(key) => update({ dependsOn: key === NO_DEPENDENCY ? undefined : key })}
            />
          </div>
        </details>
      )}

      <details className="border-t pt-3">
        <summary className="cursor-pointer text-[13px] font-medium">Storage key</summary>
        <div className="mt-2 space-y-2">
          <Input
            key={fieldKey}
            aria-label="Key"
            defaultValue={fieldKey}
            className="font-mono"
            onBlur={(e) => {
              if (!rename(e.target.value)) e.target.value = fieldKey;
            }}
          />
          <p className={hint}>
            Stored with every entry. Renaming updates references in this config, but
            entries already recorded keep the old key.
          </p>
        </div>
      </details>

      <div className="space-y-1 border-t pt-3">
        <span className="block text-xs font-medium text-muted-foreground">{mode === "match" ? "Used in" : "Shown on"}</span>
        {usages.length === 0 ? (
          <p className={hint}>Not shown anywhere else yet.</p>
        ) : (
          usages.map((usage) => (
            <button
              key={usage.label}
              type="button"
              onClick={() => onNavigate(usage.mode)}
              className="flex min-h-9 w-full items-center justify-between rounded-md text-left text-[13px] hover:underline"
            >
              {usage.label}
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
