"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Table2, TrendingUp, Activity } from "lucide-react";
import { useAnalysisStats } from "@/hooks/use-analysis-stats";
import { useGameConfig } from "@/hooks/use-game-config";
import { InsightSection, buildInsightResults } from "@/components/analysis/insights";

const StackedEPAChart = dynamic(
  () =>
    import("@/components/charts/stacked-epa-chart").then(
      (mod) => mod.StackedEPAChart,
    ),
  {
    loading: () => (
      <div className="text-sm text-muted-foreground">Loading chart...</div>
    ),
  },
);

const EPATable = dynamic(
  () => import("@/components/tables/epa-table").then((mod) => mod.EPATable),
  {
    loading: () => (
      <div className="text-sm text-muted-foreground">Loading table...</div>
    ),
  },
);

export default function Page() {
  const { stats, loading } = useAnalysisStats();
  const { getCurrentYearConfig } = useGameConfig();
  const currentConfig = getCurrentYearConfig();
  const insightDefinitions = useMemo(
    () => currentConfig?.analysisInsights?.insights ?? [], [currentConfig],
  );
  const insights = useMemo(
    () => buildInsightResults(insightDefinitions, stats.teamEPAData),
    [insightDefinitions, stats.teamEPAData],
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
        <p className="text-muted-foreground">
          Analyze team performance with EPA (Expected Points Added) metrics and
          visualizations
        </p>
      </div>

      {/* Analysis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teams Analyzed</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : stats.teamsAnalyzed}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Highest EPA</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : isNaN(stats.highestEPA)
                      ? "N/A"
                      : stats.highestEPA}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average EPA</p>
                <p className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : isNaN(stats.averageEPA)
                      ? "N/A"
                      : stats.averageEPA}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : stats.dataPoints}
                </p>
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
            Switch between chart and table views to explore team performance
            data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="graph" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="space-y-4">
              <StackedEPAChart data={stats.teamEPAData} />
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <EPATable
                data={stats.teamEPAData}
                metrics={stats.availableMetrics}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            Top and bottom teams based on configured insight metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading insights...
            </div>
          ) : insightDefinitions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No insights configured for this year.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {insights.map(({ definition, result }) => (
                <InsightSection
                  key={definition.id}
                  title={definition.title}
                  description={definition.description}
                  best={result.best}
                  worst={result.worst}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
