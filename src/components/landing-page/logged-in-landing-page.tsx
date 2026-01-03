'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hammer, Zap, BarChart3, ArrowRight } from "lucide-react"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useScheduleData } from "@/hooks/use-schedule-data"
import { EventInfoCard } from "@/components/events/event-info-card"
import { OfflineStatusWidget } from "@/components/sync/offline-status-widget"

interface MatchItem {
  matchNumber: number
  teamNumber: number
  alliance: 'red' | 'blue'
}

export function LoggedInLandingPage() {
  const { data: session } = useSession()
  const [isDark, setIsDark] = useState(false)
  const { blocks, isLoading, error } = useScheduleData()
  const [upcomingMatches, setUpcomingMatches] = useState<MatchItem[]>([])

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Extract upcoming matches from blocks where user is assigned
  useEffect(() => {
    if (blocks && blocks.length > 0 && session?.user?.id) {
      const matches: MatchItem[] = []
      const userId = session.user.id
      
      blocks.forEach((block) => {
        // Check if user is assigned to red alliance
        const redIndex = block.redScouts?.indexOf(userId)
        if (redIndex !== undefined && redIndex !== -1) {
          matches.push({
            matchNumber: block.startMatch,
            teamNumber: 0, // Placeholder - could be derived from position
            alliance: 'red'
          })
        }
        
        // Check if user is assigned to blue alliance
        const blueIndex = block.blueScouts?.indexOf(userId)
        if (blueIndex !== undefined && blueIndex !== -1) {
          matches.push({
            matchNumber: block.startMatch,
            teamNumber: 0,
            alliance: 'blue'
          })
        }
      })
      
      // Only show next 3 upcoming assignments
      setUpcomingMatches(matches.slice(0, 3))
    } else {
      setUpcomingMatches([])
    }
  }, [blocks, session?.user?.id])

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
          <div className="flex items-center gap-3">
            <OfflineStatusWidget showSyncButton className="hidden sm:flex" />
            <ModeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Welcome Section */}
          <section className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-2">
              Welcome, <span className="text-primary">{session?.user?.name || 'Scout'}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Ready to scout? Here's your quick access to key features.
            </p>
          </section>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/scout/pitscout">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-primary" />
                    Pit Scouting
                  </CardTitle>
                  <CardDescription>Robot capabilities & team data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group">
                    Start Scouting
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/scout/matchscout">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Match Scouting
                  </CardTitle>
                  <CardDescription>Live match data collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group">
                    Scout Match
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>Performance data & trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group">
                    View Analytics
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </section>

          {/* Schedule & Event Section */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Your Schedule</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">Loading schedule...</p>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-red-500">Failed to load schedule</p>
                  </CardContent>
                </Card>
              ) : upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMatches.map((match: MatchItem, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Match {match.matchNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {match.alliance && `${match.alliance.toUpperCase()} Alliance`}
                          </p>
                        </div>
                        <Link href={`/scout/match?match=${match.matchNumber}`}>
                          <Button variant="outline" size="sm">
                            Scout
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">No upcoming matches</p>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-6">
              <EventInfoCard />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
