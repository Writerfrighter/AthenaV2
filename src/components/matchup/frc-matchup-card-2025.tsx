'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shell, Waves, ArrowUp, AlertTriangle } from 'lucide-react';
import { useTeamData } from '@/hooks/use-team-data';
import Link from 'next/link';
import type { MatchupCardProps } from './matchup-alliance-panel';

interface ReefscapeMatchupData {
  epa: number;
  avg_auto_coral: number;
  avg_auto_algae: number;
  avg_teleop_coral: number;
  avg_teleop_algae: number;
  auto_trough: number;
  auto_l2: number;
  auto_l3: number;
  auto_l4: number;
  auto_net: number;
  auto_processor: number;
  teleop_trough: number;
  teleop_l2: number;
  teleop_l3: number;
  teleop_l4: number;
  teleop_net: number;
  teleop_processor: number;
  endgame_state: string;
}

export function FRCMatchupCard2025({ teamNumber, alliance }: MatchupCardProps) {
  const { teamData, loading, error } = useTeamData(teamNumber);

  const borderColor = alliance === 'red' ? 'border-l-red-500' : 'border-l-blue-500';

  const calculateStats = (): ReefscapeMatchupData | null => {
    if (!teamData?.matchEntries || teamData.matchEntries.length === 0) return null;

    const entries = teamData.matchEntries;
    const count = entries.length;

    const totals = entries.reduce(
      (acc, match) => {
        const auto = (match.gameSpecificData?.autonomous as Record<string, number>) || {};
        const teleop = (match.gameSpecificData?.teleop as Record<string, number>) || {};
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
      },
      {
        auto_l1: 0, auto_l2: 0, auto_l3: 0, auto_l4: 0, auto_net: 0, auto_processor: 0,
        teleop_l1: 0, teleop_l2: 0, teleop_l3: 0, teleop_l4: 0, teleop_net: 0, teleop_processor: 0,
      }
    );

    // Determine best endgame state
    const endgameStates = entries.map((m) => {
      const eg = (m.gameSpecificData?.endgame as Record<string, string>) || {};
      return eg.cage_climb || eg.ending_robot_state || 'none';
    });
    const stateCounts: Record<string, number> = {};
    endgameStates.forEach((s) => { stateCounts[s] = (stateCounts[s] || 0) + 1; });
    const bestEndgame = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      epa: teamData.epa?.totalEPA || 0,
      avg_auto_coral: parseFloat(((totals.auto_l1 + totals.auto_l2 + totals.auto_l3 + totals.auto_l4) / count).toFixed(1)),
      avg_auto_algae: parseFloat(((totals.auto_processor + totals.auto_net) / count).toFixed(1)),
      avg_teleop_coral: parseFloat(((totals.teleop_l1 + totals.teleop_l2 + totals.teleop_l3 + totals.teleop_l4) / count).toFixed(1)),
      avg_teleop_algae: parseFloat(((totals.teleop_processor + totals.teleop_net) / count).toFixed(1)),
      auto_trough: parseFloat((totals.auto_l1 / count).toFixed(1)),
      auto_l2: parseFloat((totals.auto_l2 / count).toFixed(1)),
      auto_l3: parseFloat((totals.auto_l3 / count).toFixed(1)),
      auto_l4: parseFloat((totals.auto_l4 / count).toFixed(1)),
      auto_net: parseFloat((totals.auto_net / count).toFixed(1)),
      auto_processor: parseFloat((totals.auto_processor / count).toFixed(1)),
      teleop_trough: parseFloat((totals.teleop_l1 / count).toFixed(1)),
      teleop_l2: parseFloat((totals.teleop_l2 / count).toFixed(1)),
      teleop_l3: parseFloat((totals.teleop_l3 / count).toFixed(1)),
      teleop_l4: parseFloat((totals.teleop_l4 / count).toFixed(1)),
      teleop_net: parseFloat((totals.teleop_net / count).toFixed(1)),
      teleop_processor: parseFloat((totals.teleop_processor / count).toFixed(1)),
      endgame_state: bestEndgame,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Card className={`border-l-4 ${borderColor}`}>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card className={`border-l-4 ${borderColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <Link href={`/dashboard/team/${teamNumber}`} className="hover:underline font-bold">
              Team {teamNumber}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No scouting data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Link href={`/dashboard/team/${teamNumber}`} className="hover:underline font-bold text-lg">
              Team {teamNumber}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2">
            {teamData.pitEntry?.driveTrain && (
              <Badge variant="outline" className="text-xs">{teamData.pitEntry.driveTrain}</Badge>
            )}
            {teamData.pitEntry?.weight && (
              <Badge variant="outline" className="text-xs">{teamData.pitEntry.weight} lbs</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{teamData.matchCount} matches</Badge>
          {stats && (
            <Badge variant="secondary" className="text-xs">EPA: {stats.epa.toFixed(1)}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats ? (
          <>
            {/* Autonomous Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Shell className="h-3 w-3" /> Autonomous
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coral</span>
                  <span className="font-medium">{stats.avg_auto_coral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Algae</span>
                  <span className="font-medium">{stats.avg_auto_algae}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L4</span>
                  <span className="font-medium">{stats.auto_l4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L3</span>
                  <span className="font-medium">{stats.auto_l3}</span>
                </div>
              </div>
            </div>

            <Separator className="my-1" />

            {/* Teleop Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Waves className="h-3 w-3" /> Teleop
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coral</span>
                  <span className="font-medium">{stats.avg_teleop_coral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Algae</span>
                  <span className="font-medium">{stats.avg_teleop_algae}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L4</span>
                  <span className="font-medium">{stats.teleop_l4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L3</span>
                  <span className="font-medium">{stats.teleop_l3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net</span>
                  <span className="font-medium">{stats.teleop_net}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processor</span>
                  <span className="font-medium">{stats.teleop_processor}</span>
                </div>
              </div>
            </div>

            <Separator className="my-1" />

            {/* Endgame Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> Endgame
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Most Common</span>
                <Badge
                  variant={stats.endgame_state.toLowerCase().includes('deep') ? 'default' : 'secondary'}
                  className="text-xs h-5 capitalize"
                >
                  {stats.endgame_state}
                </Badge>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No match data to analyze</p>
        )}
      </CardContent>
    </Card>
  );
}

export default FRCMatchupCard2025;
