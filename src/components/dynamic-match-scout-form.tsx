'use client';

import { useState } from 'react';
import { useCurrentGameConfig } from '@/hooks/use-game-config';
import { useSelectedEvent } from '@/hooks/use-event-config';
import { useEventTeamNumbers } from '@/hooks/use-event-teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Target, Zap, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/db/db';

// CSS to hide number input spinners
const hideSpinnersStyle = `
  .hide-spinners::-webkit-outer-spin-button,
  .hide-spinners::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  .hide-spinners[type=number] {
    -moz-appearance: textfield;
  }
`;

interface DynamicMatchData {
  // Basic match info
  matchNumber: string;
  teamNumber: string;
  alliance: 'red' | 'blue';
  position: '1' | '2' | '3';
  
  // Game-specific data stored as flexible object
  autonomous: Record<string, number | string | boolean>;
  teleop: Record<string, number | string | boolean>;
  endgame: Record<string, number | string | boolean>;
  
  // Common fields
  notes: string;
}

const defaultData: DynamicMatchData = {
  matchNumber: '',
  teamNumber: '',
  alliance: 'red',
  position: '1',
  autonomous: {},
  teleop: {},
  endgame: {},
  notes: ''
};

export function DynamicMatchScoutForm() {
  const gameConfig = useCurrentGameConfig();
  const selectedEvent = useSelectedEvent();
  const eventTeamNumbers = useEventTeamNumbers();
  const [formData, setFormData] = useState<DynamicMatchData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (section: string, field: string, value: number | string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof DynamicMatchData] as Record<string, number | string | boolean> || {}),
        [field]: value
      }
    }));
  };

  const handleBasicInputChange = (field: keyof DynamicMatchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (section: string, field: string, increment: boolean) => {
    const currentValue = (formData[section as keyof DynamicMatchData] as Record<string, number | string | boolean>)[field] as number || 0;
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
    handleInputChange(section, field, newValue);
  };

  const handleSubmit = async () => {
    if (!formData.matchNumber || !formData.teamNumber) {
      toast.error("Please fill in match number and team number");
      return;
    }

    setIsSubmitting(true);

    try {
      await db.matchEntries.add({
        matchNumber: formData.matchNumber,
        teamNumber: formData.teamNumber,
        year: new Date().getFullYear(),
        alliance: formData.alliance,
        position: formData.position,
        eventName: selectedEvent?.name || 'Unknown Event',
        eventCode: selectedEvent?.code || selectedEvent?.number || 'Unknown Code',
        gameSpecificData: {
          autonomous: formData.autonomous,
          teleop: formData.teleop,
          endgame: formData.endgame
        },
        notes: formData.notes,
        timestamp: new Date()
      });

      toast.success("Match data saved!", {
        description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} saved successfully`
      });
      
      setFormData(defaultData);
    } catch (error) {
      toast.error("Failed to save data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderScoringField = (section: 'autonomous' | 'teleop' | 'endgame', fieldKey: string, fieldConfig: { label: string; points: number; description: string }) => {
    const currentValue = (formData[section] as Record<string, number | string | boolean>)[fieldKey] as number || 0;
    
    return (
      <div key={fieldKey} className="space-y-2">
        <Label className="text-sm font-medium">{fieldConfig.label}</Label>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNumberChange(section, fieldKey, false)}
            className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <div className="flex flex-col justify-center items-center flex-grow">
            <Input
              type="number"
              min={0}
              value={currentValue}
              onChange={e => handleInputChange(section, fieldKey, Math.max(0, Number(e.target.value)))}
              className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
              style={{height: '3rem'}}
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNumberChange(section, fieldKey, true)}
            className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{hideSpinnersStyle}</style>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Game Title */}
      <div className="text-center">
        <Badge variant="outline" className="text-lg px-4 py-2">
          {gameConfig?.gameName || 'Unknown Game'} - Match Scouting
        </Badge>
      </div>

      {/* Match Info */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary/90">
            <Target className="h-5 w-5" />
            Match Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="matchNumber">Match Number</Label>
            <Input
              id="matchNumber"
              placeholder="Q45"
              value={formData.matchNumber}
              onChange={(e) => handleBasicInputChange('matchNumber', e.target.value)}
              className="focus:border-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teamNumber">Team Number</Label>
            <Select value={formData.teamNumber} onValueChange={(value) => handleBasicInputChange('teamNumber', value)}>
              <SelectTrigger className="focus:border-green-500">
                <SelectValue placeholder="Select team number" />
              </SelectTrigger>
              <SelectContent>
                {eventTeamNumbers.length > 0 ? (
                  eventTeamNumbers.map((teamNumber) => (
                    <SelectItem key={teamNumber} value={String(teamNumber)}>
                      Team {teamNumber}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No teams available for this event
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Alliance</Label>
            <Select value={formData.alliance} onValueChange={(value) => handleBasicInputChange('alliance', value)}>
              <SelectTrigger className="focus:border-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red">Red Alliance</SelectItem>
                <SelectItem value="blue">Blue Alliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={formData.position} onValueChange={(value) => handleBasicInputChange('position', value)}>
              <SelectTrigger className="focus:border-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Position 1</SelectItem>
                <SelectItem value="2">Position 2</SelectItem>
                <SelectItem value="3">Position 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Autonomous Period */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary/90">
            <Zap className="h-5 w-5" />
            Autonomous Period
          </CardTitle>
          <CardDescription>
            Performance during the autonomous period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Starting Position</Label>
              <Select 
                value={String((formData.autonomous as Record<string, unknown>).startPosition || '')} 
                onValueChange={(value) => handleInputChange('autonomous', 'startPosition', value)}
              >
                <SelectTrigger className="focus:border-green-500">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameConfig && gameConfig.scoring && Object.entries(gameConfig.scoring.autonomous).map(([key, config]) => 
              renderScoringField('autonomous', key, config as { label: string; points: number; description: string })
            )}
          </div>

          <div className="flex flex-col space-y-4">
            {/* Mobility switch - only show for years that have it */}
          </div>
        </CardContent>
      </Card>

      {/* Teleop Period */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary/90">
            <Award className="h-5 w-5" />
            Teleop Period
          </CardTitle>
          <CardDescription>
            Driver-controlled period performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameConfig && gameConfig.scoring && Object.entries(gameConfig.scoring.teleop).map(([key, config]) => 
              renderScoringField('teleop', key, config as { label: string; points: number; description: string })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endgame */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary/90">
            <AlertTriangle className="h-5 w-5" />
            Endgame
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Endgame Position</Label>
            <Select 
              value={String((formData.endgame as Record<string, unknown>).position || '')} 
              onValueChange={(value) => handleInputChange('endgame', 'position', value)}
            >
              <SelectTrigger className="focus:border-green-500">
                <SelectValue placeholder="Select endgame position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="park">Park</SelectItem>
                <SelectItem value="climb">Climb</SelectItem>
                <SelectItem value="hang">Hang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameConfig && gameConfig.scoring && Object.entries(gameConfig.scoring.endgame).map(([key, config]) => 
              renderScoringField('endgame', key, config as { label: string; points: number; description: string })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary/90">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional observations about this match..."
            value={formData.notes}
            onChange={(e) => handleBasicInputChange('notes', e.target.value)}
            className="focus:border-green-500"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Card className="border rounded-xl shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Data saves locally and syncs automatically
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setFormData(defaultData)}
                className="hover:bg-green-50 h-12"
                size="lg"
              >
                Clear Form
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[140px] h-12 bg-green-600 hover:bg-green-700 text-base"
                size="lg"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Save Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
