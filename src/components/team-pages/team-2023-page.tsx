'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';
import Image from 'next/image';
import { useTeamData } from '@/hooks/use-team-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Team2023PageProps {
  teamNumber: string;
}

export function Team2023Page({ teamNumber }: Team2023PageProps) {
  const [searchNote, setSearchNote] = useState("");
  const { teamData, loading, error } = useTeamData(teamNumber); 

  // Calculate CHARGED UP specific statistics
  const calculateChargedUpStats = () => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const matchEntries = teamData.matchEntries;

    const totals = matchEntries.reduce((acc, match) => {
      const auto = match.gameSpecificData?.autonomous as Record<string, number> | undefined || {};
      const teleop = match.gameSpecificData?.teleop as Record<string, number> | undefined || {};
      
      return {
        auto_cones: acc.auto_cones + (auto.cones as number || 0),
        auto_cubes: acc.auto_cubes + (auto.cubes as number || 0),
        teleop_cones: acc.teleop_cones + (teleop.cones as number || 0),
        teleop_cubes: acc.teleop_cubes + (teleop.cubes as number || 0),
      };
    }, { auto_cones: 0, auto_cubes: 0, teleop_cones: 0, teleop_cubes: 0 });

    const count = matchEntries.length;
    
    return {
      avg_auto_cones: parseFloat((totals.auto_cones / count).toFixed(3)),
      avg_auto_cubes: parseFloat((totals.auto_cubes / count).toFixed(3)),
      avg_teleop_cones: parseFloat((totals.teleop_cones / count).toFixed(3)),
      avg_teleop_cubes: parseFloat((totals.teleop_cubes / count).toFixed(3)),
      avg_total: parseFloat(((totals.auto_cones + totals.auto_cubes + totals.teleop_cones + totals.teleop_cubes) / count).toFixed(3)),
      epa: teamData.epa?.totalEPA || 0,
    };
  };

  const chargedUpData = calculateChargedUpStats();

  const chartData = chargedUpData ? [
    { name: 'Auto Cones', value: chargedUpData.avg_auto_cones },
    { name: 'Auto Cubes', value: chargedUpData.avg_auto_cubes },
    { name: 'Teleop Cones', value: chargedUpData.avg_teleop_cones },
    { name: 'Teleop Cubes', value: chargedUpData.avg_teleop_cubes },
  ] : [];

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2023 - CHARGED UP
        </Badge>
        <p className="text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2023 - CHARGED UP
        </Badge>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!teamData?.pitEntry && (!teamData?.matchEntries || teamData.matchEntries.length === 0)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1 mb-6">
          2023 - CHARGED UP
        </Badge>
        <p className="text-muted-foreground">No data available for Team {teamNumber} in 2023.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-4xl font-bold">Team {teamNumber}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          2023 - CHARGED UP
        </Badge>
      </div>

      {/* Team Info */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><strong>Team Number:</strong> {teamNumber}</div>
            <div><strong>Drivetrain:</strong> {teamData?.pitEntry?.driveTrain || "Unknown"}</div>
            <div><strong>Weight:</strong> {teamData?.pitEntry?.weight || "Unknown"} lbs</div>
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
                <p className="text-lg font-semibold">2023 CHARGED UP Robot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      {chargedUpData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{isNaN(chargedUpData.avg_total) ? 0 : chargedUpData.avg_total.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Game Pieces</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{chargedUpData.avg_auto_cones.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Auto Cones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{chargedUpData.avg_auto_cubes.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Auto Cubes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{(chargedUpData.avg_teleop_cones + chargedUpData.avg_teleop_cubes).toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Teleop Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Game Piece Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
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
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, index) => (
                  <li key={index} className="p-2 bg-muted/30 rounded border text-sm">
                    {note}
                  </li>
                ))
              ) : (
                <li className="p-6 text-center text-muted-foreground text-sm">
                  {teamNotes.length === 0 ? (
                    <span>No scouting notes available for this team yet.</span>
                  ) : (
                    <span>No notes match your search criteria.</span>
                  )}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle>Match History ({teamData?.matchEntries?.length || 0} matches)</CardTitle>
        </CardHeader>
        <CardContent>
          {teamData?.matchEntries && teamData.matchEntries.length > 0 ? (
            <div className="space-y-2">
              {teamData.matchEntries.slice(0, 10).map((match, index) => (
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
            <p className="text-muted-foreground">No match data available for 2023</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
