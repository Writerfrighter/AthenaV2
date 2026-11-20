"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { teamApi } from "@/lib/api/database-client";
import type { TeamData } from "@/lib/types";
import { useMatchScheduleTeams } from "@/hooks/use-match-schedule-teams";
import { useGameConfig } from "@/hooks/use-game-config";
import { useAsyncData } from "@/hooks/use-async-data";
import { useSelectedEvent } from "@/hooks/use-event-config";
import { calculateEPA } from "@/lib/statistics";
import { estimateWinProbability } from "@/lib/matchup-probability";
import MatchupAlliancePanel from "./matchup-alliance-panel";
import { NoteDot, NotesBar } from "@/components/note-sentiment";

type MatchType = "qualification" | "playoff";

type TeamEpaMap = Record<
      number,
      {
        epa: number;
        auto: number;
        teleop: number;
        endgame: number;
        matchCount: number;
        scores: number[];
        notes: { match: number; text: string }[];
      } | null
    >;

const NO_EPA_DATA: TeamEpaMap = {};

export default function MatchupPage() {
  const { currentYear, competitionType, getCurrentYearConfig } = useGameConfig();
  const yearConfig = getCurrentYearConfig();
  const selectedEvent = useSelectedEvent();
  const [matchType, setMatchType] = useState<MatchType>("qualification");
  const isPlayoff = matchType === "playoff";
  const {
    scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
    hasScheduleData,
    maxMatchNumber,
    getTeamsForMatch,
    refreshSchedule,
  } = useMatchScheduleTeams(isPlayoff ? "playoff" : "qual");

  const [matchNumber, setMatchNumber] = useState<number>(1);
  const [matchNumberInput, setMatchNumberInput] = useState("1");
  const [manualTeams, setManualTeams] = useState<{
    red: string[];
    blue: string[];
  }>({
    red: ["", "", ""],
    blue: ["", "", ""],
  });
  const [useManual, setUseManual] = useState(false);

  // Get teams for the current match from schedule
  const scheduleTeams = hasScheduleData ? getTeamsForMatch(matchNumber) : [];
  const redTeams = scheduleTeams
    .filter((t) => t.alliance === "red")
    .sort((a, b) => a.position - b.position);
  const blueTeams = scheduleTeams
    .filter((t) => t.alliance === "blue")
    .sort((a, b) => a.position - b.position);

  // Determine which teams to display
  const displayRedTeams: number[] = useManual
    ? manualTeams.red.map((t) => parseInt(t)).filter((n) => !isNaN(n) && n > 0)
    : redTeams.map((t) => t.teamNumber);
  const displayBlueTeams: number[] = useManual
    ? manualTeams.blue.map((t) => parseInt(t)).filter((n) => !isNaN(n) && n > 0)
    : blueTeams.map((t) => t.teamNumber);

  const hasTeams = displayRedTeams.length > 0 || displayBlueTeams.length > 0;

  // FTC has 2 robots per alliance, FRC has 3
  const allianceSize = competitionType === "FTC" ? 2 : 3;

  // Stable key to detect when displayed teams change
  const allTeamsKey = useMemo(
    () => [...displayRedTeams, ...displayBlueTeams].sort().join(","),
    [displayRedTeams, displayBlueTeams],
  );
  const epaRequestKey = `${competitionType}:${currentYear}:${selectedEvent?.eventCode ?? ""}:${allTeamsKey}`;

  // Fetch EPA data for all displayed teams
  const { data: fetchedEpaMap, loading: epaLoading } = useAsyncData<TeamEpaMap>(
    hasTeams ? epaRequestKey : null,
    async () => {
      const allTeams = [...displayRedTeams, ...displayBlueTeams];
      const results = await Promise.all(
        allTeams.map(async (teamNum) => {
          try {
            const data: TeamData = await teamApi.getTeamData(
              teamNum,
              currentYear,
              selectedEvent?.eventCode,
              competitionType,
            );
            // API returns autoEPA/teleopEPA/endgameEPA (not auto/teleop/endgame)
            const epa = data.epa as Record<string, number> | null;
            const scores = yearConfig && epa
              ? data.matchEntries.map((match) => calculateEPA([match], currentYear, yearConfig).totalEPA)
              : [];
            return {
              teamNum,
              epa: epa?.totalEPA ?? 0,
              auto: epa?.autoEPA ?? 0,
              teleop: epa?.teleopEPA ?? 0,
              endgame: epa?.endgameEPA ?? 0,
              matchCount: data.matchCount ?? 0,
              scores,
              notes: data.matchEntries
                .filter((match) => match.notes?.trim())
                .map((match) => ({ match: match.matchNumber, text: match.notes.trim() })),
            };
          } catch {
            return {
              teamNum,
              epa: 0,
              auto: 0,
              teleop: 0,
              endgame: 0,
              matchCount: 0,
              scores: [],
              notes: [],
            };
          }
        }),
      );
      const map: TeamEpaMap = {};
      results.forEach((r) => {
        map[r.teamNum] = {
          epa: r.epa,
          auto: r.auto,
          teleop: r.teleop,
          endgame: r.endgame,
          matchCount: r.matchCount,
          scores: r.scores,
          notes: r.notes,
        };
      });
      return map;
    },
  );
  const teamEpaMap = fetchedEpaMap ?? NO_EPA_DATA;

  // Calculate alliance totals
  const redTotalEpa = displayRedTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.epa ?? 0),
    0,
  );
  const blueTotalEpa = displayBlueTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.epa ?? 0),
    0,
  );
  const redAutoEpa = displayRedTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.auto ?? 0),
    0,
  );
  const blueAutoEpa = displayBlueTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.auto ?? 0),
    0,
  );
  const redTeleopEpa = displayRedTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.teleop ?? 0),
    0,
  );
  const blueTeleopEpa = displayBlueTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.teleop ?? 0),
    0,
  );
  const redEndgameEpa = displayRedTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.endgame ?? 0),
    0,
  );
  const blueEndgameEpa = displayBlueTeams.reduce(
    (sum, t) => sum + (teamEpaMap[t]?.endgame ?? 0),
    0,
  );

  const epaReady =
    hasTeams && !epaLoading && Object.keys(teamEpaMap).length > 0;
  const winProbability = !epaReady ||
    displayRedTeams.length !== allianceSize ||
    displayBlueTeams.length !== allianceSize
    ? null
    : estimateWinProbability(
        displayRedTeams.map((team) => ({
          mean: teamEpaMap[team]?.epa ?? NaN,
          scores: teamEpaMap[team]?.scores ?? [],
        })),
        displayBlueTeams.map((team) => ({
          mean: teamEpaMap[team]?.epa ?? NaN,
          scores: teamEpaMap[team]?.scores ?? [],
        })),
      );
  const redWinPercent = Math.round((winProbability?.red ?? 0) * 100);

  const handlePrevMatch = useCallback(() => {
    setMatchNumber((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextMatch = useCallback(() => {
    setMatchNumber((prev) =>
      maxMatchNumber ? Math.min(maxMatchNumber, prev + 1) : prev + 1,
    );
  }, [maxMatchNumber]);

  // Keep the text input in sync when the match number changes elsewhere
  const [inputMatchNumber, setInputMatchNumber] = useState(matchNumber);
  if (inputMatchNumber !== matchNumber) {
    setInputMatchNumber(matchNumber);
    setMatchNumberInput(matchNumber.toString());
  }

  const updateManualTeam = (
    alliance: "red" | "blue",
    index: number,
    value: string,
  ) => {
    setManualTeams((prev) => {
      const newTeams = { ...prev };
      newTeams[alliance] = [...prev[alliance]];
      newTeams[alliance][index] = value;
      return newTeams;
    });
  };

  // Playoff matches are numbered in play order; show their official name too.
  const officialLabel = scheduleData?.matches.find((m) => m.matchNumber === matchNumber)?.label;
  const matchLabel = isPlayoff
    ? `Playoff ${matchNumber}${officialLabel ? ` · ${officialLabel}` : ""}`
    : `Qual ${matchNumber}`;
  const shortPrefix = isPlayoff ? "P" : "Q";
  const alliances = [
    { key: "red" as const, name: "Red alliance", teams: displayRedTeams, total: redTotalEpa, line: "border-[#E5484D]", text: "text-[#C2272D]" },
    { key: "blue" as const, name: "Blue alliance", teams: displayBlueTeams, total: blueTotalEpa, line: "border-[#3B7BF6]", text: "text-[#2563EB]" },
  ];
  const phases = [
    { l: "Auto", red: redAutoEpa, blue: blueAutoEpa },
    { l: "Teleop", red: redTeleopEpa, blue: blueTeleopEpa },
    { l: "Endgame", red: redEndgameEpa, blue: blueEndgameEpa },
  ];
  const phaseMax = Math.max(1, ...phases.flatMap((p) => [p.red, p.blue]));
  const pill = "h-10 rounded-full px-4";
  const th = "border-b px-2 py-2.5 font-medium whitespace-nowrap";
  const td = "border-b border-border/60 px-2 py-2.5 whitespace-nowrap";

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            match preview · {useManual ? "manual entry" : matchLabel.toLowerCase()}
            {selectedEvent?.name ? ` · ${selectedEvent.name}` : ""}
          </span>
          <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">
            {useManual ? "Custom match" : matchLabel}
          </h1>
          <span className="text-muted-foreground">
            {useManual
              ? "Enter team numbers for each alliance below."
              : scheduleLoading
                ? "Loading schedule…"
                : scheduleError
                  ? <span className="text-destructive">{scheduleError}</span>
                  : !hasScheduleData
                    ? isPlayoff
                      ? "No playoff matches are scheduled yet — switch to qualifications or use manual entry."
                      : "No schedule available — select an event or use manual entry."
                    : `Match ${matchNumber}${maxMatchNumber ? ` of ${maxMatchNumber}` : ""} · compare both alliances before the match`}
          </span>
        </div>
        {!useManual && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className={pill} onClick={handlePrevMatch} disabled={matchNumber <= 1}>
              ← {shortPrefix}{Math.max(1, matchNumber - 1)}
            </Button>
            <Label className="sr-only" htmlFor="match-number">Match number</Label>
            <Input
              id="match-number"
              type="number"
              min={1}
              max={maxMatchNumber || undefined}
              value={matchNumberInput}
              onChange={(e) => {
                const value = e.target.value;
                setMatchNumberInput(value);

                const parsed = parseInt(value, 10);
                if (!Number.isNaN(parsed)) {
                  const clamped = maxMatchNumber
                    ? Math.min(maxMatchNumber, Math.max(1, parsed))
                    : Math.max(1, parsed);
                  setMatchNumber(clamped);
                }
              }}
              onBlur={() => {
                if (matchNumberInput.trim() === "") {
                  setMatchNumberInput(matchNumber.toString());
                }
              }}
              className="h-10 w-20 rounded-full bg-card text-center"
            />
            <Button
              variant="outline"
              className={pill}
              onClick={handleNextMatch}
              disabled={!!maxMatchNumber && matchNumber >= maxMatchNumber}
            >
              {shortPrefix}{matchNumber + 1} →
            </Button>
          </div>
        )}
      </header>

      <div className="-mt-4 flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Team source" className="flex gap-1">
          <Button
            variant={!useManual ? "default" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => setUseManual(false)}
            disabled={!hasScheduleData}
          >
            From schedule
          </Button>
          <Button
            variant={useManual ? "default" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => setUseManual(true)}
          >
            Manual entry
          </Button>
        </div>
        {!useManual && (
          <>
            <Select value={matchType} onValueChange={(v) => {
              setMatchType(v as MatchType);
              // Numbers restart for the other set of matches.
              setMatchNumber(1);
            }}>
              <SelectTrigger size="sm" className="w-[140px] rounded-full" aria-label="Match type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="playoff">Playoff</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={refreshSchedule} aria-label="Refresh schedule">
              <RefreshCw className="size-4" />
            </Button>
          </>
        )}
      </div>

      {useManual && (
        <div className="grid gap-6 md:grid-cols-2">
          {alliances.map((a) => (
            <div key={a.key} className="flex flex-col gap-2">
              <span className={`border-b-2 pb-2 font-semibold ${a.line} ${a.text}`}>{a.name}</span>
              {Array.from({ length: allianceSize }).map((_, i) => (
                <Input
                  key={`${a.key}-${i}`}
                  type="number"
                  aria-label={`${a.key === "red" ? "Red" : "Blue"} ${i + 1} team number`}
                  placeholder={`${a.key === "red" ? "Red" : "Blue"} ${i + 1} team number`}
                  value={manualTeams[a.key][i]}
                  onChange={(e) => updateManualTeam(a.key, i, e.target.value)}
                  className="bg-card"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!hasTeams ? (
        <p className="py-12 text-center text-muted-foreground">
          {hasScheduleData
            ? "Choose a match number above to preview both alliances."
            : "Load a schedule by selecting an event, or use manual entry to input team numbers."}
        </p>
      ) : (
        <>
          <section aria-labelledby="pred" className="flex flex-col gap-2.5">
            {epaLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : epaReady ? (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[52px] font-semibold tracking-[-0.03em] text-[#C2272D]">{redTotalEpa.toFixed(0)}</span>
                  <span id="pred" className="text-center font-mono text-sm text-muted-foreground">
                    predicted score
                    <br />
                    {winProbability
                      ? redWinPercent >= 50
                        ? `red favored ${redWinPercent}%`
                        : `blue favored ${100 - redWinPercent}%`
                      : "win chance needs more data"}
                  </span>
                  <span className="text-[52px] font-semibold tracking-[-0.03em] text-[#2563EB]">{blueTotalEpa.toFixed(0)}</span>
                </div>
                <div
                  role="img"
                  aria-label={winProbability ? `Red ${redWinPercent}% to win, blue ${100 - redWinPercent}%` : "Win chance unavailable"}
                  className="flex h-2.5 gap-[3px] overflow-hidden rounded-full"
                >
                  <div className="bg-[#E5484D]" style={{ flex: `${winProbability ? redWinPercent : 50} 1 0` }} />
                  <div className="bg-[#3B7BF6]" style={{ flex: `${winProbability ? 100 - redWinPercent : 50} 1 0` }} />
                </div>
                {winProbability ? (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">About this estimate</summary>
                    <p className="mt-1">
                      Win chance uses a normal model of scouted match scores. Variation is pooled for small samples; ties are not modeled, and estimates are not calibrated against results.
                    </p>
                  </details>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Win chance needs complete alliances, scouting data for every team, and at least one team with two matches.
                  </p>
                )}
              </>
            ) : (
              <p id="pred" className="text-sm text-muted-foreground">No EPA data available for prediction</p>
            )}
          </section>

          <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
            {alliances.map((a) => (
              <section key={a.key} aria-labelledby={`${a.key}-h`} className="flex flex-col">
                <div className={`flex items-baseline justify-between border-b-2 pb-2 ${a.line}`}>
                  <h2 id={`${a.key}-h`} className={`text-lg font-semibold tracking-tight ${a.text}`}>{a.name}</h2>
                  <span className="font-mono text-sm text-muted-foreground">combined EPA {a.total.toFixed(1)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-sm tabular-nums">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th scope="col" className={`${th} pl-0`}>Team</th>
                        <th scope="col" className={th}>EPA</th>
                        <th scope="col" className={`${th} text-right`}>Auto</th>
                        <th scope="col" className={`${th} text-right`}>Teleop</th>
                        <th scope="col" className={`${th} text-right`}>Endgame</th>
                        <th scope="col" className={`${th} text-right`}>Matches</th>
                        <th scope="col" className={`${th} pr-0`}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.teams.map((team) => {
                        const t = teamEpaMap[team];
                        const num = (v?: number) => (epaLoading ? "…" : t?.matchCount ? v!.toFixed(1) : "—");
                        return (
                          <tr key={team}>
                            <td className={`${td} pl-0`}>
                              <Link href={`/dashboard/team/${team}`} className="text-xl font-bold tracking-[-0.03em] text-foreground">{team}</Link>
                            </td>
                            <td className={`${td} font-mono font-medium`}>{num(t?.epa)}</td>
                            <td className={`${td} text-right font-mono`}>{num(t?.auto)}</td>
                            <td className={`${td} text-right font-mono`}>{num(t?.teleop)}</td>
                            <td className={`${td} text-right font-mono`}>{num(t?.endgame)}</td>
                            <td className={`${td} text-right font-mono text-muted-foreground`}>{epaLoading ? "…" : t?.matchCount ?? 0}</td>
                            <td className={`${td} pr-0`}><NotesBar notes={(t?.notes ?? []).map((n) => n.text)} /></td>
                          </tr>
                        );
                      })}
                      {a.teams.length === 0 && (
                        <tr><td colSpan={7} className={`${td} px-0 text-muted-foreground`}>No teams assigned</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          {epaReady && (
            <section aria-labelledby="phase" className="flex flex-col gap-3.5">
              <h2 id="phase" className="text-lg font-semibold tracking-tight">Where the match is won</h2>
              {phases.map((p) => (
                <div key={p.l} className="grid grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] items-center gap-4">
                  <div className="flex items-center justify-end gap-2.5">
                    <span className="font-mono text-sm">{p.red.toFixed(1)}</span>
                    <div className="h-2 rounded-full bg-[#E5484D]" style={{ width: `${(p.red / phaseMax) * 100}%` }} />
                  </div>
                  <span className="text-center text-sm text-muted-foreground">{p.l}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 rounded-full bg-[#3B7BF6]" style={{ width: `${(p.blue / phaseMax) * 100}%` }} />
                    <span className="font-mono text-sm">{p.blue.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {alliances.some((a) => a.teams.some((team) => teamEpaMap[team]?.notes.length)) && (
            <div className="grid gap-10 border-t pt-7 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
              {alliances.map((a) => {
                // Latest notes first: what a team did recently matters most before a match.
                const notes = a.teams
                  .flatMap((team) => (teamEpaMap[team]?.notes ?? []).map((note) => ({ team, ...note })))
                  .sort((x, y) => y.match - x.match)
                  .slice(0, 8);
                return (
                  <section key={a.key} aria-labelledby={`${a.key}-notes`} className="flex flex-col">
                    <h2 id={`${a.key}-notes`} className="pb-1.5 text-lg font-semibold tracking-tight">
                      {a.key === "red" ? "Red notes" : "Blue notes"}
                    </h2>
                    {notes.length === 0 && <p className="py-2 text-sm text-muted-foreground">No scouting notes yet</p>}
                    {notes.map((note, index) => (
                      <div key={index} className="grid grid-cols-[9px_44px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-border/60 py-2 text-sm leading-snug">
                        <NoteDot note={note.text} className="self-center" />
                        <span className={`font-mono text-xs ${a.text}`}>{note.team}</span>
                        <span>{note.text}</span>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          )}

          <section aria-labelledby="details" className="flex flex-col gap-4 border-t pt-7">
            <h2 id="details" className="text-lg font-semibold tracking-tight">Team details</h2>
            <div className="grid gap-10 lg:grid-cols-2">
              <MatchupAlliancePanel
                alliance="red"
                teamNumbers={displayRedTeams}
                currentYear={currentYear}
                competitionType={competitionType}
              />
              <MatchupAlliancePanel
                alliance="blue"
                teamNumbers={displayBlueTeams}
                currentYear={currentYear}
                competitionType={competitionType}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
