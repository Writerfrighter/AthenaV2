'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trophy, Target, Activity, BarChart, Package } from 'lucide-react';
import TeamInfo from '@/components/team-pages-common/TeamInfo';
import TeamNotes from '@/components/team-pages-common/TeamNotes';
import { useTeamData } from '@/hooks/use-team-data';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TeamPageProps {
  teamNumber: string;
}

// DECODE 2026 specific data structure
interface DecodeData {
  avg_total: number;
  epa: number;
  avg_auto_artifacts: number;
  avg_auto_patterns: number;
  avg_teleop_artifacts: number;
  avg_teleop_patterns: number;
  avg_endgame_base: number;

  // Detailed autonomous breakdown
  auto_artifacts_classified: number;
  auto_artifacts_overflow: number;
  auto_patterns: number;

  // Detailed teleop breakdown
  teleop_artifacts_classified: number;
  teleop_artifacts_overflow: number;
  teleop_artifacts_depot: number;
  teleop_patterns: number;

  // Endgame
  endgame_state: string;
}

export function FTCTeam2026Page({ teamNumber }: TeamPageProps) {
  const [searchNote, setSearchNote] = useState("");
  const { teamData, loading, error } = useTeamData(teamNumber);

  // Calculate DECODE specific statistics using the SQL data
  const calculateDecodeStats = (): DecodeData | null => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const matchEntries = teamData.matchEntries;
    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous as Record<string, number> | undefined || {};
      const teleop = match.gameSpecificData?.teleop as Record<string, number> | undefined || {};

      return {
        auto_artifacts_classified: acc.auto_artifacts_classified + (auto.artifacts_classified || 0),
        auto_artifacts_overflow: acc.auto_artifacts_overflow + (auto.artifacts_overflow || 0),
        auto_patterns: acc.auto_patterns + (auto.patterns || 0),

        teleop_artifacts_classified: acc.teleop_artifacts_classified + (teleop.artifacts_classified || 0),
        teleop_artifacts_overflow: acc.teleop_artifacts_overflow + (teleop.artifacts_overflow || 0),
        teleop_artifacts_depot: acc.teleop_artifacts_depot + (teleop.artifacts_depot || 0),
        teleop_patterns: acc.teleop_patterns + (teleop.patterns || 0),
      };
    }, {
      auto_artifacts_classified: 0, auto_artifacts_overflow: 0, auto_patterns: 0,
      teleop_artifacts_classified: 0, teleop_artifacts_overflow: 0, teleop_artifacts_depot: 0, teleop_patterns: 0
    });

    const count = matchEntries.length;

    // Calculate averages and points
    const autoArtifactsClassified = parseFloat((totals.auto_artifacts_classified / count).toFixed(1));
    const autoArtifactsOverflow = parseFloat((totals.auto_artifacts_overflow / count).toFixed(1));
    const autoPatterns = parseFloat((totals.auto_patterns / count).toFixed(1));
    
    const teleopArtifactsClassified = parseFloat((totals.teleop_artifacts_classified / count).toFixed(1));
    const teleopArtifactsOverflow = parseFloat((totals.teleop_artifacts_overflow / count).toFixed(1));
    const teleopArtifactsDepot = parseFloat((totals.teleop_artifacts_depot / count).toFixed(1));
    const teleopPatterns = parseFloat((totals.teleop_patterns / count).toFixed(1));

    return {
      avg_total: teamData.epa?.totalEPA || 0,
      epa: teamData.epa?.totalEPA || 0,
      avg_auto_artifacts: autoArtifactsClassified + autoArtifactsOverflow,
      avg_auto_patterns: autoPatterns,
      avg_teleop_artifacts: teleopArtifactsClassified + teleopArtifactsOverflow + teleopArtifactsDepot,
      avg_teleop_patterns: teleopPatterns,
      avg_endgame_base: 0, // Would need to calculate from endgame data

      auto_artifacts_classified: autoArtifactsClassified,
      auto_artifacts_overflow: autoArtifactsOverflow,
      auto_patterns: autoPatterns,

      teleop_artifacts_classified: teleopArtifactsClassified,
      teleop_artifacts_overflow: teleopArtifactsOverflow,
      teleop_artifacts_depot: teleopArtifactsDepot,
      teleop_patterns: teleopPatterns,

      endgame_state: "Full Base", // Would come from endgame data
    };
  };

  const decodeData = calculateDecodeStats();

  // Chart data for artifact scoring breakdown
  const artifactBreakdownData = decodeData ? [
    { name: 'Auto Classified', value: decodeData.auto_artifacts_classified, fill: '#8b5cf6' },
    { name: 'Auto Overflow', value: decodeData.auto_artifacts_overflow, fill: '#a78bfa' },
    { name: 'Teleop Classified', value: decodeData.teleop_artifacts_classified, fill: '#3b82f6' },
    { name: 'Teleop Overflow', value: decodeData.teleop_artifacts_overflow, fill: '#60a5fa' },
    { name: 'Teleop Depot', value: decodeData.teleop_artifacts_depot, fill: '#93c5fd' },
  ] : [];

  // Point breakdown pie chart
  const pointBreakdownData = decodeData ? [
    { name: 'Auto Artifacts', value: (decodeData.auto_artifacts_classified * 3) + (decodeData.auto_artifacts_overflow * 1), fill: '#8b5cf6' },
    { name: 'Auto Patterns', value: decodeData.auto_patterns * 6, fill: '#a78bfa' },
    { name: 'Teleop Artifacts', value: (decodeData.teleop_artifacts_classified * 3) + (decodeData.teleop_artifacts_overflow * 1) + (decodeData.teleop_artifacts_depot * 1), fill: '#3b82f6' },
    { name: 'Teleop Patterns', value: decodeData.teleop_patterns * 6, fill: '#60a5fa' },
  ] : [];

  // Transform for shadcn chart
  const chartData = pointBreakdownData.map((item) => ({
    browser: item.name,
    visitors: item.value,
    fill: item.fill
  }));

  const chartConfig = {
    visitors: {
      label: "Points: ",
    },
    "Auto Artifacts": {
      label: "Auto Artifacts: ",
      color: "#8b5cf6",
    },
    "Auto Patterns": {
      label: "Auto Patterns: ",
      color: "#a78bfa",
    },
    "Teleop Artifacts": {
      label: "Teleop Artifacts: ",
      color: "#3b82f6",
    },
    "Teleop Patterns": {
      label: "Teleop Patterns: ",
      color: "#60a5fa",
    },
  } satisfies ChartConfig;

  // Extract actual notes from team data
  const extractTeamNotes = (): string[] => {
    const notes: string[] = [];
    
    // Add notes from match entries
    if (teamData?.matchEntries) {
      teamData.matchEntries.forEach(match => {
        if (match.notes && match.notes.trim()) {
          notes.push(match.notes.trim());
        }
      });
    }
    
    // Add notes from pit entry if available
    if (teamData?.pitEntry) {
      const pitData = teamData.pitEntry.gameSpecificData;
      if (pitData && typeof pitData === 'object') {
        Object.entries(pitData).forEach(([key, value]) => {
          if (key.toLowerCase().includes('note') && typeof value === 'string' && value.trim()) {
            notes.push(value.trim());
          }
        });
      }
    }
    
    // Remove duplicates and return
    return [...new Set(notes)];
  };

  const teamNotes = extractTeamNotes();
  const filteredNotes = teamNotes.filter(note =>
    note.toLowerCase().includes(searchNote.toLowerCase())
  );

  // Chart configuration for artifact breakdown
  const artifactChartConfig = {
    value: {
      label: "Avg Artifacts",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2026 - DECODE
        </Badge>
        <p className="text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2026 - DECODE
        </Badge>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!teamData?.matchEntries || teamData.matchEntries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2026 - DECODE
        </Badge>
        <p className="text-muted-foreground">No data available for Team {teamNumber} in 2026.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground">2026 DECODE performance analysis and scouting data</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            FTC INTO THE DEEP
          </Badge>
        </div>
      </div>

      {/* Basic Info - No Robot Image for FTC */}
      <div className="grid gap-6">
        <TeamInfo 
          teamNumber={teamNumber} 
          driveTrain={teamData?.pitEntry?.driveTrain} 
          weight={teamData?.pitEntry?.weight} 
          matches={teamData?.matchCount} 
        />

        <Button className="w-full md:w-auto" variant="outline">
          <ExternalLink className="mr-2 h-4 w-4" />
          Visit Team Website
        </Button>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {decodeData ? (isNaN(decodeData.avg_total) ? 0 : decodeData.avg_total).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Total points per match</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EPA Rating</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {decodeData ? (isNaN(decodeData.epa) ? 0 : decodeData.epa).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Expected points added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Artifacts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {decodeData ? (isNaN(decodeData.avg_auto_artifacts) ? 0 : decodeData.avg_auto_artifacts).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Average autonomous artifacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teleop Artifacts</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {decodeData?.avg_teleop_artifacts.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Average teleop artifacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Autonomous Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Autonomous Performance</CardTitle>
            <CardDescription>Detailed breakdown of autonomous period scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Classified</span>
                <span className="font-medium">{decodeData?.auto_artifacts_classified.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Overflow</span>
                <span className="font-medium">{decodeData?.auto_artifacts_overflow.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Patterns Completed</span>
                <span className="font-medium">{decodeData?.auto_patterns.toFixed(1) || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm">Total Auto Points</span>
                  <span>
                    {decodeData 
                      ? ((decodeData.auto_artifacts_classified * 3) + 
                         (decodeData.auto_artifacts_overflow * 1) + 
                         (decodeData.auto_patterns * 6)).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teleop Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Teleop Performance</CardTitle>
            <CardDescription>Detailed breakdown of teleop period scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Classified</span>
                <span className="font-medium">{decodeData?.teleop_artifacts_classified.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts Overflow</span>
                <span className="font-medium">{decodeData?.teleop_artifacts_overflow.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Artifacts in Depot</span>
                <span className="font-medium">{decodeData?.teleop_artifacts_depot.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Patterns Completed</span>
                <span className="font-medium">{decodeData?.teleop_patterns.toFixed(1) || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm">Total Teleop Points</span>
                  <span>
                    {decodeData 
                      ? ((decodeData.teleop_artifacts_classified * 3) + 
                         (decodeData.teleop_artifacts_overflow * 1) + 
                         (decodeData.teleop_artifacts_depot * 1) + 
                         (decodeData.teleop_patterns * 6)).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Artifact Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Artifact Scoring Breakdown</CardTitle>
            <CardDescription>Average artifacts by scoring method</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={artifactChartConfig}>
              <RechartsBarChart data={artifactBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" radius={8}>
                  {artifactBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Point Distribution Chart */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Point Distribution</CardTitle>
            <CardDescription>Breakdown of scoring methods</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Pie data={chartData} dataKey="visitors" nameKey="browser" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Completion Performance</CardTitle>
          <CardDescription>Patterns completed during matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Autonomous Patterns</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average per Match</span>
                  <Badge variant="secondary">{decodeData?.auto_patterns.toFixed(1) || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points Contribution</span>
                  <Badge variant="secondary">
                    {decodeData ? (decodeData.auto_patterns * 6).toFixed(1) : 0} pts
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Teleop Patterns</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average per Match</span>
                  <Badge variant="secondary">{decodeData?.teleop_patterns.toFixed(1) || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points Contribution</span>
                  <Badge variant="secondary">
                    {decodeData ? (decodeData.teleop_patterns * 6).toFixed(1) : 0} pts
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scouting Notes */}
      <TeamNotes notes={teamNotes} searchNote={searchNote} setSearchNote={setSearchNote} />
    </div>
  );
}
