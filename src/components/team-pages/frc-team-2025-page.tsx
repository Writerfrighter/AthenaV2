'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, Trophy, Target, Activity, BarChart, MapPin } from 'lucide-react';
import TeamInfo from '@/components/team-pages-common/TeamInfo';
import TeamImage from '@/components/team-pages-common/TeamImage';
import TeamNotes from '@/components/team-pages-common/TeamNotes';
import { useTeamData } from '@/hooks/use-team-data';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Team2025PageProps {
  teamNumber: string;
}

// REEFSCAPE 2025 specific data structure
interface ReefscapeData {
  avg_total: number;
  epa: number;
  avg_auto_coral: number;
  avg_auto_algae: number;
  avg_teleop_coral: number;
  avg_teleop_algae: number;
  endgame_state: string;

  // Detailed autonomous breakdown
  auto_trough: number;
  auto_l2: number;
  auto_l3: number;
  auto_l4: number;
  auto_net: number;
  auto_processor: number;
  auto_missed_coral: number;
  auto_missed_algae: number;

  // Detailed teleop breakdown
  teleop_trough: number;
  teleop_l2: number;
  teleop_l3: number;
  teleop_l4: number;
  teleop_net: number;
  teleop_processor: number;
  teleop_missed_coral: number;
  teleop_missed_algae: number;
}

