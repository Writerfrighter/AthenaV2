'use client';

import { useGameConfig } from '@/hooks/use-game-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export function YearSelector() {
  const { config, currentYear, setCurrentYear, getCurrentYearConfig } = useGameConfig();
  const currentConfig = getCurrentYearConfig();

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <div className="hidden sm:flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Season:</span>
      </div>
      <Select
        value={currentYear.toString()}
        onValueChange={(value) => setCurrentYear(parseInt(value))}
      >
        <SelectTrigger className="w-[120px] sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(config).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
            <SelectItem key={year} value={year}>
              <div className="flex items-center gap-2">
                <span>{year}</span>
                <Badge variant="outline" className="text-xs hidden sm:inline-block">
                  {(config as Record<string, { gameName: string }>)[year].gameName}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentConfig && (
        <Badge variant="secondary" className="text-xs hidden md:inline-block">
          {currentConfig.gameName}
        </Badge>
      )}
    </div>
  );
}
