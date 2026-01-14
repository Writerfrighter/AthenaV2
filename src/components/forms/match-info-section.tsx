'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, Calendar } from 'lucide-react';
import { getCombinedAlliancePosition, parseCombinedAlliancePosition } from './match-form-utils';
import type { DynamicMatchData } from '@/lib/shared-types';

interface MatchInfoSectionProps {
  formData: DynamicMatchData;
  competitionType: string;
  eventTeamNumbers: number[];
  teamsLoading: boolean;
  onBasicInputChange: (field: keyof DynamicMatchData, value: string | number) => void;
  onAllianceChange: (alliance: 'red' | 'blue', position: number) => void;
  // Event schedule auto-assign props (team number from match schedule)
  scheduleLoading?: boolean;
  hasScheduleData?: boolean;
  getTeamForPosition?: (matchNumber: number, alliance: 'red' | 'blue', position: number) => number | null;
  // Scouting schedule assignment props (match/alliance from scouting blocks)
  isMatchFromScoutingSchedule?: boolean;
  isAllianceFromScoutingSchedule?: boolean;
  assignmentLoading?: boolean;
}

export function MatchInfoSection({
  formData,
  competitionType,
  eventTeamNumbers,
  teamsLoading,
  onBasicInputChange,
  onAllianceChange,
  scheduleLoading = false,
  hasScheduleData = false,
  getTeamForPosition,
  isMatchFromScoutingSchedule = false,
  isAllianceFromScoutingSchedule = false,
  assignmentLoading = false
}: MatchInfoSectionProps) {
  // Track previous values to detect changes for auto-assign
  const prevMatchNumber = useRef<number | string>(formData.matchNumber);
  const prevAlliance = useRef<'red' | 'blue'>(formData.alliance);
  const prevPosition = useRef<number>(formData.alliancePosition || 1);

  // Auto-assign team number when match number or alliance position changes
  useEffect(() => {
    if (!getTeamForPosition || !hasScheduleData) return;
    
    const matchNum = Number(formData.matchNumber);
    const currentAlliance = formData.alliance;
    const currentPosition = formData.alliancePosition || 1;
    
    // Check if any relevant field changed
    const matchChanged = prevMatchNumber.current !== formData.matchNumber;
    const allianceChanged = prevAlliance.current !== currentAlliance;
    const positionChanged = prevPosition.current !== currentPosition;
    
    // Update refs
    prevMatchNumber.current = formData.matchNumber;
    prevAlliance.current = currentAlliance;
    prevPosition.current = currentPosition;
    
    // Only auto-assign if something changed and we have a valid match number
    if ((matchChanged || allianceChanged || positionChanged) && matchNum > 0) {
      const autoTeam = getTeamForPosition(matchNum, currentAlliance, currentPosition);
      if (autoTeam !== null && autoTeam !== formData.teamNumber) {
        onBasicInputChange('teamNumber', autoTeam);
      }
    }
  }, [formData.matchNumber, formData.alliance, formData.alliancePosition, formData.teamNumber, getTeamForPosition, hasScheduleData, onBasicInputChange]);

  // Determine if the current team number was auto-assigned from schedule
  const isAutoAssigned = (() => {
    if (!getTeamForPosition || !hasScheduleData) return false;
    const matchNum = Number(formData.matchNumber);
    if (matchNum <= 0) return false;
    const expectedTeam = getTeamForPosition(matchNum, formData.alliance, formData.alliancePosition || 1);
    return expectedTeam !== null && expectedTeam === formData.teamNumber;
  })();

  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary/90">
          <Target className="h-5 w-5" />
          Match Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 h-5">
            <Label htmlFor="matchNumber">Match Number</Label>
            {isMatchFromScoutingSchedule && (
              <Badge variant="secondary" className="text-xs flex items-center gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0 h-5">
                <Calendar className="h-2.5 w-2.5" />
                Assigned
              </Badge>
            )}
            {assignmentLoading && !isMatchFromScoutingSchedule && (
              <Badge variant="outline" className="text-xs py-0 h-4">
                Loading...
              </Badge>
            )}
          </div>
          <Input
            id="matchNumber"
            placeholder="45"
            type="number"
            value={formData.matchNumber}
            onChange={(e) => onBasicInputChange('matchNumber', e.target.value)}
            min={1}
            max={200}
            required
            className={isMatchFromScoutingSchedule ? 'border-amber-500/50 bg-amber-500/5' : ''}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 h-5">
            <Label htmlFor="teamNumber">Team Number</Label>
            {isAutoAssigned && (
              <Badge variant="secondary" className="text-xs flex items-center gap-0.5 bg-primary/10 text-primary py-0 h-5">
                <Zap className="h-2.5 w-2.5" />
                Auto
              </Badge>
            )}
            {scheduleLoading && (
              <Badge variant="outline" className="text-xs py-0 h-4">
                Loading...
              </Badge>
            )}
          </div>
          {eventTeamNumbers.length > 0 ? (
            <Select 
              value={formData.teamNumber === 0 ? undefined : String(formData.teamNumber)} 
              onValueChange={(value) => onBasicInputChange('teamNumber', Number(value))}
            >
              <SelectTrigger className={isAutoAssigned ? 'border-primary/50 bg-primary/5' : ''}>
                <SelectValue placeholder="Select team number" />
              </SelectTrigger>
              <SelectContent>
                {eventTeamNumbers.map((teamNumber) => (
                  <SelectItem key={teamNumber} value={String(teamNumber)}>
                    Team {teamNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : teamsLoading ? (
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Loading teams..." />
              </SelectTrigger>
            </Select>
          ) : (
            <Input
              name="teamNumber"
              type="number"
              value={formData.teamNumber}
              onChange={(e) => onBasicInputChange('teamNumber', e.target.value)}
              placeholder="Enter team number (e.g. 254)"
              required
              min="1"
              max="9999"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 h-5">
            <Label>Alliance Position</Label>
            {isAllianceFromScoutingSchedule && (
              <Badge variant="secondary" className="text-xs flex items-center gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0 h-5">
                <Calendar className="h-2.5 w-2.5" />
                Assigned
              </Badge>
            )}
          </div>
          <Select 
            value={getCombinedAlliancePosition(formData.alliance, formData.alliancePosition || 1)} 
            onValueChange={(value) => {
              const { alliance, position } = parseCombinedAlliancePosition(value);
              onAllianceChange(alliance, position);
            }}
          >
            <SelectTrigger className={isAllianceFromScoutingSchedule ? 'border-amber-500/50 bg-amber-500/5' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="red-1">Red 1</SelectItem>
              <SelectItem value="red-2">Red 2</SelectItem>
              {competitionType === 'FRC' && (
                <SelectItem value="red-3">Red 3</SelectItem>
              )}
              <SelectItem value="blue-1">Blue 1</SelectItem>
              <SelectItem value="blue-2">Blue 2</SelectItem>
              {competitionType === 'FRC' && (
                <SelectItem value="blue-3">Blue 3</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
