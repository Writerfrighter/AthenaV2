'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, LogIn, ArrowRight, Hammer, Zap, BarChart3, Wifi, ChevronDown } from "lucide-react"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function Page() {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
            <span className="font-bold text-lg">Athena V2</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full py-0 sm:py-0 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Titan Robotics Club
              <br />
              <span className="text-primary">Athena V2</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Professional scouting platform for FIRST Robotics teams
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <button
                onClick={() => {
                  document.getElementById('pit-scouting')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group text-left"
              >
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center cursor-pointer">
                  <Hammer className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">Pit Scouting</h3>
                  <p className="text-sm text-muted-foreground">Robot capabilities & team data</p>
                </div>
              </button>

              <button
                onClick={() => {
                  document.getElementById('match-scouting')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group text-left"
              >
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center cursor-pointer">
                  <Zap className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">Match Scouting</h3>
                  <p className="text-sm text-muted-foreground">Live match data collection</p>
                </div>
              </button>

              <button
                onClick={() => {
                  document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group text-left"
              >
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center cursor-pointer">
                  <BarChart3 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Performance data & trends</p>
                </div>
              </button>

              <button
                onClick={() => {
                  document.getElementById('offline-capable')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group text-left"
              >
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center cursor-pointer">
                  <Wifi className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">Offline Capable</h3>
                  <p className="text-sm text-muted-foreground">Scout anywhere, anytime</p>
                </div>
              </button>
            </div>

            {/* Scroll Indicator */}
            <div className={`flex justify-center mt-20 animate-bounce transition-opacity duration-300 ${hasScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Scroll for feature details</p>
                <ChevronDown className="h-6 w-6 text-primary mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 1 - Pit Scouting */}
      <section id="pit-scouting" className="relative z-10 w-full py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Pit Scouting
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Collect detailed robot capabilities and team data directly from the pits. Comprehensive scouting tools designed to capture everything you need to know about each team's robot and strategy.
              </p>
              <Link href="/scout/pitscout">
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
      <section id="match-scouting" className="relative z-10 w-full py-8 sm:py-12 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-lg bg-background flex items-center justify-center overflow-hidden">
                <Zap className="h-32 w-32 text-primary/20" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Match Scouting
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Real-time match data collection during competitions. Capture live performance metrics, game events, and team actions with our fast and intuitive scouting interface designed for the heat of competition.
              </p>
              <Link href="/scout/matchscout">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 3 - Analytics */}
      <section id="analytics" className="relative z-10 w-full py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Analytics
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Transform raw scouting data into actionable insights. Performance data and trends help your team make informed decisions about team rankings, alliance selection, and match strategy.
              </p>
              <Link href="/dashboard/analysis">
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
      <section id="offline-capable" className="relative z-10 w-full py-8 sm:py-12 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-lg bg-background flex items-center justify-center overflow-hidden">
                <Wifi className="h-32 w-32 text-primary/20" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Offline Capable
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Scout anywhere, anytime. Athena V2's offline-first architecture ensures you can collect data from the pits or bleachers without worrying about connectivity. Data syncs automatically when you're back online, so nothing is ever lost.
              </p>
              <Link href="/dashboard">
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
            <p>© 2025 Titan Robotics Club. Built for FIRST Robotics teams.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
