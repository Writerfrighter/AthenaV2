'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Trophy, Target, Activity, BarChart, MapPin, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useTeamData } from '@/hooks/use-team-data';
import { useGameConfig } from '@/hooks/use-game-config';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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

export function Team2025Page({ teamNumber }: Team2025PageProps) {
  const [searchNote, setSearchNote] = useState("");
  const { config } = useGameConfig();
  const { teamData, loading, error } = useTeamData(teamNumber);

  // Calculate REEFSCAPE specific statistics using the SQL data
  const calculateReefscapeStats = (): ReefscapeData | null => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const matchEntries = teamData.matchEntries;

    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous as Record<string, number> | undefined || {};
      const teleop = match.gameSpecificData?.teleop as Record<string, number> | undefined || {};

      return {
        auto_l2: acc.auto_l2 + (auto.l2 as number || 0),
        auto_l3: acc.auto_l3 + (auto.l3 as number || 0),
        auto_l4: acc.auto_l4 + (auto.l4 as number || 0),
        auto_net: acc.auto_net + (auto.net as number || 0),
        auto_processor: acc.auto_processor + (auto.processor as number || 0),

        teleop_l2: acc.teleop_l2 + (teleop.l2 as number || 0),
        teleop_l3: acc.teleop_l3 + (teleop.l3 as number || 0),
        teleop_l4: acc.teleop_l4 + (teleop.l4 as number || 0),
        teleop_net: acc.teleop_net + (teleop.net as number || 0),
        teleop_processor: acc.teleop_processor + (teleop.processor as number || 0),

        // For backwards compatibility with generic coral/algae tracking
        auto_coral: acc.auto_coral + (auto.coral || 0),
        auto_algae: acc.auto_algae + (auto.algae || 0),
        teleop_coral: acc.teleop_coral + (teleop.coral || 0),
        teleop_algae: acc.teleop_algae + (teleop.algae || 0),
      };
    }, {
      auto_l2: 0, auto_l3: 0, auto_l4: 0, auto_net: 0, auto_processor: 0,
      teleop_l2: 0, teleop_l3: 0, teleop_l4: 0, teleop_net: 0, teleop_processor: 0,
      auto_coral: 0, auto_algae: 0, teleop_coral: 0, teleop_algae: 0
    });

    const count = matchEntries.length;

    return {
      avg_total: teamData.epa?.totalEPA || 0,
      epa: teamData.epa?.totalEPA || 0,
      avg_auto_coral: parseFloat((totals.auto_coral / count).toFixed(3)),
      avg_auto_algae: parseFloat((totals.auto_algae / count).toFixed(3)),
      avg_teleop_coral: parseFloat((totals.teleop_coral / count).toFixed(3)),
      avg_teleop_algae: parseFloat((totals.teleop_algae / count).toFixed(3)),
      endgame_state: "Deep Climbing", // This would come from endgame data

      auto_trough: 0, // Not tracked in current schema
      auto_l2: parseFloat((totals.auto_l2 / count).toFixed(3)),
      auto_l3: parseFloat((totals.auto_l3 / count).toFixed(3)),
      auto_l4: parseFloat((totals.auto_l4 / count).toFixed(3)),
      auto_net: parseFloat((totals.auto_net / count).toFixed(3)),
      auto_processor: parseFloat((totals.auto_processor / count).toFixed(3)),
      auto_missed_coral: 0, // Not tracked in current schema
      auto_missed_algae: 0, // Not tracked in current schema

      teleop_trough: 0, // Not tracked in current schema
      teleop_l2: parseFloat((totals.teleop_l2 / count).toFixed(3)),
      teleop_l3: parseFloat((totals.teleop_l3 / count).toFixed(3)),
      teleop_l4: parseFloat((totals.teleop_l4 / count).toFixed(3)),
      teleop_net: parseFloat((totals.teleop_net / count).toFixed(3)),
      teleop_processor: parseFloat((totals.teleop_processor / count).toFixed(3)),
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
    { name: 'Teleop Coral', value: reefscapeData.avg_teleop_coral * 3, fill: '#ff9999' },
    { name: 'Teleop Algae', value: reefscapeData.avg_teleop_algae * 5, fill: '#7fdddd' },
  ] : [];

  const mockNotes = [
    "Excellent coral placement accuracy in autonomous",
    "Consistent algae collection throughout match",
    "Strong defensive capabilities when needed",
    "Quick and reliable deep climbing in endgame",
    "Good communication with alliance partners",
    "Effective processor utilization strategy",
    "Consistent performance across all matches"
  ];

  const filteredNotes = mockNotes.filter(note =>
    note.toLowerCase().includes(searchNote.toLowerCase())
  );

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

  if (!teamData?.pitEntry && (!teamData?.matchEntries || teamData.matchEntries.length === 0)) {
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
          {/* <h1 className="text-3xl font-bold tracking-tight">Team {teamNumber}</h1> */}
          <p className="text-muted-foreground">
            2025 REEFSCAPE performance analysis and scouting data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Silicon Valley Regional 2025
          </Badge>
        </div>
      </div>

      {/* Robot Image and Basic Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-sm font-medium">No robot image available</p>
                  <p className="text-xs">Team {teamNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Team Number</span>
                <span className="font-medium">{teamNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="font-medium">San Francisco, CA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rookie Year</span>
                <span className="font-medium">2008</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Matches</span>
                <span className="font-medium">{teamData?.matchEntries?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

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
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={teleopBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Point Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Point Distribution</CardTitle>
            <CardDescription>Breakdown of scoring methods</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pointBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pointBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scouting Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Scouting Notes</CardTitle>
          <CardDescription>Observations and insights from matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchNote}
              onChange={(e) => setSearchNote(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredNotes.map((note, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-md border">
                <p className="text-sm">{note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
