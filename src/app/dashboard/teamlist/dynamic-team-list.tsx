'use client';

import { useEffect, useState } from 'react';
import { TeamCard } from "@/components/team-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trophy, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useSelectedEvent } from "@/hooks/use-event-config";
import { TeamWithImages } from "@/lib/shared-types";
import { TeamCardSkeleton } from '@/components/team-card-skeleton';

interface DynamicTeamListProps {
  initialEvent: {
    name: string;
    number: string;
    code: string;
  };
  initialTeams: TeamWithImages[];
}

export function DynamicTeamList({ initialEvent, initialTeams }: DynamicTeamListProps) {
  const selectedEvent = useSelectedEvent();
  const [teams, setTeams] = useState<TeamWithImages[]>(initialTeams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update teams when event changes
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedEvent?.code) {
        setTeams([]);
        return;
      }

      // If the event hasn't changed, don't refetch
      if (selectedEvent.code === initialEvent.code && teams.length > 0) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use API route instead of direct TBA calls to avoid CORS
        const response = await fetch(`/api/events/${selectedEvent.code}/teams`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }
        
        const teamsWithImages = await response.json();

        if (teamsWithImages.length === 0) {
          setTeams([]);
          return;
        }

        setTeams(teamsWithImages);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams for this event');
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [selectedEvent?.code, initialEvent.code, teams.length]);

  const currentEvent = selectedEvent || initialEvent;

  if (!currentEvent?.code) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No event selected. Please select an event from the sidebar to view teams.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{teams.length}</p>
                )}
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="text-sm font-semibold">{currentEvent.name}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {currentEvent.code}
                </Badge>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="text-sm font-semibold">{(currentEvent as { number: string }).number}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Teams ({teams.length})
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </CardTitle>
          <CardDescription>
            Click on any team to view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No teams found for this event.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {teams.map((team) => (
                <TeamCard key={team.team_number} team={team} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
