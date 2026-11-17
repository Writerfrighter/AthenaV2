"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLastSubmittedMatch } from "@/components/forms/match-form-utils";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useEventConfig } from "@/hooks/use-event-config";
import { useOffline } from "@/hooks/use-offline";
import { useScoutingAssignment } from "@/hooks/use-scouting-assignment";
import { useSession } from "next-auth/react";

const subscribeToLocalStorage = () => () => undefined;

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function percent(current: number, total: number) {
  if (total <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (current / total) * 100)));
}

const h2 = "text-lg font-semibold tracking-tight";
const row = "border-b border-border/60";

export default function Page() {
  const { data: session } = useSession();
  const isGuest = !!session?.guestEvent;
  const { selectedEvent, isLoading: eventLoading } = useEventConfig();
  const { stats, loading, error } = useDashboardStats();
  const { isOnline, pendingCount, syncInProgress } = useOffline();
  const {
    getNextAssignment,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useScoutingAssignment();

  const lastSubmittedMatch = useSyncExternalStore(
    subscribeToLocalStorage,
    () =>
      selectedEvent?.eventCode
        ? getLastSubmittedMatch(selectedEvent.eventCode)
        : 0,
    () => 0,
  );
  // Server render has no clock of the viewer; greet only on the client.
  const title = useSyncExternalStore(subscribeToLocalStorage, greeting, () => "Overview");
  const nextAssignment = getNextAssignment(lastSubmittedMatch);
  const pit = stats.pitScoutingProgress;
  const quals = stats.qualificationProgress;
  const missingPitTeams = Math.max(0, pit.total - pit.current);
  const missingMatches = Math.max(0, quals.total - quals.current);
  const show = (value: string | number) => (loading ? "…" : value);

  if (eventLoading) {
    return (
      <div className="space-y-4" aria-live="polite">
        <div className="h-11 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <span className="sr-only">Loading event overview</span>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center">
        <Card className="w-full border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 text-primary">
              <MapPin className="size-6" />
            </div>
            <CardTitle className="text-xl">Choose an event to begin</CardTitle>
            <CardDescription>
              Select an event from the sidebar to load assignments, scouting
              coverage, and strategy insights.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const nextLine = isGuest
    ? null
    : assignmentsLoading
      ? "loading your schedule…"
      : nextAssignment
        ? `you scout ${nextAssignment.alliance === "red" ? "Red" : "Blue"} ${nextAssignment.position} next, in Q${nextAssignment.matchNumber}`
        : "no scouting assignments left";

  const kpis = [
    { l: "Team ranking", v: stats.ranking > 0 ? `#${stats.ranking}` : "—", s: stats.eventComplete ? "event complete" : "live" },
    { l: "Teams scouted", v: stats.teamsScouted, s: `pit ${pit.current} of ${pit.total}` },
    { l: "Match entries", v: stats.matchesRecorded, s: `${percent(quals.current, quals.total)}% of quals` },
    { l: "Pit coverage", v: `${percent(pit.current, pit.total)}%`, s: `${missingPitTeams} to go` },
    { l: "Data completeness", v: `${stats.dataQuality.toFixed(0)}%`, s: "of expected fields" },
    { l: "Sync", v: isOnline ? "Online" : "Offline", s: syncInProgress ? "syncing…" : `${pendingCount} queued` },
  ];

  const alerts = [
    missingMatches > 0 && { c: "bg-[#DC2626]", t: `${missingMatches} ${missingMatches === 1 ? "match is" : "matches are"} not yet covered`, href: "/dashboard/matchscouting" },
    missingPitTeams > 0 && { c: "bg-[#B7791F]", t: `${missingPitTeams} ${missingPitTeams === 1 ? "team still needs" : "teams still need"} pit scouting`, href: "/dashboard/pitscouting" },
    pendingCount > 0 && { c: "bg-[#B7791F]", t: `${pendingCount} ${pendingCount === 1 ? "entry is" : "entries are"} waiting to sync`, href: "/dashboard/settings" },
  ].filter((a): a is { c: string; t: string; href: string } => !!a);

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-muted-foreground">overview · {selectedEvent.name}</span>
          <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">{title}</h1>
          <span className="text-muted-foreground">
            Quals {show(quals.current)} of {show(quals.total)} scouted
            {nextLine && ` · ${nextLine}`}
          </span>
        </div>
        {!isGuest && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/scout/pitscout">Pit scouting</Link>
            </Button>
            <Button asChild className="h-10 rounded-full px-4">
              <Link href="/scout/matchscout">
                {nextAssignment ? `Start scouting Q${nextAssignment.matchNumber}` : "Start match scouting"}
              </Link>
            </Button>
          </div>
        )}
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 border-y sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.l} className="flex flex-col gap-1.5 py-5 pr-4">
            <span className="text-sm text-muted-foreground">{k.l}</span>
            <span className="text-[34px] font-semibold leading-none tracking-[-0.03em]">{show(k.v)}</span>
            <span className="font-mono text-xs text-muted-foreground">{show(k.s)}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {!isGuest && (
          <section aria-labelledby="next" className="flex flex-col">
            <h2 id="next" className={`${h2} pb-2`}>Up next for you</h2>
            {assignmentsError ? (
              <p className="py-3 text-sm text-destructive">Your assignment could not be loaded. You can still scout manually.</p>
            ) : nextAssignment ? (
              <Link href="/scout/matchscout" className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5 py-3 text-foreground ${row}`}>
                <b className="text-[22px] tracking-[-0.03em]">Q{nextAssignment.matchNumber}</b>
                <span className="text-sm text-muted-foreground">Filled from the event schedule</span>
                <span className={`rounded-full px-2.5 py-1 text-sm text-white ${nextAssignment.alliance === "red" ? "bg-[#C2272D]" : "bg-[#2563EB]"}`}>
                  {nextAssignment.alliance === "red" ? "Red" : "Blue"} {nextAssignment.position}
                </span>
              </Link>
            ) : (
              <p className={`py-3 text-sm text-muted-foreground ${row}`}>
                {assignmentsLoading ? "Loading your schedule…" : "No remaining scheduled assignments."}
              </p>
            )}
            <Link href="/dashboard/schedule" className="pt-3 text-sm text-muted-foreground hover:text-foreground">View schedule →</Link>
          </section>
        )}

        <section aria-labelledby="top" className="flex flex-col">
          <div className="flex items-baseline justify-between pb-1">
            <h2 id="top" className={h2}>Top teams by EPA</h2>
            <Link href="/dashboard/teamlist" className="text-sm text-muted-foreground hover:text-foreground">All teams →</Link>
          </div>
          {loading ? (
            <p className="py-3 text-sm text-muted-foreground">Loading performance data…</p>
          ) : stats.topTeams.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No performance data is available yet.</p>
          ) : (
            <table className="border-collapse text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="border-b py-2.5 pr-2 font-medium">#</th>
                  <th scope="col" className="border-b px-2 py-2.5 font-medium">Team</th>
                  <th scope="col" className="border-b py-2.5 pl-2 text-right font-medium">EPA</th>
                </tr>
              </thead>
              <tbody>
                {stats.topTeams.slice(0, 8).map((team, i) => (
                  <tr key={team.teamNumber}>
                    <td className={`${row} py-2.5 pr-2 font-mono text-muted-foreground`}>{i + 1}</td>
                    <td className={`${row} px-2 py-2.5`}>
                      <Link href={`/dashboard/team/${team.teamNumber}`} className="text-foreground">
                        <b>{team.teamNumber}</b>{" "}
                        {team.name !== `Team ${team.teamNumber}` && <span className="text-muted-foreground">{team.name}</span>}
                      </Link>
                    </td>
                    <td className={`${row} py-2.5 pl-2 text-right font-mono`}>{team.epa.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-labelledby="cov" className="flex flex-col gap-3">
          <h2 id="cov" className={h2}>Scouting coverage</h2>
          <CoverageBar label="Qualification matches" current={quals.current} total={quals.total} loading={loading} />
          <CoverageBar label="Pit scouting" current={pit.current} total={pit.total} loading={loading} />
          <span className="pt-2 text-sm text-muted-foreground">Needs attention</span>
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking event coverage…</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm">Scouting coverage is up to date.</p>
          ) : (
            alerts.map((a) => (
              <Link key={a.t} href={a.href} className="grid grid-cols-[9px_minmax(0,1fr)] items-baseline gap-2.5 py-1 text-foreground">
                <span className={`size-2 rounded-full ${a.c}`} aria-hidden="true" />
                <span>{a.t}</span>
              </Link>
            ))
          )}
          {error && <p className="text-sm text-destructive">Some overview data could not be refreshed.</p>}
        </section>
      </div>

      <section aria-labelledby="rec" className="flex flex-col">
        <div className="flex items-baseline justify-between pb-1.5">
          <h2 id="rec" className={h2}>Recent entries</h2>
          <Link href="/dashboard/matchscouting" className="text-sm text-muted-foreground hover:text-foreground">All match entries →</Link>
        </div>
        {loading ? (
          <p className="py-3 text-sm text-muted-foreground">Loading recent entries…</p>
        ) : stats.recentActivity.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">No entries have been recorded yet.</p>
        ) : (
          stats.recentActivity.slice(0, 6).map((item, index) => (
            <div key={`${item.timestamp.toISOString()}-${index}`} className={`grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-3.5 py-2.5 ${row}`}>
              <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
              <span>{item.message}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {item.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function CoverageBar({ label, current, total, loading }: { label: string; current: number; total: number; loading: boolean }) {
  const done = loading ? 0 : percent(current, total);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{loading ? "…" : `${current} of ${total}`}</span>
      </div>
      <div role="img" aria-label={`${label}: ${done}% covered`} className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div className="bg-chart-1" style={{ flex: `${done} 1 0` }} />
        <div className="bg-border" style={{ flex: `${100 - done} 1 0` }} />
      </div>
    </div>
  );
}
