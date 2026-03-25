'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Target,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Loader2,
  Award,
  Star,
  TriangleAlert,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSelectedEvent } from "@/hooks/use-event-config"
import { useSPRData, type ScouterSPR } from "@/hooks/use-spr-data"

function getPerformanceBadge(percentile: number) {
  if (percentile >= 75) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Star className="h-3 w-3 mr-1" />Top 25%</Badge>
  }
  if (percentile >= 50) {
    return <Badge variant="secondary">Above Avg</Badge>
  }
  if (percentile >= 25) {
    return <Badge variant="outline">Below Avg</Badge>
  }
  return <Badge variant="destructive"><TriangleAlert className="h-3 w-3 mr-1" />Needs Help</Badge>
}

function getDisplayName(scouter: ScouterSPR) {
  return scouter.scouterName || scouter.scouterId;
}

export default function SPRPage() {
  const selectedEvent = useSelectedEvent()
  const { data, loading, error, refetch } = useSPRData()

  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scouter Performance</h1>
          <p className="text-muted-foreground">Select an event to view scouter performance ratings.</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No event selected. Please select an event from the sidebar to see SPR data.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scouter Performance</h1>
          <p className="text-muted-foreground">
            Scouter Performance Rating (SPR) — accuracy analysis for {selectedEvent.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Calculating scouter performance ratings...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="gap-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 -pb-1">
                <CardTitle className="text-sm font-medium">Mean Error</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overallMeanError.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  points per alliance
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 -pb-1">
                <CardTitle className="text-sm font-medium">Scouters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.metadata.uniqueScouters}</div>
                <p className="text-xs text-muted-foreground">
                  active scouters analyzed
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 -pb-1">
                <CardTitle className="text-sm font-medium">Match Entries</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.metadata.totalMatches}</div>
                <p className="text-xs text-muted-foreground">
                  scouted entries with IDs
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 -pb-1">
                <CardTitle className="text-sm font-medium">Official Results</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.metadata.officialResultsCount}</div>
                <p className="text-xs text-muted-foreground">
                  matches with official scores
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Warning Message */}
          {data.message && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{data.message}</AlertDescription>
            </Alert>
          )}

          {/* Scouter Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Scouter Rankings</CardTitle>
              <CardDescription>
                Ranked by error contribution — lower error value means more accurate scouting.
                SPR uses a least-squares method similar to OPR to isolate each scouter&apos;s accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Scouter</TableHead>
                    <TableHead className="text-right">Error Value</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">Total Error</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.scouters.map((scouter, index) => (
                    <TableRow key={scouter.scouterId} className="">
                      <TableCell className="font-medium my-1">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium my-1">{getDisplayName(scouter)}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono my-1">{scouter.errorValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right my-1">{scouter.matchesScounted}</TableCell>
                      <TableCell className="text-right font-mono my-1">{scouter.totalAbsoluteError.toFixed(1)}</TableCell>
                      <TableCell className="text-center my-1">{getPerformanceBadge(scouter.percentile)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.scouters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No scouter data available. Make sure match entries have scouter IDs assigned.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scouter Detail Cards */}
          {data.scouters.length >= 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Best Performer */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="-mb-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
                    Best Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{getDisplayName(data.scouters[0])}</div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Error Value: <span className="font-mono font-medium text-foreground">{data.scouters[0].errorValue.toFixed(2)}</span></p>
                    <p>Matches Scouted: <span className="font-medium text-foreground">{data.scouters[0].matchesScounted}</span></p>
                    <p>Total Absolute Error: <span className="font-mono font-medium text-foreground">{data.scouters[0].totalAbsoluteError.toFixed(1)}</span></p>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Accuracy</span>
                      <span>{data.scouters[0].percentile}th percentile</span>
                    </div>
                    <Progress value={data.scouters[0].percentile} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Needs Improvement */}
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="-mb-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-orange-500" />
                    Needs Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{getDisplayName(data.scouters[data.scouters.length - 1])}</div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Error Value: <span className="font-mono font-medium text-foreground">{data.scouters[data.scouters.length - 1].errorValue.toFixed(2)}</span></p>
                    <p>Matches Scouted: <span className="font-medium text-foreground">{data.scouters[data.scouters.length - 1].matchesScounted}</span></p>
                    <p>Total Absolute Error: <span className="font-mono font-medium text-foreground">{data.scouters[data.scouters.length - 1].totalAbsoluteError.toFixed(1)}</span></p>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Accuracy</span>
                      <span>{data.scouters[data.scouters.length - 1].percentile}th percentile</span>
                    </div>
                    <Progress value={data.scouters[data.scouters.length - 1].percentile} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
