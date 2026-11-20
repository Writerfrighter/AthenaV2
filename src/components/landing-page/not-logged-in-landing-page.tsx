import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { APP_NAME, ORGANIZATION_NAME, ORGANIZATION_URL } from "@/lib/app-config";
import { DashboardPreview, SchedulePreview, PitPreview, MatchPreview, AnalyticsPreview } from "./product-previews";
import { Heart } from "lucide-react";

export const features = [
  { id: "scheduling", label: "Scheduling", summary: "Scout assignments for each match", title: "Give each scout a clear assignment.", description: "Build scouting rotations and assign scouts to each match. Everyone can check the same schedule and see where they need to be.", points: ["Match-by-match assignments", "One shared schedule for your team"], preview: SchedulePreview },
  { id: "pit-scouting", label: "Pit scouting", summary: "Robot capabilities and pit notes", title: "Keep robot details with your pit notes.", description: "Record robot capabilities, build details, and notes from pit visits. Keep that context available when your team reviews match results.", points: ["Structured robot profiles", "Capabilities and notes in one place"], preview: PitPreview },
  { id: "match-scouting", label: "Match scouting", summary: "Match entries with offline support", title: "Record what happens on the field.", description: "Collect match data from the stands. If the venue connection drops, keep scouting offline and sync your entries when you reconnect.", points: ["Fast match data collection", "Offline support for competition day"], preview: MatchPreview },
  { id: "analytics", label: "Analysis", summary: "Team comparisons and trends", title: "Compare teams before making your picks.", description: "Review team performance, look for trends across matches, and use your scouting data to prepare for alliance selection.", points: ["Team comparisons and performance trends", "Insights for alliance preparation"], preview: AnalyticsPreview },
];

const wrap = "mx-auto w-full max-w-7xl px-4 md:px-12";

export function NotLoggedInLandingPage({ signupEnabled }: { signupEnabled: boolean }) {
  const destination = signupEnabled ? "/signup" : "/login";
  const cta = signupEnabled ? "Create an account" : `Log in to ${APP_NAME}`;
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 flex h-[3px]">
        <div className="flex-1 bg-[#E5484D]" />
        <div className="flex-1 bg-[#3B7BF6]" />
      </div>
      <header className="sticky top-[3px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className={`${wrap} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" aria-label={`${APP_NAME} home`} className="text-xl font-bold tracking-tight lowercase">
            {APP_NAME}<span className="text-chart-1">.</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="[&_button]:border-0"><ModeToggle /></span>
            {signupEnabled && <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button>}
            <Button asChild><Link href={destination}>{signupEnabled ? "Create an account" : "Log in"}</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className={`${wrap} grid items-center gap-12 pt-10 pb-16 md:pt-16 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div className="flex flex-col gap-5">
            <span className="font-mono text-xs text-muted-foreground">scouting · built by students for FIRST teams</span>
            <h1 className="max-w-xl text-[44px] font-bold leading-[0.95] tracking-[-0.04em] sm:text-[56px]">Your team’s scouting, in one place.</h1>
            <p className="max-w-md leading-relaxed text-muted-foreground">Organize scouting assignments, collect pit and match data, and compare teams throughout an event. Pit and match scouting work offline, too.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="lg"><Link href={destination}>{cta}</Link></Button>
              <Button asChild variant="outline" size="lg"><a href="#features">See the tools</a></Button>
            </div>
            {!signupEnabled && <p className="text-sm text-muted-foreground">Need an account? Contact your team administrator.</p>}
          </div>
          <DashboardPreview />
        </section>

        <nav id="features" aria-label="Scouting tools" className={`${wrap} scroll-mt-24`}>
          <div className="grid grid-cols-2 border-y lg:grid-cols-4">
            {features.map(({ id, label, summary }, index) => (
              <a key={id} href={`#${id}`} className="group flex flex-col gap-1.5 py-5 pr-4">
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{label}</span>
                <span className="text-sm text-muted-foreground">{summary}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className={wrap}>
          {features.map(({ id, label, title, description, points, preview: Preview }, index) => (
            <section key={id} id={id} aria-labelledby={`${id}-title`} className={`grid scroll-mt-24 gap-10 border-b py-16 lg:items-center lg:gap-16 ${index % 2 ? "lg:grid-cols-[1.25fr_0.75fr]" : "lg:grid-cols-[0.75fr_1.25fr]"}`}>
              <div className={`flex flex-col gap-4 ${index % 2 ? "lg:order-last" : ""}`}>
                <span className="font-mono text-xs text-muted-foreground">0{index + 1} · {label.toLowerCase()}</span>
                <h2 id={`${id}-title`} className="max-w-md text-[32px] font-bold leading-none tracking-[-0.03em]">{title}</h2>
                <p className="max-w-md leading-relaxed text-muted-foreground">{description}</p>
                <ul className="max-w-md border-t border-border/60 text-sm">
                  {points.map(point => (
                    <li key={point} className="grid grid-cols-[9px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-border/60 py-2.5">
                      <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />{point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0"><Preview /></div>
            </section>
          ))}
        </div>

        <section className={`${wrap} flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-end sm:justify-between`}>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">get started</span>
            <h2 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">{signupEnabled ? "Set up your scouting workspace." : "Open your team’s workspace."}</h2>
            <p className="text-muted-foreground">{signupEnabled ? "Create an account to start organizing your team’s scouting." : "Need an account? Contact your team administrator."}</p>
          </div>
          <Button asChild size="lg"><Link href={destination}>{cta}</Link></Button>
        </section>
      </main>

      <footer className={wrap}><div className="flex flex-wrap justify-between gap-2 border-t py-6 font-mono text-xs text-muted-foreground">
        <span className="lowercase">{APP_NAME}<span className="text-chart-1">.</span></span>
        <span className="flex items-center gap-1 lowercase">
          made with 
          <Heart className="size-3 text-chart-1" />
          by <a href={ORGANIZATION_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-foreground hover:underline">{ORGANIZATION_NAME}</a>
        </span>
      </div></footer>
    </div>
  );
}
