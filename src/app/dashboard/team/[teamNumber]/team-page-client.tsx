'use client';

import { useGameConfig } from '@/hooks/use-game-config';
import { lazy, Suspense, useMemo, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamPageClientProps {
  teamNumber: string;
}

interface TeamPageProps {
  teamNumber: string;
}

export default function TeamPageClient({ teamNumber }: TeamPageClientProps) {
  const { currentYear, competitionType } = useGameConfig();

  // Dynamically import the team page component based on competition type and year
  const TeamPageComponent = useMemo(() => {
    const componentName = `${competitionType.toLowerCase()}-team-${currentYear}-page`;
    
    try {
      // Dynamic import with proper error handling
      return lazy<ComponentType<TeamPageProps>>(() => 
        import(`@/components/team-pages/${componentName}.tsx`)
          .then(module => {
            // Handle both default and named exports
            // Expected naming convention: {CompType}Team{Year}Page (e.g., FRCTeam2025Page)
            const exportName = `${competitionType}Team${currentYear}Page`;
            return { default: module[exportName] || module.default };
          })
          .catch(() => {
            // Return a fallback component if the file doesn't exist
            return {
              default: ({ teamNumber }: TeamPageProps) => (
                <div className="container mx-auto p-6">
                  <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
                  <p className="text-muted-foreground">
                    {competitionType} team pages are not implemented for {currentYear}.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Expected component: <code className="bg-muted px-1 py-0.5 rounded">{componentName}.tsx</code>
                  </p>
                </div>
              )
            };
          })
      );
    } catch {
      // Fallback if lazy loading fails
      return lazy<ComponentType<TeamPageProps>>(() => Promise.resolve({
        default: ({ teamNumber }: TeamPageProps) => (
          <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
            <p className="text-muted-foreground">
              Unable to load team page for {competitionType} {currentYear}.
            </p>
          </div>
        )
      }));
    }
  }, [currentYear, competitionType]);

  const renderTeamPage = () => {
    return (
      <Suspense fallback={
        <div className="container mx-auto p-6 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }>
        <TeamPageComponent teamNumber={teamNumber} />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Year Selector */}
      <div className="bg-white/80 dark:bg-background/80 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{teamNumber} Team Analysis</h1>
        </div>
      </div>

      <div className='px-3'>{renderTeamPage()}</div>
    </div>
  );
}
