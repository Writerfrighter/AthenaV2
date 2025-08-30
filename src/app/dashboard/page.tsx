'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EventInfoCard } from "@/components/event-info-card"
import { 
  Trophy, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Calendar, 
  MapPin,
  Clock,
  Target,
  Award,
  Activity
} from "lucide-react"
import Link from "next/link"

import { useSelectedEvent } from "@/hooks/use-event-config"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

export default function Page() {
  const selectedEvent = useSelectedEvent();
  const { stats, loading } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your scouting overview for the current event.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEvent && (
            <>
              <Badge variant="outline" className="flex items-center gap-1 border-green-200 text-green-700">
                <MapPin className="h-3 w-3" />
                {selectedEvent.name}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {selectedEvent.region}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Scouted</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.teamsScouted}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `Pit scouting: ${stats.pitScoutingProgress.current}/${stats.pitScoutingProgress.total}`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Recorded</CardTitle>
            <ClipboardList className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.matchesRecorded}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `Qualification: ${stats.qualificationProgress.current}/${stats.qualificationProgress.total}`}
            </p>
          </CardContent>
        </Card>
        
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${stats.dataQuality}%`}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Teams with complete data"}
            </p>
          </CardContent>
        </Card> */}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `#${stats.ranking}`}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Based on EPA performance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Information */}
      <EventInfoCard />

      {/* Quick Actions & Event Progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Jump into scouting or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Link href="/scout/pitscout">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Start Pit Scouting
                </Button>
              </Link>
              
              <Link href="/scout/matchscout">
                <Button className="w-full justify-start" variant="outline">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Record Match Data
                </Button>
              </Link>
              
              <Link href="/dashboard/analysis">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
              
              <Link href="/dashboard/picklist">
                <Button className="w-full justify-start" variant="outline">
                  <Award className="mr-2 h-4 w-4" />
                  Update Picklist
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Event Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Event Progress
            </CardTitle>
            <CardDescription>
              Current competition status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualification Matches</span>
                <span>{loading ? "..." : `${stats.qualificationProgress.current}/${stats.qualificationProgress.total}`}</span>
              </div>
              <Progress value={loading ? 0 : (stats.qualificationProgress.current / stats.qualificationProgress.total) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pit Scouting</span>
                <span>{loading ? "..." : `${stats.pitScoutingProgress.current}/${stats.pitScoutingProgress.total}`}</span>
              </div>
              <Progress value={loading ? 0 : (stats.pitScoutingProgress.current / stats.pitScoutingProgress.total) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Data Analysis</span>
                <span>{loading ? "..." : stats.dataQuality > 80 ? "Complete" : "In Progress"}</span>
              </div>
              <Progress value={loading ? 0 : stats.dataQuality} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Next match: {loading ? "..." : (stats.nextMatch || "Event Complete")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Top Teams */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest scouting updates and data entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading activity...</div>
              ) : stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'pit' ? 'bg-green-500' :
                      activity.type === 'match' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Teams */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Teams</CardTitle>
            <CardDescription>
              Based on current scouting data and EPA rankings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading teams...</div>
              ) : stats.topTeams.length > 0 ? (
                stats.topTeams.map((team, index) => (
                  <div key={team.teamNumber} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 justify-center">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">Team {team.teamNumber}</p>
                        <p className="text-sm text-muted-foreground">{team.name}</p>
                      </div>
                    </div>
                    <Badge variant="default">{(isNaN(team.epa) ? 0 : team.epa).toFixed(1)} EPA</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">No team data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}