import { Suspense } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { getTeamMedia, getEventTeams } from "@/lib/api/tba";
import { TbaTeam } from "@/lib/api/types";
import { getSelectedEvent } from "@/lib/server-event-utils";
import { DynamicTeamList } from "./dynamic-team-list";

export interface TeamWithImages extends TbaTeam {
  images: string[];
}

// Server component to fetch initial teams and their images
async function InitialTeamList() {
  const selectedEvent = await getSelectedEvent();
  
  if (!selectedEvent?.code) {
    return (
      <DynamicTeamList 
        initialEvent={selectedEvent}
        initialTeams={[]}
      />
    );
  }

  try {
    const teams = await getEventTeams(selectedEvent.code);

    if (teams.length === 0) {
      return (
        <DynamicTeamList 
          initialEvent={selectedEvent}
          initialTeams={[]}
        />
      );
    }

    // Fetch images for all teams in parallel
    const teamsWithImages = await Promise.all(
      teams.map(async (team): Promise<TeamWithImages> => {
        try {
          const images = await getTeamMedia(team.team_number);
          return {
            ...team,
            images,
          };
        } catch (error) {
          console.warn(`Failed to fetch images for team ${team.team_number}:`, error);
          return {
            ...team,
            images: [],
          };
        }
      })
    );

    // Sort teams by number
    teamsWithImages.sort((a, b) => a.team_number - b.team_number);

    return (
      <DynamicTeamList 
        initialEvent={selectedEvent}
        initialTeams={teamsWithImages}
      />
    );
  } catch (error) {
    console.error('Error fetching teams:', error);
    return (
      <DynamicTeamList 
        initialEvent={selectedEvent}
        initialTeams={[]}
      />
    );
  }
}

// Loading skeleton component
function TeamListSkeleton() {
  return (
    <>
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Teams grid skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i}>
                <div className="p-4">
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

export default function TeamListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Users className="h-5 w-5" />
            Team Directory
          </CardTitle>
          <CardDescription>
            Browse all teams competing at the selected event
          </CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<TeamListSkeleton />}>
        <InitialTeamList />
      </Suspense>
    </div>
  );
}
