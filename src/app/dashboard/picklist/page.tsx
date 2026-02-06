"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { useEventConfig } from "@/hooks/use-event-config";
import { useGameConfig } from "@/hooks/use-game-config";
import { DraggablePicklist } from "@/components/picklist/draggable-picklist";

export default function PicklistPage() {
  const { selectedEvent } = useEventConfig();
  const { currentYear, competitionType } = useGameConfig();

  // Show message if no event selected
  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Picklist</h1>
          <p className="text-muted-foreground">
            Create and manage your alliance selection preferences with drag-and-drop ranking.
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Event Selected</h3>
                <p className="text-muted-foreground">
                  Please select an event from the event selector to view and manage picklists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Picklist</h1>
        <p className="text-muted-foreground">
          {competitionType === 'FRC' 
            ? 'Drag and drop teams between Pick 1, Pick 2, and Unlisted.'
            : 'Create and manage your alliance selection preferences.'
          }
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{selectedEvent.name}</Badge>
          <Badge variant="secondary">{competitionType}</Badge>
          <Badge>{currentYear}</Badge>
        </div>
      </div>

      {/* Always show draggable picklist */}
      <DraggablePicklist
        eventCode={selectedEvent.code}
        year={currentYear}
        competitionType={competitionType}
      />
    </div>
  );
}
