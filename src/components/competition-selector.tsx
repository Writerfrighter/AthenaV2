'use client';

import { useGameConfig } from '@/hooks/use-game-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy } from 'lucide-react';

export function CompetitionSelector() {
  const { competitionType, setCompetitionType } = useGameConfig();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Competition:</span>
      </div>
      <Select
        value={competitionType}
        onValueChange={(value) => setCompetitionType(value as 'FRC' | 'FTC')}
      >
        <SelectTrigger className="w-[100px] sm:w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="FRC">
            <div className="flex items-center gap-2">
              <span className="font-semibold">FRC</span>
            </div>
          </SelectItem>
          <SelectItem value="FTC">
            <div className="flex items-center gap-2">
              <span className="font-semibold">FTC</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
