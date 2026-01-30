"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, List } from "lucide-react";
import { useEventConfig } from "@/hooks/use-event-config";
import { useGameConfig } from "@/hooks/use-game-config";
import { PicklistConfig } from "@/components/picklist/picklist-config";
import { DraggablePicklist } from "@/components/picklist/draggable-picklist";

export default function PicklistPage() {
  const { selectedEvent } = useEventConfig();
  const { currentYear, competitionType } = useGameConfig();
  const [viewMode, setViewMode] = useState<'basic' | 'draggable'>('basic');

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Picklist</h1>
          <p className="text-muted-foreground">
            {competitionType === 'FRC' 
              ? 'Manage Pick 1 and Pick 2 lists with drag-and-drop ranking.'
              : 'Create and manage your alliance selection preferences.'
            }
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{selectedEvent.name}</Badge>
            <Badge variant="secondary">{competitionType}</Badge>
            <Badge>{currentYear}</Badge>
          </div>
        </div>

        {/* View Mode Toggle (FRC only) */}
        {competitionType === 'FRC' && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'basic' ? 'default' : 'outline'}
              onClick={() => setViewMode('basic')}
              size="sm"
            >
              <List className="h-4 w-4 mr-2" />
              Standard View
            </Button>
            <Button
              variant={viewMode === 'draggable' ? 'default' : 'outline'}
              onClick={() => setViewMode('draggable')}
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Drag & Drop
            </Button>
          </div>
        )}
      </div>

      {/* Content based on competition type and view mode */}
      {competitionType === 'FRC' ? (
        viewMode === 'draggable' ? (
          <DraggablePicklist
            eventCode={selectedEvent.code}
            year={currentYear}
            competitionType="FRC"
          />
        ) : (
          <PicklistConfig
            eventCode={selectedEvent.code}
            year={currentYear}
            competitionType="FRC"
          />
        )
      ) : (
        <PicklistConfig
          eventCode={selectedEvent.code}
          year={currentYear}
          competitionType="FTC"
        />
      )}
    </div>
  );
}
