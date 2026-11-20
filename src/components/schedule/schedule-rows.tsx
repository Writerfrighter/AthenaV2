"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserWithPartners, MatchAssignment } from "@/lib/schedule/assignments";
import type { MatchScheduleTeam } from "@/app/api/events/[eventCode]/schedule/route";

export const MatchAssignmentRow = React.memo(
  ({
    match,
    scoutsPerAlliance,
    teams,
    getAvailableUsersForMatchSlot,
    setLocalMatchScout,
  }: {
    match: MatchAssignment;
    teams?: MatchScheduleTeam[];
    scoutsPerAlliance: number;
    getAvailableUsersForMatchSlot: (
      match: MatchAssignment,
      alliance: "red" | "blue",
      position: number,
    ) => UserWithPartners[];
    setLocalMatchScout: (
      matchNumber: number,
      alliance: "red" | "blue",
      position: number,
      scoutId: string | null,
    ) => void;
  }) => {
    const scouts = [...match.redScouts.slice(0, scoutsPerAlliance), ...match.blueScouts.slice(0, scoutsPerAlliance)];
    const filled = scouts.filter(Boolean).length;
    const teamsOf = (alliance: "red" | "blue") =>
      (teams ?? []).filter((t) => t.alliance === alliance).sort((x, y) => x.position - y.position).map((t) => t.teamNumber).join(" ") || "—";
    return (
      <div className="border-b border-border/60 py-3">
        <div className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 font-mono text-sm tabular-nums">
          <span className="font-semibold">Q{match.matchNumber}</span>
          <span className="truncate text-[#C2272D]">{teamsOf("red")}</span>
          <span className="truncate text-[#2563EB]">{teamsOf("blue")}</span>
          <span role="img" aria-label={`${filled} of ${scouts.length} positions filled`} className="flex gap-[3px]">
            {scouts.map((scout, i) => (
              <span key={i} className={`size-3.5 rounded ${scout ? "bg-foreground" : "bg-border"}`} />
            ))}
          </span>
        </div>
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-2">
          {(["red", "blue"] as const).map((alliance) => (
            <div
              key={`${match.matchNumber}-${alliance}`}
              className={`grid min-w-0 grid-cols-1 gap-2 border-l-2 pl-2 sm:grid-cols-3 ${alliance === "red" ? "border-[#E5484D]" : "border-[#3B7BF6]"}`}
            >
              {Array.from({ length: scoutsPerAlliance }, (_, position) => {
                const slotValue =
                  alliance === "red"
                    ? match.redScouts[position]
                    : match.blueScouts[position];
                const availableUsers = getAvailableUsersForMatchSlot(
                  match,
                  alliance,
                  position,
                );
                return (
                  <Select
                    key={`${match.matchNumber}-${alliance}-${position}`}
                    value={slotValue ?? "none"}
                    onValueChange={(value) =>
                      setLocalMatchScout(
                        match.matchNumber,
                        alliance,
                        position,
                        value === "none" ? null : value,
                      )
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`Match ${match.matchNumber}, ${alliance} position ${position + 1}`}
                      className="w-full min-w-0 rounded-full bg-card text-xs"
                    >
                      <span className="shrink-0 text-muted-foreground">{alliance === "red" ? "R" : "B"}{position + 1}</span>
                      <SelectValue placeholder="Open" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Open</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
MatchAssignmentRow.displayName = "MatchAssignmentRow";

export const ActiveScoutCheckbox = React.memo(
  ({
    scout,
    isActive,
    onToggle,
  }: {
    scout: UserWithPartners;
    isActive: boolean;
    onToggle: (scoutId: string, checked: boolean) => void;
  }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`active-${scout.id}`}
        checked={isActive}
        onCheckedChange={(checked) => onToggle(scout.id, checked === true)}
      />
      <label
        htmlFor={`active-${scout.id}`}
        className="text-sm font-medium cursor-pointer"
      >
        {scout.name}
      </label>
    </div>
  ),
);
ActiveScoutCheckbox.displayName = "ActiveScoutCheckbox";

