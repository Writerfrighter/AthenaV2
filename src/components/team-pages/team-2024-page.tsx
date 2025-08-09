'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Team2024PageProps {
  teamNumber: string;
}

export function Team2024Page({ teamNumber }: Team2024PageProps) {
  const [searchNote, setSearchNote] = useState("");
  
  // Query 2024 specific data
  const matchEntries = useLiveQuery(() => 
    db.matchEntries
      .where('teamNumber')
      .equals(teamNumber)
      .and(entry => entry.year === 2024)
      .toArray()
  );

  const pitEntry = useLiveQuery(() => 
    db.pitEntries
      .where('teamNumber')
      .equals(Number(teamNumber))
      .and(entry => entry.year === 2024)
      .first()
  );

  // Calculate CRESCENDO specific statistics
  const calculateCrescendoStats = () => {
    if (!matchEntries || matchEntries.length === 0) return null;

    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous || {};
      const teleop = match.gameSpecificData?.teleop || {};
      
      return {
        auto_speaker: acc.auto_speaker + (auto.speaker || 0),
        auto_amp: acc.auto_amp + (auto.amp || 0),
        teleop_speaker: acc.teleop_speaker + (teleop.speaker || 0),
        teleop_amp: acc.teleop_amp + (teleop.amp || 0),
        teleop_trap: acc.teleop_trap + (teleop.trap || 0),
      };
    }, { auto_speaker: 0, auto_amp: 0, teleop_speaker: 0, teleop_amp: 0, teleop_trap: 0 });

    const count = matchEntries.length;
    
    return {
      avg_auto_speaker: totals.auto_speaker / count,
      avg_auto_amp: totals.auto_amp / count,
      avg_teleop_speaker: totals.teleop_speaker / count,
      avg_teleop_amp: totals.teleop_amp / count,
      avg_teleop_trap: totals.teleop_trap / count,
      avg_total: (totals.auto_speaker * 5 + totals.auto_amp * 2 + totals.teleop_speaker * 2 + totals.teleop_amp * 1 + totals.teleop_trap * 5) / count
    };
  };

  const crescendoData = calculateCrescendoStats();

  const chartData = crescendoData ? [
    { name: 'Auto Speaker', value: crescendoData.avg_auto_speaker },
    { name: 'Auto Amp', value: crescendoData.avg_auto_amp },
    { name: 'Teleop Speaker', value: crescendoData.avg_teleop_speaker },
    { name: 'Teleop Amp', value: crescendoData.avg_teleop_amp },
    { name: 'Teleop Trap', value: crescendoData.avg_teleop_trap },
  ] : [];

  const mockNotes = [
    "Consistent speaker scoring from multiple positions",
    "Reliable amp scoring throughout the match",
    "Strong climbing performance in endgame",
    "Good note collection and management",
    "Effective alliance coordination",
  ];

  const filteredNotes = mockNotes.filter(note =>
    note.toLowerCase().includes(searchNote.toLowerCase())
  );

  if (!pitEntry && (!matchEntries || matchEntries.length === 0)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2024 - CRESCENDO
        </Badge>
        <p className="text-muted-foreground">No data available for Team {teamNumber} in 2024.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-4xl font-bold">{pitEntry?.name || `Team ${teamNumber}`}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          2024 - CRESCENDO
        </Badge>
      </div>

      {/* Team Info */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><strong>Team Name:</strong> {pitEntry?.name || "Unknown"}</div>
            <div><strong>Team Number:</strong> {teamNumber}</div>
            <div><strong>Drivetrain:</strong> {pitEntry?.driveTrain || "Unknown"}</div>
            <div><strong>Weight:</strong> {pitEntry?.weight || "Unknown"} lbs</div>
            <Button variant="outline" className="w-full mt-4">
              <ExternalLink className="mr-2 h-4 w-4" />
              Website
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="/no-image-available.webp"
                alt={`Team ${teamNumber} robot`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-lg font-semibold">2024 CRESCENDO Robot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      {crescendoData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{crescendoData.avg_total.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Total Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{crescendoData.avg_auto_speaker.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Auto Speaker</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{crescendoData.avg_teleop_speaker.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Teleop Speaker</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scoring Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Scouting Notes</CardTitle>
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
            <ul className="space-y-2">
              {filteredNotes.map((note, index) => (
                <li key={index} className="p-2 bg-muted/30 rounded border text-sm">
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle>Match History ({matchEntries?.length || 0} matches)</CardTitle>
        </CardHeader>
        <CardContent>
          {matchEntries && matchEntries.length > 0 ? (
            <div className="space-y-2">
              {matchEntries.slice(0, 10).map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-4">
                    <Badge variant={match.alliance === 'red' ? 'destructive' : 'default'}>
                      {match.alliance.toUpperCase()}
                    </Badge>
                    <span className="font-medium">Match {match.matchNumber}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(match.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No match data available for 2024</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
