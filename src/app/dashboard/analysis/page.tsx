'use client';

import { EPATable } from "@/components/epa-table"
import { StackedEPAChart } from "@/components/stacked-epa-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BarChart3, Table2, TrendingUp, Activity } from "lucide-react"
import { useAnalysisStats } from "@/hooks/use-analysis-stats"

export default function Page() {
  const { stats, loading } = useAnalysisStats();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analysis</h1>
        <p className="text-muted-foreground">
          Analyze team performance with EPA (Expected Points Added) metrics and visualizations
        </p>
      </div>

      {/* Analysis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teams Analyzed</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.teamsAnalyzed}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Highest EPA</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.highestEPA}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average EPA</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.averageEPA}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">{loading ? "..." : stats.dataPoints}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Table2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Views */}
      <Card>
        <CardHeader>
          <CardTitle>EPA Analysis</CardTitle>
          <CardDescription>
            Switch between chart and table views to explore team performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='graph' className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="graph" 
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
              <TabsTrigger 
                value="table" 
                className="flex items-center gap-2"
              >
                <Table2 className="h-4 w-4" />
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="space-y-4">
              <StackedEPAChart data={stats.teamEPAData} />
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <EPATable data={stats.teamEPAData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}