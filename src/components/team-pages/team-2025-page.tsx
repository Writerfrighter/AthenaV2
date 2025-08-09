'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { calculateEPA, calculateTeamStats, formatStat } from '@/lib/statistics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
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
  
  // Query 2025 specific data
  const matchEntries = useLiveQuery(() => 
    db.matchEntries
      .where('teamNumber')
      .equals(teamNumber)
      .and(entry => entry.year === 2025)
      .toArray()
  );

  const pitEntry = useLiveQuery(() => 
    db.pitEntries
      .where('teamNumber')
      .equals(Number(teamNumber))
      .and(entry => entry.year === 2025)
      .first()
  );

  // Calculate REEFSCAPE specific statistics using proper functions
  const calculateReefscapeStats = (): ReefscapeData | null => {
    if (!matchEntries || matchEntries.length === 0) return null;

    // Use the corrected statistics functions
    const teamStats = calculateTeamStats(matchEntries, 2025);
    const epaBreakdown = calculateEPA(matchEntries, 2025);
    
    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous || {};
      const teleop = match.gameSpecificData?.teleop || {};
      
      return {
        auto_l2: acc.auto_l2 + (auto.l2 || 0),
        auto_l3: acc.auto_l3 + (auto.l3 || 0),
        auto_l4: acc.auto_l4 + (auto.l4 || 0),
        auto_net: acc.auto_net + (auto.net || 0),
        auto_processor: acc.auto_processor + (auto.processor || 0),
        
        teleop_l2: acc.teleop_l2 + (teleop.l2 || 0),
        teleop_l3: acc.teleop_l3 + (teleop.l3 || 0),
        teleop_l4: acc.teleop_l4 + (teleop.l4 || 0),
        teleop_net: acc.teleop_net + (teleop.net || 0),
        teleop_processor: acc.teleop_processor + (teleop.processor || 0),
        
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
      avg_total: Number(formatStat(epaBreakdown.totalEPA)),
      epa: Number(formatStat(epaBreakdown.totalEPA)),
      avg_auto_coral: totals.auto_coral / count,
      avg_auto_algae: totals.auto_algae / count,
      avg_teleop_coral: totals.teleop_coral / count,
      avg_teleop_algae: totals.teleop_algae / count,
      endgame_state: "Deep Climbing", // This would come from endgame data
      
      auto_trough: 0, // Not tracked in current schema
      auto_l2: totals.auto_l2 / count,
      auto_l3: totals.auto_l3 / count,
      auto_l4: totals.auto_l4 / count,
      auto_net: totals.auto_net / count,
      auto_processor: totals.auto_processor / count,
      auto_missed_coral: 0, // Not tracked in current schema
      auto_missed_algae: 0, // Not tracked in current schema
      
      teleop_trough: 0, // Not tracked in current schema
      teleop_l2: totals.teleop_l2 / count,
      teleop_l3: totals.teleop_l3 / count,
      teleop_l4: totals.teleop_l4 / count,
      teleop_net: totals.teleop_net / count,
      teleop_processor: totals.teleop_processor / count,
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

  if (!pitEntry && (!matchEntries || matchEntries.length === 0)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2025 - REEFSCAPE
        </Badge>
        <p className="text-muted-foreground">No data available for Team {teamNumber} in 2025.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Team Info Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">{pitEntry?.name || `Team ${teamNumber}`}</h1>
          </div>
          
          <Card className="shadow">
            <CardContent className="pt-6">
              <ul className="space-y-3 text-lg">
                <li><strong>Team Name:</strong> {pitEntry?.name || "Unknown"}</li>
                <li><strong>Team Number:</strong> {teamNumber}</li>
                <li><strong>Location:</strong> San Francisco, CA</li>
                <li><strong>Rookie Year:</strong> 2008</li>
                <li className="text-sm italic">Sourced Event: Silicon Valley Regional 2025</li>
              </ul>
            </CardContent>
          </Card>
          
          <Button variant="outline" className="w-full" size="lg">
            <ExternalLink className="mr-2 h-4 w-4" />
            Website
          </Button>
        </div>

        {/* Robot Image Column */}
        <div className="lg:col-span-3">
          <Card className="h-full min-h-[300px]">
            <CardContent className="p-0">
              <div className="relative h-full min-h-[300px] rounded-lg overflow-hidden">
                <Image
                  src="/no-image-available.webp"
                  alt={`Team ${teamNumber} robot`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-lg font-semibold">2025 REEFSCAPE Robot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overview Stats */}
      <div>
        <h3 className="text-2xl font-semibold mb-4">Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Average Total Score</p>
                <p className="text-2xl font-bold">{reefscapeData?.avg_total.toFixed(1) || 0}</p>
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-semibold">EPA</p>
                <p className="text-2xl font-bold">{reefscapeData?.epa.toFixed(1) || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Average Auto Coral</p>
                <p className="text-2xl font-bold">{reefscapeData?.avg_auto_coral.toFixed(1) || 0}</p>
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-semibold">Average Auto Algae</p>
                <p className="text-2xl font-bold">{reefscapeData?.avg_auto_algae.toFixed(1) || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Average Teleop Coral</p>
                <p className="text-2xl font-bold">{reefscapeData?.avg_teleop_coral.toFixed(1) || 0}</p>
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-semibold">Average Teleop Algae</p>
                <p className="text-2xl font-bold">{reefscapeData?.avg_teleop_algae.toFixed(1) || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Best Endgame State</p>
                <p className="text-xl font-bold">{reefscapeData?.endgame_state || "Unknown"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Autonomous */}
        <div>
          <h3 className="text-2xl font-semibold mb-4">Autonomous</h3>
          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Trough</p>
                    <p className="text-lg">{reefscapeData?.auto_trough.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">L2</p>
                    <p className="text-lg">{reefscapeData?.auto_l2.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">L3</p>
                    <p className="text-lg">{reefscapeData?.auto_l3.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">L4</p>
                    <p className="text-lg">{reefscapeData?.auto_l4.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Net</p>
                    <p className="text-lg">{reefscapeData?.auto_net.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Processor</p>
                    <p className="text-lg">{reefscapeData?.auto_processor.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Missed Coral</p>
                    <p className="text-lg">{reefscapeData?.auto_missed_coral.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Missed Algae</p>
                    <p className="text-lg">{reefscapeData?.auto_missed_algae.toFixed(1) || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teleop */}
          <h3 className="text-2xl font-semibold mb-4 mt-6">Teleop</h3>
          <Card className="shadow bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Trough</p>
                    <p className="text-lg">{reefscapeData?.teleop_trough.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">L2</p>
                    <p className="text-lg">{reefscapeData?.teleop_l2.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">L3</p>
                    <p className="text-lg">{reefscapeData?.teleop_l3.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">L4</p>
                    <p className="text-lg">{reefscapeData?.teleop_l4.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Net</p>
                    <p className="text-lg">{reefscapeData?.teleop_net.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Processor</p>
                    <p className="text-lg">{reefscapeData?.teleop_processor.toFixed(1) || 0}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Missed Coral</p>
                    <p className="text-lg">{reefscapeData?.teleop_missed_coral.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Missed Algae</p>
                    <p className="text-lg">{reefscapeData?.teleop_missed_algae.toFixed(1) || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Column */}
        <div className="space-y-6">
          {/* Teleop Breakdown Chart */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">Teleop Breakdown</h3>
            <Card className="shadow bg-muted/30">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={teleopBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Point Breakdown Chart */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">Point Breakdown</h3>
            <Card className="shadow bg-muted/30">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pointBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pointBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">Notes</h3>
            <Card className="shadow bg-muted/30">
              <CardContent className="pt-6">
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
                <ul className="space-y-2">
                  {filteredNotes.map((note, index) => (
                    <li key={index} className="p-2 bg-background rounded border">
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
