import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamMedia, getEventTeams } from "@/lib/api/tba";
import { getSelectedEvent } from "@/lib/server-event-utils";
import { DynamicTeamList } from "./dynamic-team-list";
import type { TeamWithImages } from "@/lib/types";
import { auth } from "@/lib/auth/config";

// Server component to fetch initial teams and their images
async function InitialTeamList() {
  const session = await auth();
  if (session?.guestEvent) {
    const grant = session.guestEvent;
    // The client uses the unified FRC/FTC API; never seed guest pages from
    // a previous signed-in user's selectedEvent cookie.
    return <DynamicTeamList initialEvent={{ name: grant.name, eventCode: grant.eventCode, region: `${grant.competitionType} ${grant.year}` }} initialTeams={[]} />;
  }
  const selectedEvent = await getSelectedEvent();

  if (!selectedEvent?.eventCode) {
    return <DynamicTeamList initialEvent={selectedEvent} initialTeams={[]} />;
  }

  const teams = await loadTeamsWithImages(selectedEvent.eventCode);

  return <DynamicTeamList initialEvent={selectedEvent} initialTeams={teams} />;
}

async function loadTeamsWithImages(
  eventCode: string,
): Promise<TeamWithImages[]> {
  try {
    const teams = await getEventTeams(eventCode);
    // The event code starts with the year, e.g. "2024miket"
    const year = Number(eventCode.slice(0, 4));

    // Fetch images for all teams in parallel
    const teamsWithImages = await Promise.all(
      teams.map(async (team): Promise<TeamWithImages> => {
        try {
          const images = await getTeamMedia(team.team_number, year);
          return { ...team, images };
        } catch (error) {
          console.warn(
            `Failed to fetch images for team ${team.team_number}:`,
            error,
          );
          return { ...team, images: [] };
        }
      }),
    );

    // Sort teams by number
    return teamsWithImages.sort((a, b) => a.team_number - b.team_number);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

function TeamListSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </>
  );
}

export default function TeamListPage() {
  return (
    <div className="flex flex-col gap-9">
      <Suspense fallback={<TeamListSkeleton />}>
        <InitialTeamList />
      </Suspense>
    </div>
  );
}
