"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoringField } from "@/components/forms/scoring-field";
import { APP_NAME } from "@/lib/app-config";
import gameConfig from "../../../config/years/FRC-2026.json";

// Presentation-only excerpts of the real screens. No session, API, or offline
// providers are mounted, and inert keeps sample controls out of the tab order.
// Content renders at a fixed width and is scaled, so avoid responsive classes inside.
function PreviewFrame({ title, children, width = 760, height = 580 }: {
  title: string;
  children: ReactNode;
  width?: number;
  height?: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return (
    <figure className="m-0 min-w-0">
      <div ref={frame} role="img" aria-label={`${title}. Illustrative sample data.`} className="relative overflow-hidden rounded-[20px] border bg-background" style={{ aspectRatio: `${width} / ${height}` }}>
        <div inert aria-hidden="true" className="absolute left-0 top-0 origin-top-left overflow-hidden bg-background text-foreground" style={{ width, height, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
          <div aria-hidden="true" className="flex h-[3px]"><div className="flex-1 bg-[#E5484D]" /><div className="flex-1 bg-[#3B7BF6]" /></div>
          {children}
        </div>
      </div>
      <figcaption className="mt-3 font-mono text-xs text-muted-foreground">{title.toLowerCase()} · sample data</figcaption>
    </figure>
  );
}

function PageHeader({ label, title, sub }: { label: string; title: ReactNode; sub?: string }) {
  return (
    <header className="flex flex-col gap-2">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">{title}</h1>
      {sub && <span className="text-muted-foreground">{sub}</span>}
    </header>
  );
}

function UnderlineTabs({ labels, selected }: { labels: string[]; selected: string }) {
  return (
    <div className="grid border-b" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
      {labels.map(label => <span key={label} className={`py-3.5 text-center text-[15px] ${label === selected ? "font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground"}`}>{label}</span>)}
    </div>
  );
}

function SampleSelect({ value, className = "" }: { value: string; className?: string }) {
  return (
    <Select value={value}>
      <SelectTrigger className={`w-full ${className}`}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value={value}>{value}</SelectItem></SelectContent>
    </Select>
  );
}

const sectionLabel = "mt-4 mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70";
const h2 = "text-lg font-semibold tracking-tight";
const row = "border-b border-border/60";

function SidebarPreview() {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r bg-sidebar px-3 pb-4 text-sm text-sidebar-foreground">
      <span className="px-2 pt-7 pb-3 text-[17px] font-bold tracking-tight lowercase">{APP_NAME}<span className="text-chart-1">.</span></span>
      <span className="flex h-8 items-center px-2 font-semibold">Overview</span>
      {[{ label: "Competition", items: ["Schedule", "Start Pit Scouting", "Start Match Scouting", "Match Preview"] }, { label: "Data", items: ["Teams", "Pit Entries", "Match Entries"] }, { label: "Strategy", items: ["Analysis", "Picklist"] }].map(({ label, items }) => (
        <div key={label}>
          <p className={sectionLabel}>{label}</p>
          {items.map(item => <span key={item} className="flex h-8 items-center px-2 text-foreground/75">{item}</span>)}
        </div>
      ))}
      <div className="mx-2 mt-auto flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="font-mono">Demo Regional · 2026</span>
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#0D9488]" />Synced</span>
      </div>
    </aside>
  );
}

export function DashboardPreview() {
  const kpis = [{ l: "Team ranking", v: "#4", s: "live" }, { l: "Teams scouted", v: "36", s: "pit 36 of 42" }, { l: "Match entries", v: "252", s: "54% of quals" }, { l: "Pit coverage", v: "86%", s: "6 to go" }];
  const teams = [["254", "71.4"], ["1678", "68.2"], ["118", "62.9"], ["2056", "58.0"]];
  return (
    <PreviewFrame title="Overview" width={1040} height={720}>
      <div className="flex h-full">
        <SidebarPreview />
        <div className="flex min-w-0 flex-1 flex-col gap-8 px-12 pt-8">
          <div className="flex items-end justify-between gap-5">
            <PageHeader label="overview · Demo Regional" title="Welcome, Alex" sub="Quals 42 of 78 scouted · you scout Red 1 next, in Q43" />
            <div className="flex gap-2"><Button variant="outline">Pit scouting</Button><Button>Start scouting Q43</Button></div>
          </div>
          <section className="grid grid-cols-4 border-y">
            {kpis.map(k => (
              <div key={k.l} className="flex flex-col gap-1.5 py-5 pr-4">
                <span className="text-sm text-muted-foreground">{k.l}</span>
                <span className="text-[34px] font-semibold leading-none tracking-[-0.03em]">{k.v}</span>
                <span className="font-mono text-xs text-muted-foreground">{k.s}</span>
              </div>
            ))}
          </section>
          <div className="grid grid-cols-2 gap-12">
            <section className="flex flex-col">
              <h2 className={`${h2} pb-2`}>Up next for you</h2>
              <div className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5 py-3 ${row}`}>
                <b className="text-[22px] tracking-[-0.03em]">Q43</b>
                <span className="text-sm text-muted-foreground">Filled from the event schedule</span>
                <span className="rounded-full bg-[#C2272D] px-2.5 py-1 text-sm text-white">Red 1</span>
              </div>
              <h2 className={`${h2} pt-7 pb-3`}>Scouting coverage</h2>
              {[{ label: "Qualification matches", current: 42, total: 78 }, { label: "Pit scouting", current: 36, total: 42 }].map(bar => (
                <div key={bar.label} className="flex flex-col gap-1.5 pb-3">
                  <div className="flex justify-between text-sm"><span>{bar.label}</span><span className="font-mono text-xs text-muted-foreground">{bar.current} / {bar.total}</span></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${bar.current / bar.total * 100}%` }} /></div>
                </div>
              ))}
            </section>
            <section className="flex flex-col">
              <div className="flex items-baseline justify-between pb-1"><h2 className={h2}>Top teams by EPA</h2><span className="text-sm text-muted-foreground">All teams →</span></div>
              <table className="border-collapse text-sm tabular-nums">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="border-b py-2.5 pr-2 font-medium">#</th><th className="border-b px-2 py-2.5 font-medium">Team</th><th className="border-b py-2.5 pl-2 text-right font-medium">EPA</th></tr></thead>
                <tbody>{teams.map(([team, epa], i) => <tr key={team}><td className={`${row} py-2.5 pr-2 font-mono text-muted-foreground`}>{i + 1}</td><td className={`${row} px-2 py-2.5 font-semibold`}>{team}</td><td className={`${row} py-2.5 pl-2 text-right font-mono`}>{epa}</td></tr>)}</tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

