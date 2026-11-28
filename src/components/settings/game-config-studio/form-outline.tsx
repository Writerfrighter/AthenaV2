"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFieldType } from "@/components/forms/match-form-utils";
import { cn } from "@/lib/utils";
import type { PitScoutingFieldDefinition, ScoringDefinition, YearConfig } from "@/lib/types";
import { PALETTE, type PaletteComponentType } from "./component-palette";
import type { SelectedComponentInfo } from "./property-inspector";
import { getSection, type FieldMode } from "./types";
import { heading, hint, panel } from "./fields";

/** The editable sections of each form, in form order. */
export const FORM_SECTIONS = {
  match: [
    ["autonomous", "Auto"],
    ["teleop", "Teleop"],
    ["endgame", "Endgame"],
    ["fouls", "Fouls"],
  ],
  pit: [
    ["autonomous", "Autonomous"],
    ["teleoperated", "Teleoperated"],
    ["driveTeam", "Drive team"],
    ["endgame", "Endgame"],
  ],
} as const;

/** Tab labels short enough for a phone-width tab bar. */
export const TAB_LABELS: Record<string, string> = {
  autonomous: "Auto",
  teleop: "Teleop",
  teleoperated: "Teleop",
  driveTeam: "Drive team",
  endgame: "Endgame",
  fouls: "Fouls",
};

/** A field's type in plain words, as the outline and canvas show it. */
export function fieldKind(mode: FieldMode, definition: ScoringDefinition | PitScoutingFieldDefinition): string {
  if (mode === "match") {
    const type = getFieldType(definition as ScoringDefinition);
    return type === "boolean" ? "Yes / No" : type === "select" ? "Choice" : "Counter";
  }
  return {
    text: "Text",
    number: "Number",
    boolean: "Yes / No",
    select: "One choice",
    multiselect: "Several",
  }[(definition as PitScoutingFieldDefinition).type];
}

/** A menu of field types to add, opened from any "Add field" control. */
export function AddFieldMenu({ mode, onPick, children }: {
  mode: FieldMode;
  onPick: (type: PaletteComponentType) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {PALETTE[mode].map((item) => (
          <DropdownMenuItem key={item.type} onSelect={() => onPick(item.type)} className="items-start gap-3 py-2">
            <item.icon className="mt-0.5 size-4 text-muted-foreground" />
            <span>
              <span className="block text-sm">{item.name}</span>
              <span className={`block ${hint}`}>{item.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The whole form as a list: pick a section or field, reorder, add in place. */
export function FormOutline({ config, mode, activeSection, selected, onSelectSection, onSelectField, onAdd, onReorder }: {
  config: YearConfig;
  mode: FieldMode;
  activeSection: string;
  selected: SelectedComponentInfo | null;
  onSelectSection: (section: string) => void;
  onSelectField: (section: string, fieldKey: string) => void;
  onAdd: (type: PaletteComponentType, section: string) => void;
  onReorder: (section: string, order: string[]) => void;
}) {
  const [dragged, setDragged] = useState<string | null>(null);
  const total = FORM_SECTIONS[mode].reduce((n, [id]) => n + Object.keys(getSection(config, mode, id)).length, 0);

  return (
    <nav aria-label="Form outline" className={`${panel} flex flex-col gap-0.5 p-3`}>
      <div className="flex items-baseline justify-between px-2 pb-2">
        <h2 className={heading}>Form outline</h2>
        <span className={hint}>{total} {mode === "match" ? "fields" : "questions"}</span>
      </div>
      {FORM_SECTIONS[mode].map(([id, name]) => {
        const fields = getSection(config, mode, id);
        const keys = Object.keys(fields);
        const open = id === activeSection;
        const Chevron = open ? ChevronDown : ChevronRight;
        return (
          <div key={id} className="flex flex-col gap-0.5 pb-1">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onSelectSection(id)}
              className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left text-[13px] font-semibold hover:bg-accent"
            >
              <Chevron className="size-4" aria-hidden="true" />
              <span className="flex-1">{name}</span>
              <span className={hint}>{keys.length}</span>
            </button>
            {open && (
              <>
                {keys.map((key, index) => {
                  const on = selected?.section === id && selected.fieldKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      draggable
                      aria-pressed={on}
                      onDragStart={(e) => {
                        setDragged(key);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", key);
                      }}
                      onDragEnd={() => setDragged(null)}
                      onDragOver={(e) => {
                        if (dragged) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!dragged || dragged === key) return;
                        const next = keys.filter((k) => k !== dragged);
                        next.splice(index, 0, dragged);
                        onReorder(id, next);
                        setDragged(null);
                      }}
                      onClick={() => onSelectField(id, key)}
                      className={cn(
                        "flex min-h-10 cursor-grab items-center gap-2 rounded-lg pl-3 pr-2 text-left text-sm active:cursor-grabbing",
                        on ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "hover:bg-accent",
                        dragged === key && "opacity-50",
                      )}
                    >
                      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{fields[key].label}</span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {fieldKind(mode, fields[key])}
                      </span>
                    </button>
                  );
                })}
                <AddFieldMenu mode={mode} onPick={(type) => onAdd(type, id)}>
                  <button
                    type="button"
                    className="flex min-h-10 items-center gap-2 rounded-lg pl-3 text-left text-[13px] text-blue-700 hover:bg-accent dark:text-blue-400"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add {mode === "match" ? "field" : "question"} to {name}
                  </button>
                </AddFieldMenu>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