export function FRCTeam2025Page({ teamNumber }: Team2025PageProps) {
  const [searchNote, setSearchNote] = useState("");
  const { teamData, loading, error } = useTeamData(teamNumber);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [loadingAvgScore, setLoadingAvgScore] = useState(false);

  // Fetch average score from The Blue Alliance
  useEffect(() => {
    async function fetchAverageScore() {
      if (!teamData?.year || !teamData?.eventCode) return;
      
      setLoadingAvgScore(true);
      try {
        const response = await fetch(
          `/api/team/${teamNumber}/average-score?year=${teamData.year}&eventCode=${teamData.eventCode}&competitionType=FRC`
        );
        
        if (response.ok) {
          const data = await response.json();
          setAverageScore(data.averageScore || 0);
        }
      } catch (error) {
        console.error('Error fetching average score from TBA:', error);
      } finally {
        setLoadingAvgScore(false);
      }
    }

    fetchAverageScore();
  }, [teamNumber, teamData?.year, teamData?.eventCode]);

  // Calculate REEFSCAPE specific statistics using the SQL data
  const calculateReefscapeStats = (): ReefscapeData | null => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const matchEntries = teamData.matchEntries;
    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous as Record<string, number> | undefined || {};
      const teleop = match.gameSpecificData?.teleop as Record<string, number> | undefined || {};

      return {
        auto_l1: acc.auto_l1 + (auto.L1_coral || 0),
        auto_l2: acc.auto_l2 + (auto.L2_coral || 0),
        auto_l3: acc.auto_l3 + (auto.L3_coral || 0),
        auto_l4: acc.auto_l4 + (auto.L4_coral || 0),
        auto_net: acc.auto_net + (auto.net_algae || 0),
        auto_processor: acc.auto_processor + (auto.processor_algae || 0),

        teleop_l1: acc.teleop_l1 + (teleop.L1_coral || 0),
        teleop_l2: acc.teleop_l2 + (teleop.L2_coral || 0),
        teleop_l3: acc.teleop_l3 + (teleop.L3_coral || 0),
        teleop_l4: acc.teleop_l4 + (teleop.L4_coral || 0),
        teleop_net: acc.teleop_net + (teleop.net_algae || 0),
        teleop_processor: acc.teleop_processor + (teleop.processor_algae || 0),
      };
    }, {
      auto_l1: 0, auto_l2: 0, auto_l3: 0, auto_l4: 0, auto_net: 0, auto_processor: 0,
      teleop_l1: 0, teleop_l2: 0, teleop_l3: 0, teleop_l4: 0, teleop_net: 0, teleop_processor: 0
    });
    // console.log(totals);
    const count = matchEntries.length;

    return {
      avg_total: averageScore, // Use average score from TBA instead of EPA
      epa: teamData.epa?.totalEPA || 0,
      avg_auto_coral: parseFloat(((totals.auto_l1 + totals.auto_l2 + totals.auto_l3 + totals.auto_l4) / count).toFixed(1)),
      avg_auto_algae: parseFloat(((totals.auto_processor + totals.auto_net) / count).toFixed(1)),
      avg_teleop_coral: parseFloat(((totals.teleop_l1 + totals.teleop_l2 + totals.teleop_l3 + totals.teleop_l4) / count).toFixed(1)),
      avg_teleop_algae: parseFloat(((totals.teleop_processor + totals.teleop_net) / count).toFixed(1)),
      endgame_state: "Deep Climbing", // This would come from endgame data

      auto_trough: parseFloat((totals.auto_l1 / count).toFixed(1)),
      auto_l2: parseFloat((totals.auto_l2 / count).toFixed(1)),
      auto_l3: parseFloat((totals.auto_l3 / count).toFixed(1)),
      auto_l4: parseFloat((totals.auto_l4 / count).toFixed(1)),
      auto_net: parseFloat((totals.auto_net / count).toFixed(1)),
      auto_processor: parseFloat((totals.auto_processor / count).toFixed(1)),
      auto_missed_coral: 0, // Not tracked in current schema
      auto_missed_algae: 0, // Not tracked in current schema

      teleop_trough: parseFloat((totals.teleop_l1 / count).toFixed(1)),
      teleop_l2: parseFloat((totals.teleop_l2 / count).toFixed(1)),
      teleop_l3: parseFloat((totals.teleop_l3 / count).toFixed(1)),
      teleop_l4: parseFloat((totals.teleop_l4 / count).toFixed(1)),
      teleop_net: parseFloat((totals.teleop_net / count).toFixed(1)),
      teleop_processor: parseFloat((totals.teleop_processor / count).toFixed(1)),
      teleop_missed_coral: 0, // Not tracked in current schema
      teleop_missed_algae: 0, // Not tracked in current schema
    };
  };

  const reefscapeData = calculateReefscapeStats();

  // Chart data for teleop breakdown
  const teleopBreakdownData = reefscapeData ? [
    { name: 'Trough', value: reefscapeData.teleop_trough },
    { name: 'L2', value: reefscapeData.teleop_l2 },
    { name: 'L3', value: reefscapeData.teleop_l3 },
    { name: 'L4', value: reefscapeData.teleop_l4 },
    { name: 'Net', value: reefscapeData.teleop_net },
    { name: 'Processor', value: reefscapeData.teleop_processor },
  ] : [];

  // Point breakdown pie chart
  const pointBreakdownData = reefscapeData ? [
    { name: 'Auto Coral', value: reefscapeData.avg_auto_coral * 3, fill: '#ff6b6b' },
    { name: 'Auto Algae', value: reefscapeData.avg_auto_algae * 5, fill: '#4ecdc4' },
    { name: 'Tele Coral', value: reefscapeData.avg_teleop_coral * 3, fill: '#ff9999' },
    { name: 'Tele Algae', value: reefscapeData.avg_teleop_algae * 5, fill: '#7fdddd' },
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
    "Auto Coral": {
      label: "Auto Coral: ",
      color: "#ff6b6b",
    },
    "Auto Algae": {
      label: "Auto Algae: ",
      color: "#4ecdc4",
    },
    "Teleop Coral": {
      label: "Teleop Coral: ",
      color: "#ff9999",
    },
    "Teleop Algae": {
      label: "Teleop Algae: ",
      color: "#7fdddd",
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
      // Check if there are notes in gameSpecificData
      const pitData = teamData.pitEntry.gameSpecificData;
      if (pitData && typeof pitData === 'object') {
        // Look for notes fields in game-specific data
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

  // Chart configuration for teleop breakdown
  const teleopChartConfig = {
    value: {
      label: "Avg Coral",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2025 - REEFSCAPE
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
          2025 - REEFSCAPE
        </Badge>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  // console.log("Team Data:", teamData);
  if (!teamData?.matchEntries || teamData.matchEntries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2025 - REEFSCAPE
        </Badge>
        <p className="text-muted-foreground">No data available for Team {teamNumber} in 2025.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted-foreground">2025 REEFSCAPE performance analysis and scouting data</p>
        </div>
      </div>

      {/* Robot Image and Basic Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <TeamImage teamNumber={teamNumber} yearLabel="2025 REEFSCAPE" />
        </div>

        <div className="space-y-4">
          <TeamInfo teamNumber={teamNumber} driveTrain={teamData?.pitEntry?.driveTrain} weight={teamData?.pitEntry?.weight} matches={teamData?.matchCount} />

          <Button className="w-full" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Team Website
          </Button>
        </div>
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
              {reefscapeData ? (isNaN(reefscapeData.avg_total) ? 0 : reefscapeData.avg_total).toFixed(1) : 0}
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
              {reefscapeData ? (isNaN(reefscapeData.epa) ? 0 : reefscapeData.epa).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Expected points added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Coral</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reefscapeData ? (isNaN(reefscapeData.avg_auto_coral) ? 0 : reefscapeData.avg_auto_coral).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Average autonomous coral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teleop Coral</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reefscapeData?.avg_teleop_coral.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Average teleop coral</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">L2</span>
                  <span className="font-medium">{reefscapeData?.auto_l2.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">L3</span>
                  <span className="font-medium">{reefscapeData?.auto_l3.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">L4</span>
                  <span className="font-medium">{reefscapeData?.auto_l4.toFixed(1) || 0}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Net</span>
                  <span className="font-medium">{reefscapeData?.auto_net.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processor</span>
                  <span className="font-medium">{reefscapeData?.auto_processor.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Trough</span>
                  <span className="font-medium">{reefscapeData?.auto_trough.toFixed(1) || 0}</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">L2</span>
                  <span className="font-medium">{reefscapeData?.teleop_l2.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">L3</span>
                  <span className="font-medium">{reefscapeData?.teleop_l3.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">L4</span>
                  <span className="font-medium">{reefscapeData?.teleop_l4.toFixed(1) || 0}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Net</span>
                  <span className="font-medium">{reefscapeData?.teleop_net.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processor</span>
                  <span className="font-medium">{reefscapeData?.teleop_processor.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Trough</span>
                  <span className="font-medium">{reefscapeData?.teleop_trough.toFixed(1) || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Teleop Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Teleop Scoring Breakdown</CardTitle>
            <CardDescription>Average points by scoring location</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={teleopChartConfig}>
              <RechartsBarChart data={teleopBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={8} />
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

  {/* Scouting Notes */}
  <TeamNotes notes={teamNotes} searchNote={searchNote} setSearchNote={setSearchNote} />
    </div>
  );
}
