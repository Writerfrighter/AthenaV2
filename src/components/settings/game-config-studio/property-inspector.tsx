"use client";

import { useRef, useState, type ReactNode } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  YearConfig,
  ScoringDefinition,
  PitScoutingFieldDefinition,
} from "@/lib/types";
import { getFieldType } from "@/components/forms/match-form-utils";
import { MAX_FIELD_IMAGE_LENGTH } from "@/lib/game-config/config-validator";
import { imageFileToDataUrl } from "@/lib/image-upload";
import { getErrorMessage } from "@/lib/utils";
import { getSection, renameField, renameKey, slugifyKey, updateSection } from "./types";
import { Choice, Field, NumberField, TextField, heading, hint, panel } from "./fields";

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
      />
      <Button type="button" variant="outline" onClick={submit}>Add</Button>
    </div>
  );
}

function Chips({ items, onRemove }: { items: string[]; onRemove: (index: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs">
          {item}
          <button
            type="button"
            aria-label={`Remove ${item}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
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
        Scouts draw autonomous paths on this. Any shape works, including a square FTC
        field. Drawings already saved are not moved if you change it mid-season.
      </p>
    </Field>
  );
}

export function PropertyInspector({
  config,
  year,
  selectedComponent,
  onUpdateConfig,
  onSelectComponent,
  onDuplicateComponent,
  onDeleteComponent,
}: PropertyInspectorProps) {
  if (!selectedComponent) {
    const positions = config.startPositions || [];
    return (
      <div className={`${panel} space-y-4`}>
        <div>
          <h2 className={heading}>Game</h2>
          <p className={hint}>
            {config.competitionType} {year}. Use Rename to change the program or year.
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

  let body: ReactNode = null;

  if (match && matchType === "select") {
    const options = match.pointValues || {};
    body = (
      <Field label="Options and points">
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
              size="icon-xs"
              aria-label={`Remove ${option}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                const next = { ...options };
                delete next[option];
                update({ pointValues: next });
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <AddRow
          placeholder="Add an option"
          onAdd={(option) => {
            if (!(option in options)) update({ pointValues: { ...options, [option]: 0 } });
          }}
        />
      </Field>
    );
  } else if (match) {
    const increments = match.increments || [];
    body = (
      <>
        <NumberField
          label={matchType === "boolean" ? "Points when achieved" : "Points each"}
          value={match.points}
          onChange={(points) => update({ points: points ?? 0 })}
        />
        {matchType === "number" && (
          <Field label="Step buttons">
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
          </Field>
        )}
      </>
    );
  } else if (pit) {
    const options = pit.options || [];
    const hasOptions = pit.type === "select" || pit.type === "multiselect";
    body = (
      <>
        <Choice
          label="Answer type"
          value={pit.type}
          options={[
            ["text", "Text"],
            ["number", "Number"],
            ["boolean", "Yes / No"],
            ["select", "Single choice"],
            ["multiselect", "Multiple choice"],
          ]}
          onChange={(type) => update({ type })}
        />
        {hasOptions && (
          <Field label="Options">
            <Chips
              items={options}
              onRemove={(index) => update({ options: options.filter((_, i) => i !== index) })}
            />
            <AddRow
              placeholder="Add an option"
              onAdd={(option) => {
                if (!options.includes(option)) update({ options: [...options, option] });
              }}
            />
          </Field>
        )}
      </>
    );
  }

  return (
    <div className={`${panel} space-y-4`}>
      <div className="flex items-center gap-1">
        <h2 className={`${heading} min-w-0 flex-1 truncate`}>
          {mode === "match" ? "Match field" : "Pit question"}
        </h2>
        <Button variant="ghost" size="icon-xs" aria-label="Duplicate field" onClick={() => onDuplicateComponent(selectedComponent)}>
          <Copy />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete field"
          className="hover:text-destructive"
          onClick={() => onDeleteComponent(selectedComponent)}
        >
          <Trash2 />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => onSelectComponent(null)}>
          <X />
        </Button>
      </div>

      <TextField label="Label" value={definition.label} onChange={(label) => update({ label })} />

      <Field label="Key">
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
      </Field>

      {body}

      {canDepend && (
        <Choice
          label="Show"
          value={definition.dependsOn || NO_DEPENDENCY}
          options={[
            [NO_DEPENDENCY, "Always"],
            ...dependencies.map(([key, other]) => [key, `Only if "${other.label}" is yes`] as const),
          ]}
          onChange={(key) => update({ dependsOn: key === NO_DEPENDENCY ? undefined : key })}
        />
      )}

      {match && (
        <Field label="Help text for scouts">
          <Textarea
            aria-label="Help text for scouts"
            rows={2}
            value={match.description || ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
