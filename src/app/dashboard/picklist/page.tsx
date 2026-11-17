"use client";

import { useEventConfig } from "@/hooks/use-event-config";
import { useGameConfig } from "@/hooks/use-game-config";
import { DraggablePicklist } from "@/components/picklist/draggable-picklist";

export default function PicklistPage() {
  const { selectedEvent } = useEventConfig();
  const { currentYear, competitionType } = useGameConfig();

  if (!selectedEvent) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground">picklist</span>
        <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">Picklist</h1>
        <p className="text-muted-foreground">
          Select an event from the event selector to view and manage picklists.
        </p>
      </div>
    );
  }

  return (
    <DraggablePicklist
      eventCode={selectedEvent.eventCode}
      year={currentYear}
      competitionType={competitionType}
    />
  );
}
