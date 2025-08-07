import { TeamCard } from "@/components/team-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventTeams, getTeamMedia } from "../../../../lib/api/tba";
import { TbaMedia, TbaTeam } from "../../../../lib/api/types";
import { Users, Trophy, MapPin } from "lucide-react";

export interface TeamInfoImages extends TbaTeam{
  images: string[]; // URLs
}

export default async function Page() {
  const teams = await getEventTeams("2025pncmp");

  interface TeamWithImages extends TbaTeam {
    images: string[];
  }

  const data: TeamWithImages[] = await Promise.all(
    teams.map(async (team: TbaTeam): Promise<TeamWithImages> => ({
      ...team,
      images: await getTeamMedia(team.team_number),
    }))
  );
  const sortedData = data.sort((a, b) => a.team_number - b.team_number);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Directory
          </CardTitle>
          <CardDescription>
            Browse all teams competing at the current event
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Header */}
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Users className="h-5 w-5" />
            Team Directory
          </CardTitle>
          <CardDescription>
            Browse all teams competing at the current event
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold">{sortedData.length}</p>
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
                <p className="text-sm font-semibold">PNW Championships</p>
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
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm font-semibold">Pacific Northwest</p>
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
          <CardTitle>
            Teams ({sortedData.length})
          </CardTitle>
          <CardDescription>
            Click on any team to view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedData.map((team) => (
              <TeamCard key={team.team_number} team={team} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
