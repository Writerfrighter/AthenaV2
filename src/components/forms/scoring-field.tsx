"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, CheckCircle } from "lucide-react";
import { getFieldType } from "./match-form-utils";
import type { ScoringDefinition } from "@/lib/types";

interface ScoringFieldProps {
  section: "autonomous" | "teleop" | "endgame" | "fouls";
  fieldKey: string;
  fieldConfig: ScoringDefinition;
  currentValue: number | string | boolean;
  onValueChange: (
    section: string,
    field: string,
    value: number | string | boolean,
  ) => void;
  onNumberChange: (section: string, field: string, increment: boolean) => void;
}

export function ScoringField({
  section,
  fieldKey,
  fieldConfig,
  currentValue,
  onValueChange,
  onNumberChange,
}: ScoringFieldProps) {
  const fieldType = getFieldType(fieldConfig);

  switch (fieldType) {
    case "boolean":
      return (
        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">{fieldConfig.label}</Label>
          <div className="flex items-center justify-center">
            <Button
              variant={Boolean(currentValue) ? "default" : "outline"}
              size="lg"
              onClick={() =>
                onValueChange(section, fieldKey, !Boolean(currentValue))
              }
              aria-pressed={Boolean(currentValue)}
              className="h-14 w-full rounded-xl font-semibold"
            >
              {Boolean(currentValue) ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Yes
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-5 w-5" />
                  No
                </>
              )}
            </Button>
          </div>
          {fieldConfig.points ? (
            <div className="text-xs text-center text-muted-foreground">
              {fieldConfig.points} points
            </div>
          ) : null}
        </div>
      );

    case "select":
      const selectValue = String(
        currentValue || Object.keys(fieldConfig.pointValues || {})[0],
      );
      return (
        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground">{fieldConfig.label}</Label>
          <div className="flex items-center justify-center">
            <Select
              value={selectValue}
              onValueChange={(value) => onValueChange(section, fieldKey, value)}
            >
              <SelectTrigger aria-label={fieldConfig.label} className="!h-14 w-full rounded-xl text-base font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fieldConfig.pointValues || {}).map(
                  ([option, points]) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="text-base py-3"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </span>
                        {Number(points) !== 0 && (
                          <span className="text-muted-foreground ml-4 text-sm">
                            ({String(points)} pts)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          {Object.values(fieldConfig.pointValues || {}).some(
            (p) => Number(p) !== 0,
          ) && (
            <div className="text-xs text-center text-muted-foreground">
              Points vary by selection
            </div>
          )}
        </div>
      );

    case "number":
    default:
      const numValue = Number(currentValue) || 0;
      // Design counter: [−] [value] then filled steps (+1 green, +5 dark, +10 grey).
      const steps =
        fieldConfig.increments && fieldConfig.increments.length > 0
          ? fieldConfig.increments
          : [1];
      const stepColors = ["bg-primary text-primary-foreground", "bg-[#3D4146] text-white", "bg-[#6B6F75] text-white"];
      const setValue = (amount: number) =>
        onValueChange(section, fieldKey, Math.max(0, numValue + amount));

      return (
        <div className="flex flex-col gap-3 sm:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={`${section}-${fieldKey}`} className="text-base font-semibold text-foreground">{fieldConfig.label}</Label>
            {fieldConfig.points ? (
              <span className="text-xs text-muted-foreground">{fieldConfig.points} pts each</span>
            ) : null}
          </div>
          <div
            className="grid items-center gap-2"
            style={{ gridTemplateColumns: `64px minmax(72px,1fr) repeat(${steps.length}, minmax(56px, 72px))` }}
          >
            <Button
              type="button"
              variant="outline"
              aria-label={`Subtract one from ${fieldConfig.label}`}
              onClick={() => (fieldConfig.increments?.length ? setValue(-1) : onNumberChange(section, fieldKey, false))}
              className="h-14 rounded-xl text-[22px]"
            >
              −
            </Button>
            <Input
              id={`${section}-${fieldKey}`}
              type="number"
              min={0}
              value={numValue}
              onChange={(e) =>
                onValueChange(
                  section,
                  fieldKey,
                  Math.max(0, Number(e.target.value)),
                )
              }
              className="hide-spinners h-14 border-0 bg-transparent text-center !text-[44px] font-bold tracking-[-0.03em] tabular-nums shadow-none focus-visible:ring-2"
            />
            {steps.map((inc, i) => (
              <Button
                key={`add-${inc}`}
                type="button"
                onClick={() => (steps.length === 1 && inc === 1 && !fieldConfig.increments?.length ? onNumberChange(section, fieldKey, true) : setValue(inc))}
                className={`h-14 rounded-xl text-lg font-semibold hover:opacity-90 ${stepColors[Math.min(i, stepColors.length - 1)]}`}
              >
                +{inc}
              </Button>
            ))}
          </div>
        </div>
      );
  }
}
