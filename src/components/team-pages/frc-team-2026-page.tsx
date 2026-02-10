'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trophy, Target, Activity, BarChart, Flame, AlertTriangle } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

// REBUILT 2026 specific data structure
interface RebuiltData {
  avg_total: number;
  epa: number;

  // Autonomous
  auto_fuel_scored: number;
  auto_climb_rate: number; // percentage of matches with auto L1 climb

  // Teleop
  teleop_fuel_scored: number;
  teleop_fuel_missed: number;
  teleop_fuel_passed: number;
  teleop_fuel_corraled: number;
  teleop_fuel_accuracy: number; // scored / (scored + missed) percentage

  // Endgame
  endgame_breakdown_rate: number; // percentage of matches robot broke down
  endgame_none_rate: number;
  endgame_l1_rate: number;
  endgame_l2_rate: number;
  endgame_l3_rate: number;

  // Fouls
  avg_fouls: number;
  avg_tech_fouls: number;
}

export function FRCTeam2026Page({ teamNumber }: TeamPageProps) {
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

  // Calculate REBUILT specific statistics using the SQL data
  const calculateRebuiltStats = (): RebuiltData | null => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const matchEntries = teamData.matchEntries;
    const count = matchEntries.length;

    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous as Record<string, number> | undefined || {};
      const teleop = match.gameSpecificData?.teleop as Record<string, number> | undefined || {};
      const endgame = match.gameSpecificData?.endgame as Record<string, string | number | boolean> | undefined || {};
      const fouls = match.gameSpecificData?.fouls as Record<string, number> | undefined || {};

      return {
        auto_fuel_scored: acc.auto_fuel_scored + (auto.fuel_scored || 0),
        auto_climb: acc.auto_climb + (auto.climb ? 1 : 0),

        teleop_fuel_scored: acc.teleop_fuel_scored + (teleop.fuel_scored || 0),
        teleop_fuel_missed: acc.teleop_fuel_missed + (teleop.fuel_missed || 0),
        teleop_fuel_passed: acc.teleop_fuel_passed + (teleop.fuel_passed || 0),
        teleop_fuel_corraled: acc.teleop_fuel_corraled + (teleop.fuel_corraled || 0),

        endgame_broke_down: acc.endgame_broke_down + (endgame.robot_broke_down ? 1 : 0),
        endgame_none: acc.endgame_none + (endgame.ending_robot_state === 'none' || !endgame.ending_robot_state ? 1 : 0),
        endgame_l1: acc.endgame_l1 + (endgame.ending_robot_state === 'L1' ? 1 : 0),
        endgame_l2: acc.endgame_l2 + (endgame.ending_robot_state === 'L2' ? 1 : 0),
        endgame_l3: acc.endgame_l3 + (endgame.ending_robot_state === 'L3' ? 1 : 0),

        fouls: acc.fouls + (fouls.fouls || 0),
        tech_fouls: acc.tech_fouls + (fouls.tech_fouls || 0),
      };
    }, {
      auto_fuel_scored: 0, auto_climb: 0,
      teleop_fuel_scored: 0, teleop_fuel_missed: 0, teleop_fuel_passed: 0, teleop_fuel_corraled: 0,
      endgame_broke_down: 0, endgame_none: 0, endgame_l1: 0, endgame_l2: 0, endgame_l3: 0,
      fouls: 0, tech_fouls: 0,
    });

    const totalFuelShots = totals.teleop_fuel_scored + totals.teleop_fuel_missed;

    return {
      avg_total: averageScore,
      epa: teamData.epa?.totalEPA || 0,

      auto_fuel_scored: parseFloat((totals.auto_fuel_scored / count).toFixed(1)),
      auto_climb_rate: parseFloat(((totals.auto_climb / count) * 100).toFixed(1)),

      teleop_fuel_scored: parseFloat((totals.teleop_fuel_scored / count).toFixed(1)),
      teleop_fuel_missed: parseFloat((totals.teleop_fuel_missed / count).toFixed(1)),
      teleop_fuel_passed: parseFloat((totals.teleop_fuel_passed / count).toFixed(1)),
      teleop_fuel_corraled: parseFloat((totals.teleop_fuel_corraled / count).toFixed(1)),
      teleop_fuel_accuracy: totalFuelShots > 0
        ? parseFloat(((totals.teleop_fuel_scored / totalFuelShots) * 100).toFixed(1))
        : 0,

      endgame_breakdown_rate: parseFloat(((totals.endgame_broke_down / count) * 100).toFixed(1)),
      endgame_none_rate: parseFloat(((totals.endgame_none / count) * 100).toFixed(1)),
      endgame_l1_rate: parseFloat(((totals.endgame_l1 / count) * 100).toFixed(1)),
      endgame_l2_rate: parseFloat(((totals.endgame_l2 / count) * 100).toFixed(1)),
      endgame_l3_rate: parseFloat(((totals.endgame_l3 / count) * 100).toFixed(1)),

      avg_fouls: parseFloat((totals.fouls / count).toFixed(1)),
      avg_tech_fouls: parseFloat((totals.tech_fouls / count).toFixed(1)),
    };
  };

  const rebuiltData = calculateRebuiltStats();

  // Chart data for fuel scoring breakdown
  const fuelBreakdownData = rebuiltData ? [
    { name: 'Auto Fuel', value: rebuiltData.auto_fuel_scored, fill: '#f97316' },
    { name: 'Teleop Scored', value: rebuiltData.teleop_fuel_scored, fill: '#ef4444' },
    { name: 'Teleop Missed', value: rebuiltData.teleop_fuel_missed, fill: '#94a3b8' },
    { name: 'Teleop Passed', value: rebuiltData.teleop_fuel_passed, fill: '#3b82f6' },
    { name: 'Teleop Corraled', value: rebuiltData.teleop_fuel_corraled, fill: '#22c55e' },
  ] : [];

  // Point breakdown pie chart
  const pointBreakdownData = rebuiltData ? [
    { name: 'Auto Fuel', value: rebuiltData.auto_fuel_scored * 1, fill: '#f97316' },
    { name: 'Auto Climb', value: (rebuiltData.auto_climb_rate / 100) * 15, fill: '#fb923c' },
    { name: 'Teleop Fuel', value: rebuiltData.teleop_fuel_scored * 1, fill: '#ef4444' },
    { name: 'Endgame Climb', value: (rebuiltData.endgame_l1_rate / 100) * 10 + (rebuiltData.endgame_l2_rate / 100) * 20 + (rebuiltData.endgame_l3_rate / 100) * 30, fill: '#8b5cf6' },
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
    "Auto Fuel": {
      label: "Auto Fuel: ",
      color: "#f97316",
    },
    "Auto Climb": {
      label: "Auto Climb: ",
      color: "#fb923c",
    },
    "Teleop Fuel": {
      label: "Teleop Fuel: ",
      color: "#ef4444",
    },
    "Endgame Climb": {
      label: "Endgame Climb: ",
      color: "#8b5cf6",
    },
  } satisfies ChartConfig;

  // Endgame breakdown for bar chart
  const endgameBreakdownData = rebuiltData ? [
    { name: 'None', value: rebuiltData.endgame_none_rate },
    { name: 'L1', value: rebuiltData.endgame_l1_rate },
    { name: 'L2', value: rebuiltData.endgame_l2_rate },
    { name: 'L3', value: rebuiltData.endgame_l3_rate },
  ] : [];

  // Radar chart data – normalize key stats to 0-100 scale for a "robot strength" overview
  const radarData = rebuiltData ? [
    {
      stat: 'Auto Fuel',
      value: Math.min(rebuiltData.auto_fuel_scored * 10, 100), // scale: 10 fuel → 100
      fullMark: 100,
    },
    {
      stat: 'Auto Climb',
      value: rebuiltData.auto_climb_rate,
      fullMark: 100,
    },
    {
      stat: 'Teleop Fuel',
      value: Math.min(rebuiltData.teleop_fuel_scored * 5, 100), // scale: 20 fuel → 100
      fullMark: 100,
    },
    {
      stat: 'Accuracy',
      value: rebuiltData.teleop_fuel_accuracy,
      fullMark: 100,
    },
    {
      stat: 'Climb Level',
      value: Math.min(
        (rebuiltData.endgame_l1_rate * 0.33 +
          rebuiltData.endgame_l2_rate * 0.66 +
          rebuiltData.endgame_l3_rate * 1.0),
        100
      ),
      fullMark: 100,
    },
    {
      stat: 'Reliability',
      value: Math.max(100 - rebuiltData.endgame_breakdown_rate, 0),
      fullMark: 100,
    },
  ] : [];

  const radarChartConfig = {
    value: {
      label: "Strength",
      color: "hsl(var(--chart-1))",
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

  // Chart configuration for fuel breakdown
  const fuelChartConfig = {
    value: {
      label: "Avg Fuel",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Chart configuration for endgame breakdown
  const endgameChartConfig = {
    value: {
      label: "Rate %",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2026 - REBUILT
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
          2026 - REBUILT
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
          2026 - REBUILT
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
          <p className="text-muted-foreground">2026 REBUILT performance analysis and scouting data</p>
        </div>
      </div>

      {/* Robot Image and Basic Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <TeamImage teamNumber={teamNumber} yearLabel="2026 REBUILT" />
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
              {rebuiltData ? (isNaN(rebuiltData.avg_total) ? 0 : rebuiltData.avg_total).toFixed(1) : 0}
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
              {rebuiltData ? (isNaN(rebuiltData.epa) ? 0 : rebuiltData.epa).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Expected points added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fuel Scored</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rebuiltData ? (isNaN(rebuiltData.teleop_fuel_scored) ? 0 : rebuiltData.teleop_fuel_scored).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Average teleop fuel scored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Accuracy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rebuiltData ? (isNaN(rebuiltData.teleop_fuel_accuracy) ? 0 : rebuiltData.teleop_fuel_accuracy).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Teleop scored / attempted</p>
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
                <span className="text-sm">Avg Fuel Scored</span>
                <span className="font-medium">{rebuiltData?.auto_fuel_scored.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Auto L1 Climb Rate</span>
                <Badge variant="secondary">{rebuiltData?.auto_climb_rate.toFixed(1) || 0}%</Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm">Est. Auto Points</span>
                  <span>
                    {rebuiltData
                      ? ((rebuiltData.auto_fuel_scored * 1) +
                         (rebuiltData.auto_climb_rate / 100) * 15).toFixed(1)
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
                <span className="text-sm">Fuel Scored</span>
                <span className="font-medium">{rebuiltData?.teleop_fuel_scored.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fuel Missed</span>
                <span className="font-medium">{rebuiltData?.teleop_fuel_missed.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fuel Passed</span>
                <span className="font-medium">{rebuiltData?.teleop_fuel_passed.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fuel Corraled</span>
                <span className="font-medium">{rebuiltData?.teleop_fuel_corraled.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Accuracy</span>
                <Badge variant="secondary">{rebuiltData?.teleop_fuel_accuracy.toFixed(1) || 0}%</Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm">Est. Teleop Fuel Points</span>
                  <span>
                    {rebuiltData
                      ? (rebuiltData.teleop_fuel_scored * 1).toFixed(1)
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
        {/* Fuel Scoring Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Scoring Breakdown</CardTitle>
            <CardDescription>Average fuel actions per match</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={fuelChartConfig}>
              <RechartsBarChart data={fuelBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  {fuelBreakdownData.map((entry, index) => (
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

      {/* Robot Strength Radar */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Robot Strength Overview</CardTitle>
          <CardDescription>Key performance dimensions normalized to 0-100 scale</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <ChartContainer
            config={radarChartConfig}
            className="mx-auto aspect-square max-h-[350px]"
          >
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Radar
                name="Strength"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Endgame & Reliability */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Endgame Climb Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Endgame Climb Distribution</CardTitle>
            <CardDescription>Percentage of matches at each climb level</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={endgameChartConfig}>
              <RechartsBarChart data={endgameBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  unit="%"
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

        {/* Reliability & Fouls */}
        <Card>
          <CardHeader>
            <CardTitle>Reliability & Penalties</CardTitle>
            <CardDescription>Robot reliability and penalty averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Robot Reliability
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Breakdown Rate</span>
                    <Badge variant={rebuiltData && rebuiltData.endgame_breakdown_rate > 20 ? "destructive" : "secondary"}>
                      {rebuiltData?.endgame_breakdown_rate.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-semibold mb-3">Penalties</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Fouls per Match</span>
                    <Badge variant="secondary">{rebuiltData?.avg_fouls.toFixed(1) || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Tech Fouls per Match</span>
                    <Badge variant={rebuiltData && rebuiltData.avg_tech_fouls > 0.5 ? "destructive" : "secondary"}>
                      {rebuiltData?.avg_tech_fouls.toFixed(1) || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Est. Penalty Points</span>
                    <Badge variant="secondary">
                      {rebuiltData
                        ? ((rebuiltData.avg_fouls * -3) + (rebuiltData.avg_tech_fouls * -10)).toFixed(1)
                        : 0} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endgame Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Endgame Climb Performance</CardTitle>
          <CardDescription>Climb level success rates across matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold mb-3">No Climb</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate</span>
                  <Badge variant="secondary">{rebuiltData?.endgame_none_rate.toFixed(1) || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points</span>
                  <Badge variant="secondary">0 pts</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">L1 Climb</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate</span>
                  <Badge variant="secondary">{rebuiltData?.endgame_l1_rate.toFixed(1) || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points</span>
                  <Badge variant="secondary">10 pts</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">L2 Climb</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate</span>
                  <Badge variant="secondary">{rebuiltData?.endgame_l2_rate.toFixed(1) || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points</span>
                  <Badge variant="secondary">20 pts</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">L3 Climb</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate</span>
                  <Badge variant="secondary">{rebuiltData?.endgame_l3_rate.toFixed(1) || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Points</span>
                  <Badge variant="secondary">30 pts</Badge>
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
