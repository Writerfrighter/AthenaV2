'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';
import { getCombinedAlliancePosition, parseCombinedAlliancePosition } from './match-form-utils';
import type { DynamicMatchData } from '@/lib/shared-types';

interface MatchInfoSectionProps {
  formData: DynamicMatchData;
  competitionType: string;
  eventTeamNumbers: number[];
  teamsLoading: boolean;
  onBasicInputChange: (field: keyof DynamicMatchData, value: string | number) => void;
  onAllianceChange: (alliance: 'red' | 'blue', position: number) => void;
}

export function MatchInfoSection({
  formData,
  competitionType,
  eventTeamNumbers,
  teamsLoading,
  onBasicInputChange,
  onAllianceChange
}: MatchInfoSectionProps) {
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
          <Label htmlFor="matchNumber">Match Number</Label>
          <Input
            id="matchNumber"
            placeholder="45"
            type="number"
            value={formData.matchNumber}
            onChange={(e) => onBasicInputChange('matchNumber', e.target.value)}
            min={1}
            max={200}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="teamNumber">Team Number</Label>
          {eventTeamNumbers.length > 0 ? (
            <Select 
              value={formData.teamNumber === 0 ? undefined : String(formData.teamNumber)} 
              onValueChange={(value) => onBasicInputChange('teamNumber', Number(value))}
            >
              <SelectTrigger>
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
          <Label>Alliance Position</Label>
          <Select 
            value={getCombinedAlliancePosition(formData.alliance, formData.alliancePosition || 1)} 
            onValueChange={(value) => {
              const { alliance, position } = parseCombinedAlliancePosition(value);
              onAllianceChange(alliance, position);
            }}
          >
            <SelectTrigger className="focus:border-green-500">
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
