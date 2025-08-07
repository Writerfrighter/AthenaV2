"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Trophy, Target, Zap, Clock, Search, PieChart, Radar } from "lucide-react";
import Image from "next/image";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar as RechartsRadar, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Tooltip,
  Legend
} from "recharts";

// Mock data for demonstration
const mockTeamData = {
  name: "The Titans",
  number: 492,
  location: "San Francisco, CA",
  rookieYear: 2008,
  website: "https://team492.org",
  sourceEvent: "Silicon Valley Regional 2024",
  stats: {
    avgTotal: 85.4,
    epa: 22.3,
    avgAutoCoral: 3.2,
    avgAutoAlgae: 2.8,
    avgTeleopCoral: 8.6,
    avgTeleopAlgae: 6.4,
    bestEndgame: "Suspended",
  },
  autonomous: {
    trough: 2.4,
    l2: 1.8,
    l3: 2.2,
    l4: 1.5,
    net: 0.8,
    processor: 1.2,
    missedCoral: 0.3,
    missedAlgae: 0.5,
  },
  teleop: {
    trough: 4.2,
    l2: 3.1,
    l3: 4.8,
    l4: 2.9,
    net: 1.6,
    processor: 2.3,
    missedCoral: 1.1,
    missedAlgae: 0.8,
  },
  notes: [
    "Strong autonomous routine with consistent scoring",
    "Excellent driver control and precision",
    "Reliable climber with fast hang time",
    "Good defensive capabilities when needed",
    "Solid alliance partner for high-level matches",
  ],
};

// Chart data
const radarData = [
  {
    subject: 'Auto',
    value: (mockTeamData.stats.avgAutoCoral + mockTeamData.stats.avgAutoAlgae) * 10, // Scale to 100
    fullMark: 100,
  },
  {
    subject: 'Teleop',
    value: (mockTeamData.stats.avgTeleopCoral + mockTeamData.stats.avgTeleopAlgae) * 6, // Scale to 100
    fullMark: 100,
  },
  {
    subject: 'Endgame',
    value: 85, // Mock endgame performance
    fullMark: 100,
  },
  {
    subject: 'Consistency',
    value: 92,
    fullMark: 100,
  },
  {
    subject: 'Defense',
    value: 68,
    fullMark: 100,
  },
];

const pieData = [
  { name: 'Auto', value: 8.2, color: '#3b82f6' },
  { name: 'Teleop', value: 11.4, color: '#10b981' },
  { name: 'Endgame', value: 2.7, color: '#8b5cf6' },
];

interface TeamPageClientProps {
  teamNumber: string;
}

export default function TeamPageClient({ teamNumber }: TeamPageClientProps) {
  const [searchNote, setSearchNote] = useState("");

  const filteredNotes = mockTeamData.notes.filter((note) =>
    note.toLowerCase().includes(searchNote.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">{mockTeamData.name}</h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              #{mockTeamData.number}
            </Badge>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-muted-foreground">Team Name:</span>
                  <p className="text-lg">{mockTeamData.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Team Number:</span>
                  <p className="text-lg">{mockTeamData.number}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Location:</span>
                  <p className="text-lg">{mockTeamData.location}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Rookie Year:</span>
                  <p className="text-lg">{mockTeamData.rookieYear}</p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visit Website
                </Button>
                <Badge variant="outline" className="w-fit">
                  Source: {mockTeamData.sourceEvent}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Robot Image Placeholder */}
        <div className="lg:w-80">
          <Card className="h-full">
            <CardContent className="p-0">
              <div className="relative h-64 lg:h-full min-h-[300px]">
                <Image
                  src="/no-image-available.webp"
                  alt={`Team ${teamNumber} robot`}
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-lg font-semibold">2024 Robot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{mockTeamData.stats.avgTotal}</p>
              <p className="text-sm text-muted-foreground">Avg Total Score</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{mockTeamData.stats.epa}</p>
              <p className="text-sm text-muted-foreground">EPA</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">{mockTeamData.stats.avgAutoCoral}</p>
              <p className="text-sm text-muted-foreground">Avg Auto Coral</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">{mockTeamData.stats.avgAutoAlgae}</p>
              <p className="text-sm text-muted-foreground">Avg Auto Algae</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-orange-600">{mockTeamData.stats.bestEndgame}</p>
              <p className="text-sm text-muted-foreground">Best Endgame</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autonomous */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Autonomous Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(mockTeamData.autonomous).map(([key, value]) => (
                <div key={key} className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teleop */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Teleop Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(mockTeamData.teleop).map(([key, value]) => (
                <div key={key} className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart - Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Performance Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                  <RechartsRadar
                    name="Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Performance']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - EPA Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              EPA Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'EPA']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Scouting Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchNote}
                onChange={(e) => setSearchNote(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredNotes.map((note, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/30 text-sm border-l-4 border-primary/50"
                >
                  {note}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
