"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useSelectedEvent } from "@/hooks/use-event-config";
import { TeamWithImages } from "@/lib/types/team/team";
import { Event } from "@/lib/types";
import { useGameConfig } from "@/hooks/use-game-config";

interface DynamicTeamListProps {
  initialEvent: Event;
  initialTeams: TeamWithImages[];
}

type TeamStat = { teamNumber: number; matchesPlayed: number; totalEPA: number; recentScores?: number[] };
type EventStats = { totalMatches: number; totalPitScouts: number; teamStats: TeamStat[] };

const cell = "px-2 py-2.5 border-b border-border/60 whitespace-nowrap";
const head = "px-2 py-2.5 border-b font-medium whitespace-nowrap";

/** Per-match score trend (oldest to newest), scaled to its own range like the design's "Last 6". */
function Sparkline({ values }: { values?: number[] }) {
  if (!values || values.length < 2) return <span className="text-muted-foreground">—</span>;
  const lo = Math.min(...values);
  const range = Math.max(...values) - lo || 1;
  const step = 70 / (values.length - 1);
  const points = values.map((v, i) => `${(i * step + 1).toFixed(1)},${(20 - ((v - lo) / range) * 18).toFixed(1)}`).join(" ");
  return (
    <svg width="72" height="22" viewBox="0 0 72 22" role="img" aria-label={`Last ${values.length} match scores: ${values.map((v) => v.toFixed(0)).join(", ")}`}>
      <polyline points={points} fill="none" stroke="var(--chart-1)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Thumb({ src, className }: { src?: string; className: string }) {
  return (
    <span className={`relative block flex-none overflow-hidden bg-muted ${className}`}>
      {src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}
    </span>
  );
}

export function DynamicTeamList({
  initialEvent,
  initialTeams,
}: DynamicTeamListProps) {
  const selectedEvent = useSelectedEvent();
  const { competitionType, currentYear } = useGameConfig();
  const [teams, setTeams] = useState<TeamWithImages[]>(initialTeams);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update teams when event changes
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedEvent?.eventCode) {
        setTeams([]);
        return;
      }

      // If the event hasn't changed, don't refetch
      if (
        selectedEvent.eventCode === initialEvent.eventCode &&
        teams.length > 0
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use API route instead of direct TBA calls to avoid CORS
        const response = await fetch(
          `/api/events/${encodeURIComponent(selectedEvent.eventCode)}/teams?competitionType=${competitionType}&year=${currentYear}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }

        setTeams(await response.json());
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams for this event");
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [
    selectedEvent?.eventCode,
    initialEvent.eventCode,
    teams.length,
    competitionType,
    currentYear,
  ]);

  const eventCode = (selectedEvent || initialEvent)?.eventCode;

  // Scouting stats are optional: the table still works on team data alone.
  useEffect(() => {
    if (!eventCode) return;
    const params = new URLSearchParams({ eventCode, competitionType, year: String(currentYear) });
    fetch(`/api/scouting/analysis/stats?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [eventCode, competitionType, currentYear]);

  const rows = useMemo(() => {
    const byTeam = new Map<number, TeamStat>(stats?.teamStats.map((s) => [s.teamNumber, s]));
    return teams
      .map((team) => ({ team, stat: byTeam.get(team.team_number) }))
      .sort((a, b) => (b.stat?.totalEPA ?? -1) - (a.stat?.totalEPA ?? -1) || a.team.team_number - b.team.team_number)
      .map((row, i) => ({ ...row, rank: row.stat ? i + 1 : null }));
  }, [teams, stats]);

  const scored = rows.filter((r) => r.stat);
  const avgEPA = scored.length ? scored.reduce((sum, r) => sum + r.stat!.totalEPA, 0) / scored.length : null;
  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter(({ team }) => `${team.team_number} ${team.nickname} ${team.city}`.toLowerCase().includes(q))
    : rows;

  const currentEvent = selectedEvent || initialEvent;

  if (!currentEvent?.eventCode) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No event selected. Please select an event from the sidebar to view
          teams.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-muted-foreground">teams · {currentEvent.name}</span>
          <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">Teams</h1>
          <span className="text-muted-foreground">
            {teams.length} at this event
            {stats && ` · ${stats.totalMatches} matches scouted · ${stats.totalPitScouts} pit entries`}
            {avgEPA !== null && ` · event avg EPA ${avgEPA.toFixed(1)}`}
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Search
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Team number or name…"
            className="w-56 rounded-full bg-card"
          />
        </label>
      </header>

      {scored.length > 0 && (
        <section aria-label="Highlights" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {scored.slice(0, 4).map(({ team, stat, rank }) => (
            <Link
              key={team.team_number}
              href={`/dashboard/team/${team.team_number}`}
              className="flex flex-col gap-2.5 text-foreground"
            >
              <span className="relative">
                <Thumb src={team.images[0]} className="aspect-video w-full rounded-xl" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#111214]">
                  #{rank} EPA
                </span>
              </span>
              <span className="flex items-baseline justify-between">
                <span className="text-[26px] font-bold tracking-[-0.03em]">{team.team_number}</span>
                <span className="font-mono text-sm">{stat!.totalEPA.toFixed(1)}</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      <section aria-labelledby="all-teams" className="flex flex-col gap-3">
        <h2 id="all-teams" className="text-lg font-semibold tracking-tight">All teams</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className={`${head} pl-0`}>Rank</th>
                <th scope="col" className={head}>Team</th>
                <th scope="col" className={head}>Location</th>
                <th scope="col" className={`${head} text-right`}>EPA ↓</th>
                <th scope="col" className={head}>Last 6</th>
                <th scope="col" className={`${head} text-right`}>Scouted</th>
                <th scope="col" className={`${head} pr-0 text-right`}>Rookie year</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className={`${cell} px-0`}><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                : visible.map(({ team, stat, rank }) => (
                    <tr key={team.team_number}>
                      <td className={`${cell} pl-0 font-mono text-muted-foreground`}>{rank ?? "—"}</td>
                      <td className={cell}>
                        <Link href={`/dashboard/team/${team.team_number}`} className="flex items-center gap-2.5 text-foreground">
                          <Thumb src={team.images[0]} className="h-[33px] w-11 rounded-md" />
                          <b className="text-[17px] tracking-tight">{team.team_number}</b>
                          <span className="truncate text-muted-foreground">{team.nickname}</span>
                        </Link>
                      </td>
                      <td className={`${cell} text-muted-foreground`}>{[team.city, team.state_prov].filter(Boolean).join(", ")}</td>
                      <td className={`${cell} text-right font-mono font-medium`}>{stat ? stat.totalEPA.toFixed(1) : "—"}</td>
                      <td className={cell}><Sparkline values={stat?.recentScores} /></td>
                      <td className={`${cell} text-right font-mono text-muted-foreground`}>{stat?.matchesPlayed ?? 0}</td>
                      <td className={`${cell} pr-0 text-right font-mono text-muted-foreground`}>{team.rookie_year || "—"}</td>
                    </tr>
                  ))}
            </tbody>
            {avgEPA !== null && (
              <tfoot>
                <tr className="text-muted-foreground">
                  <td colSpan={3} className="py-2.5">Event average</td>
                  <td className="px-2 py-2.5 text-right font-mono">{avgEPA.toFixed(1)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && visible.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {teams.length ? "No teams match your search." : "No teams found for this event."}
          </p>
        )}
      </section>
    </>
  );
}