export function SchedulePreview() {
  return (
    <PreviewFrame title="Schedule" height={600}>
      <div className="flex flex-col gap-8 px-8 pt-7">
        <PageHeader label="schedule · qualifications" title="Schedule" sub="78 quals · 8 virtual groups · select scouts, fill assignments, then save" />
        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-2"><h2 className={h2}>Match assignments</h2><span className="font-mono text-xs text-muted-foreground">6 scouts active</span></div>
          {[43, 44].map(match => (
            <div key={match} className={`flex flex-col gap-3 border-t py-4`}>
              <span className="text-[22px] font-bold tracking-[-0.03em]">Q{match}</span>
              <div className="grid grid-cols-2 gap-6">
                {(["Red", "Blue"] as const).map(alliance => (
                  <div key={alliance} className="grid grid-cols-3 gap-2">
                    {(alliance === "Blue" ? ["Kai", "Lee", "Max"] : ["Alex", "Sam", "Jo"]).map((name, index) => (
                      <div key={name} className="flex flex-col gap-1">
                        <span className={`text-xs font-medium ${alliance === "Red" ? "text-[#C2272D]" : "text-[#2563EB]"}`}>{alliance} {index + 1}</span>
                        <SampleSelect value={name} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </PreviewFrame>
  );
}

const pitHeading = "mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
export function PitPreview() {
  return (
    <PreviewFrame title="Pit scouting" height={600}>
      <div className="flex flex-col gap-7 px-8 pt-7">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{gameConfig.gameName} · pit scouting</span>
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.03em]">492</h1>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className={pitHeading}>Team Information</h2>
          <div className="flex w-1/2 flex-col gap-2 pt-2"><Label>Team Number</Label><SampleSelect value="Team 492" className="h-12" /></div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className={pitHeading}>Robot Information</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
            <div className="flex flex-col gap-2"><Label>Drivetrain</Label><SampleSelect value="Swerve" className="h-12" /></div>
            {[{ label: "Length (inches)", value: "30" }, { label: "Width (inches)", value: "28" }, { label: "Weight (lbs)", value: "115" }].map(field => (
              <div key={field.label} className="flex flex-col gap-2"><Label>{field.label}</Label><Input readOnly value={field.value} className="h-12" /></div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 border-t pt-5"><Switch checked aria-label="Has Autonomous Capabilities" /><span className="font-medium">Has Autonomous Capabilities</span></div>
      </div>
    </PreviewFrame>
  );
}

const noop = () => {};
export function MatchPreview() {
  return (
    <PreviewFrame title="Match scouting" height={600}>
      <div className="flex flex-col gap-6 px-8 pt-7">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{gameConfig.gameName} · match scouting</span>
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.03em]">
            Q43<span className="text-muted-foreground"> · 492</span>
            <span className="ml-3 inline-block rounded-full bg-[#FBE9E9] px-2.5 py-1 align-middle text-[13px] font-semibold tracking-normal text-[#C2272D]">Red 1</span>
          </h1>
        </div>
        <UnderlineTabs labels={["Auto", "Teleop", "Endgame"]} selected="Teleop" />
        <Card variant="panel">
          <CardHeader><CardTitle className="text-base font-semibold">Teleop Period</CardTitle><CardDescription>Driver-controlled period performance</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ScoringField section="teleop" fieldKey="fuel_scored" fieldConfig={gameConfig.scoring.teleop.fuel_scored} currentValue={45} onValueChange={noop} onNumberChange={noop} />
            <ScoringField section="teleop" fieldKey="fuel_missed" fieldConfig={gameConfig.scoring.teleop.fuel_missed} currentValue={5} onValueChange={noop} onNumberChange={noop} />
          </CardContent>
        </Card>
      </div>
    </PreviewFrame>
  );
}

const epaTeams = [
  { team: "254", auto: 22, teleop: 45, endgame: 20 },
  { team: "1678", auto: 18, teleop: 42, endgame: 20 },
  { team: "118", auto: 20, teleop: 35, endgame: 15 },
  { team: "2056", auto: 16, teleop: 32, endgame: 15 },
  { team: "492", auto: 15, teleop: 30, endgame: 10 },
];
const series = [{ key: "endgame", label: "Endgame", color: "var(--chart-2)" }, { key: "teleop", label: "Teleop", color: "var(--chart-1)" }, { key: "auto", label: "Auto", color: "var(--chart-3)" }] as const;
export function AnalyticsPreview() {
  return (
    <PreviewFrame title="Analysis" height={600}>
      <div className="flex flex-col gap-7 px-8 pt-7">
        <PageHeader label="analysis · epa" title="Analysis" sub="Expected points added by team, split by match period" />
        <UnderlineTabs labels={["Chart", "Table"]} selected="Chart" />
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between"><h2 className={h2}>EPA by team</h2><span className="font-mono text-xs text-muted-foreground">stacked</span></div>
          <svg viewBox="0 0 640 285" className="w-full" aria-hidden="true">
            {[0, 25, 50, 75, 100].map(value => <g key={value}><line x1="38" x2="630" y1={245 - value * 2.1} y2={245 - value * 2.1} stroke="var(--border)" /><text x="27" y={249 - value * 2.1} textAnchor="end" fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-geist-mono)">{value}</text></g>)}
            {epaTeams.map((team, i) => {
              let base = 245;
              return <g key={team.team}>
                {series.map(({ key, color }) => { const h = team[key] * 2.1; base -= h; return <rect key={key} x={65 + i * 112} y={base} width="62" height={h} fill={color} />; })}
                <text x={96 + i * 112} y="267" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12" fontFamily="var(--font-geist-mono)">{team.team}</text>
              </g>;
            })}
          </svg>
          <div className="flex gap-5 text-xs text-muted-foreground">{series.map(item => <span key={item.key} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: item.color }} />{item.label}</span>)}</div>
        </section>
      </div>
    </PreviewFrame>
  );
}
