"use client";

import { useMatchScheduleTeams } from "@/hooks/use-match-schedule-teams";
import { Button } from "@/components/ui/button";

export function GuestMatchSchedule() {
  const { scheduleData, isLoading, error, refreshSchedule } = useMatchScheduleTeams();
  const matches = scheduleData?.matches ?? [];
  const teamsOf = (teams: (typeof matches)[number]["teams"], alliance: "red" | "blue") =>
    teams.filter((team) => team.alliance === alliance).sort((a, b) => a.position - b.position).map((team) => team.teamNumber).join(" ");
  const th = "border-b px-2 py-2.5 font-medium";
  const td = "border-b border-border/60 px-2 py-3";

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs text-muted-foreground">schedule · match list</span>
          <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">Schedule</h1>
          <span className="text-muted-foreground">
            {matches.length ? `${matches.length} matches` : "Event match schedule and alliance teams"}
          </span>
        </div>
        <Button variant="outline" className="h-10 rounded-full px-4" onClick={refreshSchedule}>Refresh</Button>
      </header>
      {isLoading && <p className="text-muted-foreground">Loading schedule…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {!isLoading && !error && !matches.length && <p className="text-muted-foreground">No match schedule available yet.</p>}
      {matches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className={`${th} pl-0`}>Match</th>
                <th scope="col" className={th}>Red</th>
                <th scope="col" className={`${th} pr-0`}>Blue</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={`${match.compLevel}:${match.matchNumber}`}>
                  <td className={`${td} pl-0 font-mono font-semibold`}>
                    {match.compLevel === "qm" || !match.compLevel ? "Q" : match.compLevel.toUpperCase()}{match.matchNumber}
                  </td>
                  <td className={`${td} font-mono text-[#C2272D]`}>{teamsOf(match.teams, "red")}</td>
                  <td className={`${td} pr-0 font-mono text-[#2563EB]`}>{teamsOf(match.teams, "blue")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
