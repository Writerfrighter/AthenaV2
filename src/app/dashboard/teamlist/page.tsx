import { TeamCard } from "@/components/team-card";
import { getEventTeams, getTeamMedia } from "../../../../lib/api/tba";
import { TbaMedia, TbaTeam } from "../../../../lib/api/types";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {sortedData.map((team) => (
        <TeamCard key={team.team_number} team={team} />
      ))}
    </div>
  );
}
