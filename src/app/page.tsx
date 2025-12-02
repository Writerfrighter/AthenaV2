'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, LogIn, ArrowRight } from "lucide-react"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import Link from "next/link"
import Image from "next/image"

export default function Page() {
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
                src="/TRCLogo.webp"
                alt="TRC Scouting Logo"
                width={40}
                height={40}
                className="rounded"
              />
            </div>
            <span className="font-bold text-lg">Athena</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link href="/scout/pitscout" className="group">
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center">
                  <h3 className="font-bold text-lg mb-2">Pit Scouting</h3>
                  <p className="text-sm text-muted-foreground">Robot capabilities & team data</p>
                </div>
              </Link>

              <Link href="/scout/matchscout" className="group">
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center">
                  <h3 className="font-bold text-lg mb-2">Match Scouting</h3>
                  <p className="text-sm text-muted-foreground">Live match data collection</p>
                </div>
              </Link>

              <Link href="/dashboard/analysis" className="group">
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center">
                  <h3 className="font-bold text-lg mb-2">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Performance data & trends</p>
                </div>
              </Link>

              <Link href="/dashboard" className="group">
                <div className="relative h-48 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 flex flex-col justify-center items-center text-center">
                  <h3 className="font-bold text-lg mb-2">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Complete team overview</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 1 - FRC Compatible */}
      <section className="relative z-10 w-full py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                FRC Compatible
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Optimized for FIRST Robotics Competition teams. Athena V2 provides comprehensive scouting tools designed specifically for FRC competition requirements, enabling teams to collect and analyze performance data with precision.
              </p>
              <Link href="/scout/matchscout">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-square rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden">
                <Image
                  src="/TRCLogo.webp"
                  alt="FRC Robot"
                  width={400}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 2 - FTC Ready */}
      <section className="relative z-10 w-full py-16 sm:py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-lg bg-background flex items-center justify-center overflow-hidden">
                <Image
                  src="/TRCLogo.webp"
                  alt="FTC Robot"
                  width={400}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                FTC Ready
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                While built for FRC, Athena V2 is equally prepared for FIRST Tech Challenge teams. Flexible configuration and adaptable forms make it easy to scout FTC competitions with the same powerful analytics and offline capabilities.
              </p>
              <Link href="/scout/pitscout">
                <Button variant="outline" size="lg" className="gap-2">
                  GET STARTED <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 3 - Offline Capabilities */}
      <section className="relative z-10 w-full py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="outline" className="mb-4">FEATURES</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Offline Capabilities
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
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-square rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden">
                <Image
                  src="/TRCLogo.webp"
                  alt="Offline Scouting"
                  width={400}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
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
