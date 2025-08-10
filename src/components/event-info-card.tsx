'use client';

import { useSelectedEvent } from "@/hooks/use-event-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EventInfoCard() {
  const selectedEvent = useSelectedEvent();

  if (!selectedEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No event selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Event Information
          <Badge variant="secondary">{selectedEvent.number}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Event Name:</strong>
            <p className="text-sm text-muted-foreground">{selectedEvent.name}</p>
          </div>
          <div>
            <strong>Event Code:</strong>
            <p className="text-sm text-muted-foreground">{selectedEvent.number}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
