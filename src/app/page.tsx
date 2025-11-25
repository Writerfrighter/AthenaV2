'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ClipboardList, UserPlus, LogIn, BarChart3, Target } from "lucide-react"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import Link from "next/link"
import Image from "next/image"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
      {/* Decorative Animated Blobs (subtle) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/20 opacity-15 blur-3xl animate-blob z-0 blob1"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-0 right-0 w-[340px] h-[340px] rounded-full bg-chart-4/20 opacity-10 blur-2xl animate-blob2 z-0 blob2"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-1/2 left-1/2 w-[180px] h-[180px] rounded-full bg-chart-2/20 opacity-08 blur-xl animate-blob3 z-0 blob3"
      />
      {/* Header with Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-white dark:bg-white/80 shadow-lg ring-2 ring-primary/10"/>
              <Image
                src="/TRCLogo.webp"
                alt="TRC Scouting Logo"
                width={80}
                height={80}
                className="rounded-xl relative z-10"
              />
              <div className="absolute -top-1 -right-1 z-20">
                <Badge variant="default" className="bg-primary text-xs px-1.5 py-0.5 shadow-md">
                  V2
                </Badge>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            TRC Athena Scouting
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional scouting platform for FIRST Robotics teams
          </p>

          {/* Quick Access Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/login">
              <Button size="lg" className="shadow-md">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
            
            <Link href="/signup">
              <Button size="lg" variant="outline" className="shadow-sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pit Scouting */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Pit Scouting</CardTitle>
              <CardDescription className="text-sm">
                Robot capabilities & team data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/scout/pitscout">
                <Button variant="outline" size="sm" className="w-full">
                  Scout Pits
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Match Scouting */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Match Scouting</CardTitle>
              <CardDescription className="text-sm">
                Live match data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/scout/matchscout">
                <Button variant="outline" size="sm" className="w-full">
                  Record Matches
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Data Analysis */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription className="text-sm">
                Performance insights & trends
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/dashboard/analysis">
                <Button variant="outline" size="sm" className="w-full">
                  View Data
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Team Dashboard */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Dashboard</CardTitle>
              <CardDescription className="text-sm">
                Complete team overview
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Open Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Competition Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Supports both FIRST programs</p>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary shadow-sm">
              FRC Compatible
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary shadow-sm">
              FTC Ready
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary shadow-sm">
              Offline Capable
            </Badge>
          </div>
        </div>
      </div>

      {/* Simple Footer - Pushed to bottom */}
      <footer className="mt-auto border-t bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {/* © 2025 TRC Athena Scouting. Built for FIRST Robotics teams. */}
            </p>
          </div>
        </div>
      </footer>
      {/* Subtle blob animation keyframes */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: scale(1) translateY(0px) translateX(0px); }
          33% { transform: scale(1.12) translateY(30px) translateX(40px); }
          66% { transform: scale(0.93) translateY(-20px) translateX(-30px); }
        }
        @keyframes blob2 {
          0%, 100% { transform: scale(1) translateY(0px) translateX(0px); }
          50% { transform: scale(1.13) translateY(-25px) translateX(25px); }
        }
        @keyframes blob3 {
          0%, 100% { transform: scale(1) translateY(0px) translateX(0px); }
          40% { transform: scale(1.08) translateY(10px) translateX(-10px); }
          80% { transform: scale(0.97) translateY(-10px) translateX(10px); }
        }
        .animate-blob {
          animation: blob 18s ease-in-out infinite;
        }
        .animate-blob2 {
          animation: blob2 22s ease-in-out infinite;
        }
        .animate-blob3 {
          animation: blob3 26s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
