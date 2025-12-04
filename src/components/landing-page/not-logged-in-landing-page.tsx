'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  UserPlus,
  ArrowRight,
  Hammer,
  Zap,
  BarChart3,
  Wifi,
  ChevronDown,
  Target,
  Users,
  Sparkles,
  ShieldCheck,
  Trophy,
  Heart
} from "lucide-react"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export function NotLoggedInLandingPage() {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const highlightStats = [
    { label: "Matches logged", value: "500+" },
    { label: "Offline sessions", value: "200+" },
    { label: "Seasons on field", value: "6" }
  ]

  const missionHighlights = [
    {
      title: "Purpose-built workflows",
      description: "Forms, analytics, and exports tuned for the chaos of competition weekends.",
      icon: Target
    },
    {
      title: "Reliable everywhere",
      description: "Offline-first sync keeps scouts productive from the stands to the pits.",
      icon: ShieldCheck
    },
    {
      title: "Decisions with context",
      description: "Visual insights explain the story behind every robot's performance arc.",
      icon: BarChart3
    }
  ]

  const featureCards = [
    {
      title: "Pit Scouting",
      description: "Robot capabilities & build notes",
      icon: Hammer,
      targetId: "pit-scouting"
    },
    {
      title: "Match Scouting",
      description: "Live drive-team intelligence",
      icon: Zap,
      targetId: "match-scouting"
    },
    {
      title: "Analytics",
      description: "Alliance-ready reporting",
      icon: BarChart3,
      targetId: "analytics"
    },
    {
      title: "Offline Capable",
      description: "Collect anywhere, sync later",
      icon: Wifi,
      targetId: "offline-capable"
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true)
      } else {
        setHasScrolled(false)
      }
    }

    // Check for dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Decorative Blurred Blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl opacity-25 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[350px] h-[350px] bg-primary/20 rounded-full blur-3xl opacity-25 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b relative">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Image
                src={isDark ? "/TRCLogoWhite.png" : "/TRCLogo.webp"}
                alt="TRC Scouting Logo"
                width={40}
                height={40}
                className="rounded"
              />
            </div>
            <span className="font-bold text-lg">Athena</span>
          </div>
          <div className="flex items-center gap-3">
            {/* <ModeToggle /> */}
            <Link href="/signup">
              <Button variant="outline" size="lg" className="hidden sm:inline-flex gap-1">
                {/* < className="h-5 w-5" /> */}
                Sign up
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="default" size="lg" className="hidden sm:inline-flex gap-1">
                {/* <LogIn className="h-5 w-5" /> */}
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full min-h-screen flex items-center py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] items-center">
            <div className="space-y-8 text-left">
              <div className="space-y-3">
                {/* <Badge variant="outline" className="w-fit">Titan Robotics Club</Badge> */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Built by the Titan Robotics Club to help every scout team make bold decisions.
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
                  Athena is our competitive advantage: one platform for storytelling, scouting, and alliance prep that feels as polished as the teams we look up to.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
                {/* <Link href="#mission">
                  <Button size="lg" variant="outline" className="gap-2">
                    Why Athena
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link> */}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
                {highlightStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-primary/20 bg-background/60 backdrop-blur px-4 py-5">
                    <p className="text-3xl font-semibold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* <div className="relative h-full min-h-[420px]">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
              <div className="relative h-full rounded-[32px] border border-primary/20 bg-background/80 backdrop-blur-lg p-8 flex flex-col gap-6 shadow-2xl">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
                  <p className="text-sm text-muted-foreground mb-2">TRC Mission</p>
                  <p className="text-xl font-semibold">Give every scout a clear voice in match strategy.</p>
                </div>
                <div className="rounded-2xl border bg-background/90 p-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Recent win</p>
                  <p className="text-2xl font-bold">3 events planned with Athena</p>
                  <p className="text-sm text-muted-foreground">From pit data to alliance slides without leaving the app.</p>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-background/80 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Community spotlight</p>
                    <p className="text-lg font-semibold">Titan Robotics Club</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div> */}
          </div>

          {/* Scroll Indicator */}
          <div className={`flex justify-center mt-16 animate-bounce transition-opacity duration-300 ${hasScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Scroll to learn why teams choose Athena</p>
              <ChevronDown className="h-6 w-6 text-primary mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="relative z-10 w-full py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            {/* <Badge variant="outline" className="mx-auto w-fit">Why Athena exists</Badge> */}
            <h2 className="text-3xl sm:text-4xl font-bold">Give your team the same scouting edge we built for ours.</h2>
            <p className="text-lg text-muted-foreground">
              Athena connects the story of every match, every pit interview, and every overnight strategy meeting so your drive team can move with certainty.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {missionHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-3xl border border-primary/15 bg-background/80 p-6 space-y-3">
                  <Icon className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TRC Spotlight Section */}
      <section id="trc" className="relative z-10 w-full py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-5">
              <Badge variant="outline" className="w-fit">From Titan Robotics Club</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">We built Athena to serve our own scouts first.</h2>
              <p className="text-lg text-muted-foreground">
                Every design decision comes from long nights in the pits, missed Wi-Fi, and the need to tell our story to judges and alliance partners. You can adopt Athena knowing it has already survived real competition pressure.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[{
                  title: "Student-led product",
                  description: "Designed and shipped by TRC software & strategy students.",
                  icon: Users
                }, {
                  title: "Competition proven",
                  description: "Ran through regionals, DCMP, and offseason scrimmages.",
                  icon: Trophy
                }].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-2xl border border-primary/20 bg-background/80 p-5 space-y-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-background/90 p-8 shadow-xl space-y-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Season snapshot</p>
                <p className="text-3xl font-bold mt-2">2025 Goals</p>
              </div>
              <ul className="space-y-4">
                {[
                  "Capture every match with consistent metrics",
                  "Prep alliance decks in under 10 minutes",
                  "Share insights with partners before playoffs"
                ].map((goal) => (
                  <li key={goal} className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-muted-foreground">{goal}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-dashed border-primary/40 p-6">
                <p className="text-sm text-muted-foreground">Core belief</p>
                <p className="text-xl font-semibold">Scouting should feel inspirational, not tedious.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="relative z-10 w-full py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-10">
            <Badge variant="outline" className="mx-auto w-fit">Platform highlights</Badge>
            <h2 className="text-3xl font-bold">Everything you need, ready when you need it.</h2>
            <p className="text-lg text-muted-foreground">Dive deeper into any capability below—each button drops you right into the overview further down the page.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.title}
                  onClick={() => document.getElementById(card.targetId)?.scrollIntoView({ behavior: 'smooth' })}
                  className="group text-left"
                >
                  <div className="h-full rounded-2xl border border-primary/15 bg-background/80 hover:border-primary/40 transition-colors p-6 flex flex-col justify-between shadow-sm">
                    <div>
                      <Icon className="h-8 w-8 text-primary mb-4" />
                      <h3 className="font-semibold text-xl mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                    <div className="flex items-center text-sm font-medium text-primary gap-2 mt-4">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section 1 - Pit Scouting */}
      <section id="pit-scouting" className="relative z-10 w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">Pit playbook</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pit Scouting</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Collect detailed robot capabilities and team data directly from the pits. Comprehensive scouting tools designed to capture everything you need to know about each team's robot and strategy.
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-square rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden">
                <Hammer className="h-32 w-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 2 - Match Scouting */}
      <section id="match-scouting" className="relative z-10 w-full py-12 sm:py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-lg bg-background flex items-center justify-center overflow-hidden">
                <Zap className="h-32 w-32 text-primary/20" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">Match intelligence</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Match Scouting</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Real-time match data collection during competitions. Capture live performance metrics, game events, and team actions with our fast and intuitive scouting interface designed for the heat of competition.
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 3 - Analytics */}
      <section id="analytics" className="relative z-10 w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">Alliance-ready insights</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Analytics</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Transform raw scouting data into actionable insights. Performance data and trends help your team make informed decisions about team rankings, alliance selection, and match strategy.
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-square rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden">
                <BarChart3 className="h-32 w-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 4 - Offline Capable */}
      <section id="offline-capable" className="relative z-10 w-full py-12 sm:py-16 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-lg bg-background flex items-center justify-center overflow-hidden">
                <Wifi className="h-32 w-32 text-primary/20" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">Prepared for travel</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Offline Capable</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Scout anywhere, anytime. Athena V2's offline-first architecture ensures you can collect data from the pits or bleachers without worrying about connectivity. Data syncs automatically when you're back online, so nothing is ever lost.
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full mt-auto border-t bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <span>
              Made with
              <Heart className="inline-block h-4 w-4 mx-1 text-green-500" />
              by&nbsp; 
              <a href="https://titanrobotics.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">Titan Robotics Club</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
