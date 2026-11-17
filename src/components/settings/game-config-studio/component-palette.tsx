"use client";

import React from "react";
import {
  Plus,
  CheckSquare,
  Hash,
  ListFilter,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ScoringDefinition, PitScoutingFieldDefinition } from "@/lib/types";
import { heading, hint, panel } from "./fields";

export type PaletteComponentType =
  | "multi-stepper"
  | "simple-stepper"
  | "boolean-toggle"
  | "select-dropdown"
  | "pit-text"
  | "pit-number"
  | "pit-boolean"
  | "pit-select"
  | "pit-multiselect";

interface PaletteItem {
  type: PaletteComponentType;
  name: string;
  hint: string;
  icon: LucideIcon;
  /** Base key for a field created from this item. */
  key: string;
  definition: ScoringDefinition | PitScoutingFieldDefinition;
}

/** Everything that can be added to a form, and what it starts out as. */
export const PALETTE: Record<"match" | "pit", PaletteItem[]> = {
  match: [
    {
      type: "multi-stepper", name: "Multi-step counter", icon: Hash, key: "stepper",
      hint: "Counter with +1 / +5 / +10 buttons",
      definition: { label: "Game element scored", points: 1, description: "Count of items scored during the match", increments: [1, 5, 10] },
    },
    {
      type: "simple-stepper", name: "Counter", icon: Hash, key: "counter",
      hint: "Single +1 / −1 counter",
      definition: { label: "Scored action", points: 2, description: "Number of completed actions", increments: [1] },
    },
    {
      type: "boolean-toggle", name: "Yes / No", icon: ToggleLeft, key: "toggle",
      hint: "Something the robot did or did not do",
      definition: { label: "Action achieved", points: 0, description: "Whether this happened during the match", type: "boolean" },
    },
    {
      type: "select-dropdown", name: "Choice", icon: ListFilter, key: "select",
      hint: "Pick one option, each worth its own points",
      definition: { label: "Robot end position", description: "Final robot state", type: "select", pointValues: { none: 0, level_1: 10, level_2: 20 } },
    },
  ],
  pit: [
    { type: "pit-text", name: "Text", icon: Type, key: "notes", hint: "Short written answer", definition: { label: "Design notes", type: "text" } },
    { type: "pit-number", name: "Number", icon: Hash, key: "amount", hint: "A measurement or count", definition: { label: "Capacity", type: "number" } },
    { type: "pit-boolean", name: "Yes / No", icon: ToggleLeft, key: "capability", hint: "A capability the robot has", definition: { label: "Has capability", type: "boolean" } },
    { type: "pit-select", name: "Single choice", icon: ListFilter, key: "type", hint: "Pick one option", definition: { label: "Mechanism type", type: "select", options: ["Type A", "Type B", "Other"] } },
    { type: "pit-multiselect", name: "Multiple choice", icon: CheckSquare, key: "features", hint: "Pick any number of options", definition: { label: "Features", type: "multiselect", options: ["Auto align", "Vision tracking"] } },
  ],
};

export function ComponentPalette({ scoutingMode, onAddComponent }: {
  scoutingMode: "match" | "pit";
  onAddComponent: (type: PaletteComponentType) => void;
}) {
  return (
    <div className={panel}>
      <h2 className={heading}>Add a field</h2>
      <p className={`${hint} mb-2`}>Click, or drag onto the form.</p>
      <div className="flex flex-col">
        {PALETTE[scoutingMode].map((item) => (
          <button
            key={item.type}
            type="button"
            draggable
            onDragStart={(e: React.DragEvent) => {
              e.dataTransfer.setData("application/athena-component", item.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onAddComponent(item.type)}
            className="group flex cursor-grab items-center gap-3 border-t py-2.5 text-left active:cursor-grabbing"
          >
            <item.icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{item.name}</span>
              <span className={`block ${hint}`}>{item.hint}</span>
            </span>
            <Plus className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
