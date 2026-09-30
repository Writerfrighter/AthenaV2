import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BarChart3, CalendarDays, Check, Heart, ShieldCheck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_LOGO_DARK, APP_NAME, ORGANIZATION_NAME, ORGANIZATION_URL } from "@/lib/app-config";
import { DashboardPreview, SchedulePreview, PitPreview, MatchPreview, AnalyticsPreview } from "./product-previews";

const features = [
  { id: "scheduling", label: "01 / COORDINATE", title: "Every match. Every seat covered.", description: "Build scouting rotations, assign your crew, and give everyone a clear view of what's next. Less time organizing. More time watching the field.", points: ["Match-by-match assignments", "One shared schedule for your team"], preview: SchedulePreview },
  { id: "pit-scouting", label: "02 / DISCOVER", title: "Know the robot behind the rank.", description: "Bring robot capabilities, build details, and pit notes together. Give your strategy team the context that a score alone can't capture.", points: ["Structured robot profiles", "Capabilities and notes in one place"], preview: PitPreview },
  { id: "match-scouting", label: "03 / CAPTURE", title: "Eyes on the field. Data at your fingertips.", description: "Capture performance as the match unfolds with a scouting workflow built for the stands. Keep collecting when the venue connection drops, then sync later.", points: ["Fast match data collection", "Offline support for competition day"], preview: MatchPreview },
  { id: "analytics", label: "04 / DECIDE", title: "Turn match data into your next move.", description: "Compare teams, spot performance trends, and bring the full picture to alliance discussions. Make your next decision with the scouting behind it.", points: ["Team comparisons and performance trends", "Insights for alliance preparation"], preview: AnalyticsPreview },
];

export function NotLoggedInLandingPage({ signupEnabled }: { signupEnabled: boolean }) {
  const destination = signupEnabled ? "/signup" : "/login";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label={`${APP_NAME} home`} className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <Image src={APP_LOGO} alt="" width={34} height={34} className="dark:hidden" />
            <Image src={APP_LOGO_DARK} alt="" width={34} height={34} className="hidden dark:block" />
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            {signupEnabled && <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button>}
            <Button asChild className="h-10 px-4"><Link href={destination}>{signupEnabled ? "Get started" : "Log in"}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden border-b">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_35%,var(--primary),transparent_65%)] opacity-[0.07]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:py-28">
            <div>
              <h1 className="text-5xl leading-[1.06] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">Scout together.<br />Compete<br /><span className="text-primary">with clarity.</span></h1>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">From the first pit visit to the final alliance pick. Your scouting, schedules, and strategy, connected in {APP_NAME}.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6"><Link href={destination}>{signupEnabled ? "Get started" : "Log in"}<ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-5"><a href="#features">Explore the platform<ArrowDown aria-hidden="true" /></a></Button>
              </div>
              {!signupEnabled && <p className="mt-4 text-sm text-muted-foreground">Need an account? Contact your team administrator.</p>}
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck className="size-4" />Offline ready</span><span className="flex items-center gap-1.5"><Users className="size-4" />Student built</span></div>
            </div>
            <DashboardPreview />
          </div>
        </section>
        <section id="features" className="scroll-mt-24 border-b bg-muted/25">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {[{ icon: CalendarDays, title: "Coordinate your crew", text: "A shared plan for every match", href: "scheduling" }, { icon: Users, title: "Know the competition", text: "Robot details, all together", href: "pit-scouting" }, { icon: Zap, title: "Capture every moment", text: "From the pits to the stands", href: "match-scouting" }, { icon: BarChart3, title: "Find your advantage", text: "Data that informs your strategy", href: "analytics" }].map(({ icon: Icon, title, text, href }) => <a key={href} href={`#${href}`} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"><Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" /><div><div className="text-sm font-semibold">{title}</div><p className="mt-1 text-xs text-muted-foreground">{text}</p></div></a>)}
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          {features.map(({ id, label, title, description, points, preview: Preview }, index) => <section key={id} id={id} className="grid scroll-mt-24 items-center gap-10 border-b py-14 last:border-0 sm:py-20 lg:grid-cols-2 lg:gap-20">
            <div className={index % 2 ? "lg:order-2" : ""}>
              <p className="mb-5 font-mono text-xs font-medium tracking-widest text-muted-foreground">{label}</p>
              <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{description}</p>
              <ul className="mt-6 space-y-3">{points.map(point => <li key={point} className="flex items-center gap-2.5 text-sm"><Check aria-hidden="true" className="size-4 shrink-0 text-primary" />{point}</li>)}</ul>
            </div>
            <div className={`min-w-0 rounded-3xl border bg-muted/35 p-4 sm:p-8 ${index % 2 ? "lg:order-1" : ""}`}><Preview /></div>
          </section>)}
        </div>
        <section className="px-5 py-20 text-center sm:py-24 bg-muted/25"><p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground">YOUR NEXT MATCH STARTS HERE</p><h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Bring your team's scouting together.</h2><p className="mx-auto mt-5 max-w-lg text-muted-foreground">One place to collect, coordinate, and prepare for what comes next.</p><Button asChild size="lg" className="mt-8 h-12 px-6"><Link href={destination}>{signupEnabled ? `Get started with ${APP_NAME}` : `Log in to ${APP_NAME}`}<ArrowRight aria-hidden="true" /></Link></Button>{!signupEnabled && <p className="mt-4 text-sm text-muted-foreground">Contact your team administrator for an account.</p>}</section>
      </main>
      <footer className="relative z-10 w-full mt-auto border-t bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <span>
              Made with
              <Heart className="inline-block h-4 w-4 mx-1 text-green-500" />
              for FIRST teams
              {ORGANIZATION_NAME && (
                <>
                  {" · "}
                  {ORGANIZATION_URL ? (
                    <a
                      href={ORGANIZATION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary transition-colors"
                    >
                      {ORGANIZATION_NAME}
                    </a>
                  ) : (
                    ORGANIZATION_NAME
                  )}
                </>
              )}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
