'use client';

import { YearSelector } from '@/components/year-selector';
import { useGameConfig } from '@/hooks/use-game-config';
import { Team2025Page } from '@/components/team-pages/team-2025-page';

interface TeamPageClientProps {
  teamNumber: string;
}

export default function TeamPageClient({ teamNumber }: TeamPageClientProps) {
  const { currentYear } = useGameConfig();

  const renderTeamPage = () => {
    switch (currentYear) {
      case 2025:
        return <Team2025Page teamNumber={teamNumber} />;
      default:
        return (
          <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold mb-4">Team {teamNumber}</h1>
            <p className="text-muted-foreground">
              No specialized page available for {currentYear}. Please select a different year.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Year Selector */}
      <div className="bg-white/80 dark:bg-background/80 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{teamNumber} Team Analysis</h1>
          <YearSelector />
        </div>
      </div>

      <div className='px-3'>{renderTeamPage()}</div>
    </div>
  );
}
