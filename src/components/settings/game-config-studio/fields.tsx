"use client";

import type { MouseEvent, ReactNode } from "react";
import { ChevronDown, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shared look for the studio's side panels. */
export const panel = "rounded-xl border bg-card p-4";
export const heading = "text-sm font-semibold";
export const hint = "text-xs text-muted-foreground";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function TextField({ label, value, onChange, mono, placeholder }: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        aria-label={label}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={mono ? "font-mono" : undefined}
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, placeholder }: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        aria-label={label}
        type="number"
        step="any"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </label>
  );
}

export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | undefined;
  /** Either plain values or [value, display label] pairs. */
  options: readonly (T | readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value ?? ""} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const [key, text] = typeof option === "string" ? [option, option] : option;
            return <SelectItem key={key} value={key}>{text}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/** One entry of an editable list: a rule above, a title and a remove button. */
export function Item({ title, onRemove, children }: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${title}`}
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      {children}
    </div>
  );
}

/** A row of mutually exclusive choices, shown all at once. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: {
  label: string;
  value: T | undefined;
  options: readonly (readonly [T, string] | readonly [T, string, LucideIcon])[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-0.5 rounded-lg bg-muted p-[3px]", className)}>
      {options.map(([key, text, Icon]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors",
            value === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          {text}
        </button>
      ))}
    </div>
  );
}

/** A collapsible settings panel. */
export function Disclosure({ title, defaultOpen, children, className }: {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={cn(panel, "group", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

/** Stops links in a live preview from navigating away from unsaved edits. */
export function blockLinks(event: MouseEvent) {
  if ((event.target as HTMLElement).closest("a")) event.preventDefault();
}
