'use client';

import { lazy, Suspense, useMemo, ComponentType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamData } from '@/hooks/use-team-data';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { CompetitionType } from '@/lib/shared-types';

// Props for year-specific matchup card components
export interface MatchupCardProps {
  teamNumber: string;
  alliance: 'red' | 'blue';
}

interface MatchupAlliancePanelProps {
  alliance: 'red' | 'blue';
  teamNumbers: number[];
  currentYear: number;
  competitionType: CompetitionType;
}

export default function MatchupAlliancePanel({
  alliance,
  teamNumbers,
  currentYear,
  competitionType,
}: MatchupAlliancePanelProps) {
  const allianceColor =
    alliance === 'red'
      ? 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20'
      : 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20';

  const allianceLabel =
    alliance === 'red' ? 'Red Alliance' : 'Blue Alliance';

  return (
    <div className={`rounded-lg border-2 p-4 space-y-4 ${allianceColor}`}>
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${alliance === 'red' ? 'bg-red-500' : 'bg-blue-500'}`}
        />
        <h2 className="text-lg font-bold">{allianceLabel}</h2>
        <Badge variant="secondary">{teamNumbers.length} robots</Badge>
      </div>

      <div className="space-y-4">
        {teamNumbers.map((teamNum) => (
          <MatchupTeamCard
            key={teamNum}
            teamNumber={teamNum}
            alliance={alliance}
            currentYear={currentYear}
            competitionType={competitionType}
          />
        ))}
        {teamNumbers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No teams assigned
          </p>
        )}
      </div>
    </div>
  );
}

// Individual team card that loads year-specific matchup data
function MatchupTeamCard({
  teamNumber,
  alliance,
  currentYear,
  competitionType,
}: {
  teamNumber: number;
  alliance: 'red' | 'blue';
  currentYear: number;
  competitionType: CompetitionType;
}) {
  const teamStr = teamNumber.toString();
  const { teamData, loading, error } = useTeamData(teamStr);

  // Dynamically load the year-specific matchup card component
  const MatchupCardComponent = useMemo(() => {
    const componentName = `${competitionType.toLowerCase()}-matchup-card-${currentYear}`;
    try {
      return lazy<ComponentType<MatchupCardProps>>(() =>
        import(`@/components/matchup/${componentName}.tsx`)
          .then((module) => {
            const exportName = `${competitionType}MatchupCard${currentYear}`;
            return { default: module[exportName] || module.default };
          })
          .catch(() => {
            // Return a generic fallback
            return {
              default: ({ teamNumber: tn }: MatchupCardProps) => (
                <GenericMatchupCard teamNumber={tn} alliance={alliance} />
              ),
            };
          })
      );
    } catch {
      return lazy<ComponentType<MatchupCardProps>>(() =>
        Promise.resolve({
          default: ({ teamNumber: tn }: MatchupCardProps) => (
            <GenericMatchupCard teamNumber={tn} alliance={alliance} />
          ),
        })
      );
    }
  }, [currentYear, competitionType, alliance]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link href={`/dashboard/team/${teamNumber}`} className="hover:underline font-bold">
              Team {teamNumber}
            </Link>
            <Badge variant="destructive" className="text-xs">No Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'No scouting data available for this team.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      }
    >
      <MatchupCardComponent teamNumber={teamStr} alliance={alliance} />
    </Suspense>
  );
}

// Generic fallback card when no year-specific component exists
function GenericMatchupCard({ teamNumber, alliance }: { teamNumber: string; alliance: 'red' | 'blue' }) {
  const { teamData } = useTeamData(teamNumber);

  const borderColor = alliance === 'red' ? 'border-l-red-500' : 'border-l-blue-500';

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <Link href={`/dashboard/team/${teamNumber}`} className="hover:underline font-bold">
            Team {teamNumber}
          </Link>
          <Link href={`/dashboard/team/${teamNumber}`}>
            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teamData ? (
          <div className="space-y-2 text-sm">
            {teamData.pitEntry && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{teamData.pitEntry.driveTrain}</Badge>
                {teamData.pitEntry.weight && (
                  <Badge variant="outline">{teamData.pitEntry.weight} lbs</Badge>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matches</span>
              <span className="font-medium">{teamData.matchCount}</span>
            </div>
            {teamData.epa && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">EPA</span>
                <span className="font-medium">{teamData.epa.totalEPA.toFixed(1)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}
