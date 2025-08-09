'use client';

import { useCurrentGameConfig, useGameConfig } from '@/hooks/use-game-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

interface DynamicTeamPageProps {
  teamNumber: string;
}

export function DynamicTeamPage({ teamNumber }: DynamicTeamPageProps) {
  const gameConfig = useCurrentGameConfig();
  const { currentYear } = useGameConfig();
  
  // Query data for current year and team
  const matchEntries = useLiveQuery(() => 
    db.matchEntries
      .where('teamNumber')
      .equals(teamNumber)
      .and(entry => entry.year === currentYear)
      .toArray()
  );

  const pitEntry = useLiveQuery(() => 
    db.pitEntries
      .where('teamNumber')
      .equals(Number(teamNumber))
      .and(entry => entry.year === currentYear)
      .first()
  );

  if (!matchEntries || !gameConfig) {
    return <div>Loading...</div>;
  }

  // Calculate statistics based on game-specific data
  const calculateStats = () => {
    if (matchEntries.length === 0) return null;

    const autoStats: Record<string, number> = {};
    const teleopStats: Record<string, number> = {};
    
    // Calculate averages for each scoring category
    Object.keys(gameConfig.scoring.autonomous).forEach(key => {
      const total = matchEntries.reduce((sum, match) => {
        const autonomousData = match.gameSpecificData?.autonomous as Record<string, number> | undefined;
        return sum + (autonomousData?.[key] as number || 0);
      }, 0);
      autoStats[key] = total / matchEntries.length;
    });

    Object.keys(gameConfig.scoring.teleop).forEach(key => {
      const total = matchEntries.reduce((sum, match) => {
        const teleopData = match.gameSpecificData?.teleop as Record<string, number> | undefined;
        return sum + (teleopData?.[key] as number || 0);
      }, 0);
      teleopStats[key] = total / matchEntries.length;
    });

    return { autoStats, teleopStats };
  };

  const stats = calculateStats();

  // Prepare chart data
  const chartData = stats ? Object.entries(gameConfig.scoring.autonomous).map(([key, config]) => ({
    name: (config as { label: string }).label,
    autonomous: stats.autoStats[key] || 0,
    teleop: stats.teleopStats[key] || 0,
  })) : [];

  const pieData = stats ? [
    { 
      name: 'Auto', 
      value: Object.values(stats.autoStats).reduce((a, b) => a + b, 0),
      color: '#3b82f6' 
    },
    { 
      name: 'Teleop', 
      value: Object.values(stats.teleopStats).reduce((a, b) => a + b, 0),
      color: '#10b981' 
    },
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-4xl font-bold">Team {teamNumber}</h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {currentYear} - {gameConfig.gameName}
        </Badge>
      </div>

      {/* Team Info from Pit Scouting */}
      {pitEntry && (
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-muted-foreground">Team Name:</span>
                <p className="text-lg">{pitEntry.name}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Drivetrain:</span>
                <p className="text-lg">{pitEntry.driveTrain}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Weight:</span>
                <p className="text-lg">{pitEntry.weight} lbs</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Dimensions:</span>
                <p className="text-lg">{pitEntry.length}&quot; × {pitEntry.width}&quot;</p>
              </div>
            </div>
            
            {/* Game-specific capabilities */}
            {pitEntry.gameSpecificData && Object.keys(pitEntry.gameSpecificData).length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">{gameConfig.gameName} Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(pitEntry.gameSpecificData).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="ml-2">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                         typeof value === 'object' ? JSON.stringify(value) : 
                         String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Stats */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="autonomous" fill="#3b82f6" name="Autonomous" />
                  <Bar dataKey="teleop" fill="#10b981" name="Teleop" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle>Match History ({matchEntries.length} matches)</CardTitle>
        </CardHeader>
        <CardContent>
          {matchEntries.length > 0 ? (
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
              {matchEntries.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {matchEntries.length - 10} more matches
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No match data available for {currentYear}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
