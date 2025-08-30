'use client';

import { useState, useEffect } from 'react';
import { useCurrentGameConfig } from '@/hooks/use-game-config';
import { useSelectedEvent } from '@/hooks/use-event-config';
import { useEventTeamNumbers, useEventTeams } from '@/hooks/use-event-teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Target, Zap, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { matchApi } from '@/lib/api/database-client';
import type { ScoringDefinition } from '@/hooks/use-game-config';

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
  matchNumber: number;
  teamNumber: number;
  alliance: 'red' | 'blue';
  
  // Game-specific data stored as flexible object
  autonomous: Record<string, number | string | boolean>;
  teleop: Record<string, number | string | boolean>;
  endgame: Record<string, number | string | boolean>;
  fouls: Record<string, number | string | boolean>;
  
  // Common fields
  notes: string;
}

const defaultData: DynamicMatchData = {
  matchNumber: 0,
  teamNumber: 0,
  alliance: 'red',
  autonomous: {},
  teleop: {},
  endgame: {},
  fouls: {},
  notes: ''
};

// Function to initialize form data with all game config fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeFormData = (gameConfig: any): DynamicMatchData => {
  const data: DynamicMatchData = {
    matchNumber: 0,
    teamNumber: 0,
    alliance: 'red',
    autonomous: {},
    teleop: {},
    endgame: {},
    fouls: {},
    notes: ''
  };

  if (!gameConfig?.scoring) return data;

  // Initialize autonomous fields
  if (gameConfig.scoring.autonomous) {
    Object.keys(gameConfig.scoring.autonomous).forEach(key => {
      const fieldConfig = gameConfig.scoring.autonomous[key];
      if (fieldConfig.type === 'boolean') {
        data.autonomous[key] = false;
      } else if (fieldConfig.type === 'number' || fieldConfig.points !== undefined) {
        data.autonomous[key] = 0;
      } else if (fieldConfig.pointValues) {
        // For select fields, use the first option as default
        const options = Object.keys(fieldConfig.pointValues);
        data.autonomous[key] = options.length > 0 ? options[0] : '';
      } else {
        data.autonomous[key] = 0; // Default to number
      }
    });
  }

  // Add hardcoded startPosition field for autonomous
  data.autonomous.startPosition = 'center';

  // Initialize teleop fields
  if (gameConfig.scoring.teleop) {
    Object.keys(gameConfig.scoring.teleop).forEach(key => {
      const fieldConfig = gameConfig.scoring.teleop[key];
      if (fieldConfig.type === 'boolean') {
        data.teleop[key] = false;
      } else if (fieldConfig.type === 'number' || fieldConfig.points !== undefined) {
        data.teleop[key] = 0;
      } else if (fieldConfig.pointValues) {
        const options = Object.keys(fieldConfig.pointValues);
        data.teleop[key] = options.length > 0 ? options[0] : '';
      } else {
        data.teleop[key] = 0;
      }
    });
  }

  // Initialize endgame fields
  if (gameConfig.scoring.endgame) {
    Object.keys(gameConfig.scoring.endgame).forEach(key => {
      const fieldConfig = gameConfig.scoring.endgame[key];
      if (fieldConfig.type === 'boolean') {
        data.endgame[key] = false;
      } else if (fieldConfig.type === 'number' || fieldConfig.points !== undefined) {
        data.endgame[key] = 0;
      } else if (fieldConfig.pointValues) {
        const options = Object.keys(fieldConfig.pointValues);
        data.endgame[key] = options.length > 0 ? options[0] : '';
      } else {
        data.endgame[key] = 0;
      }
    });
  }

  // Initialize fouls fields
  if (gameConfig.scoring.fouls) {
    Object.keys(gameConfig.scoring.fouls).forEach(key => {
      const fieldConfig = gameConfig.scoring.fouls[key];
      if (fieldConfig.type === 'boolean') {
        data.fouls[key] = false;
      } else if (fieldConfig.type === 'number' || fieldConfig.points !== undefined) {
        data.fouls[key] = 0;
      } else if (fieldConfig.pointValues) {
        const options = Object.keys(fieldConfig.pointValues);
        data.fouls[key] = options.length > 0 ? options[0] : '';
      } else {
        data.fouls[key] = 0;
      }
    });
  }

  return data;
};

export function DynamicMatchScoutForm() {
  const gameConfig = useCurrentGameConfig();
  const selectedEvent = useSelectedEvent();
  const eventTeamNumbers = useEventTeamNumbers();
  const { loading: teamsLoading } = useEventTeams();
  const [formData, setFormData] = useState<DynamicMatchData>(() => 
    gameConfig ? initializeFormData(gameConfig) : defaultData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reinitialize form data when game config changes
  useEffect(() => {
    if (gameConfig) {
      setFormData(initializeFormData(gameConfig));
    }
  }, [gameConfig]);

  const handleInputChange = (section: string, field: string, value: number | string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof DynamicMatchData] as Record<string, number | string | boolean> || {}),
        [field]: value
      }
    }));
  };
  const handleBasicInputChange = (field: keyof DynamicMatchData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      const entryToSave = {
        matchNumber: formData.matchNumber,
        teamNumber: formData.teamNumber,
        year: new Date().getFullYear(),
        alliance: formData.alliance,
        eventName: selectedEvent?.name || 'Unknown Event',
        eventCode: selectedEvent?.code || 'Unknown Code',
        gameSpecificData: {
          autonomous: formData.autonomous,
          teleop: formData.teleop,
          endgame: formData.endgame,
          fouls: formData.fouls
        },
        notes: formData.notes,
        timestamp: new Date()
      };

      await matchApi.create(entryToSave);

      toast.success("Match data saved!", {
        description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} saved successfully`
      });
      
      setFormData(gameConfig ? initializeFormData(gameConfig) : defaultData);
    } catch (error) {
      toast.error("Failed to save data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine field type based on configuration structure
  const getFieldType = (fieldConfig: ScoringDefinition) => {
    // First check if type is explicitly defined
    if (fieldConfig.type) {
      return fieldConfig.type;
    }
    
    // Fall back to inference based on structure
    if (fieldConfig.pointValues && typeof fieldConfig.pointValues === 'object') {
      return 'select';
    }
    if (fieldConfig.points !== undefined && typeof fieldConfig.points === 'number') {
      // Check if this is typically a boolean field based on label
      const label = fieldConfig.label.toLowerCase();
      if (label.includes('mobility') || label.includes('park') || label.includes('climb') || 
          label.includes('dock') || label.includes('engage') || label.includes('harmony') ||
          label.includes('barge')) {
        return 'boolean';
      }
      return 'number';
    }
    return 'number';
  };

  const renderScoringField = (section: 'autonomous' | 'teleop' | 'endgame' | 'fouls', fieldKey: string, fieldConfig: ScoringDefinition) => {
    const fieldType = getFieldType(fieldConfig);
    const currentValue = (formData[section] as Record<string, number | string | boolean>)[fieldKey];
    
    switch (fieldType) {
      case 'boolean':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label className="text-sm font-medium">{fieldConfig.label}</Label>
            <div className="flex items-center justify-center">
              <Button
                variant={Boolean(currentValue) ? "default" : "outline"}
                size="lg"
                onClick={() => handleInputChange(section, fieldKey, !Boolean(currentValue))}
                className={`h-12 w-full font-semibold transition-all duration-200 ${
                  Boolean(currentValue) 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-green-50 border-2'
                }`}
              >
                {Boolean(currentValue) ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Yes
                  </>
                ) : (
                  <>
                    <Minus className="mr-2 h-5 w-5" />
                    No
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {fieldConfig.points || 0} points
            </div>
          </div>
        );
        
      case 'select':
        const selectValue = String(currentValue || Object.keys(fieldConfig.pointValues || {})[0]);
        return (
          <div key={fieldKey} className="space-y-2">
            <Label className="text-sm font-medium">{fieldConfig.label}</Label>
            <div className="flex items-center justify-center">
              <Select 
                value={selectValue}
                onValueChange={(value) => handleInputChange(section, fieldKey, value)}
              >
                <SelectTrigger className="h-12 w-full text-base font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-400 bg-muted border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fieldConfig.pointValues || {}).map(([option, points]) => (
                    <SelectItem key={option} value={option} className="text-base py-3">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                        <span className="text-muted-foreground ml-4 text-sm">({String(points)} pts)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Points vary by selection
            </div>
          </div>
        );
        
      case 'number':
      default:
        const numValue = Number(currentValue) || 0;
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
                  value={numValue}
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
            <div className="text-xs text-center text-muted-foreground">
              {fieldConfig.points || 0} points each
            </div>
          </div>
        );
    }
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
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {eventTeamNumbers.length > 0 ? (
              <Select value={formData.teamNumber === 0 ? undefined : String(formData.teamNumber)} onValueChange={(value) => handleBasicInputChange('teamNumber', Number(value))}>
                <SelectTrigger className="focus:border-green-500">
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
                <SelectTrigger className="focus:border-green-500">
                  <SelectValue placeholder="Loading teams..." />
                </SelectTrigger>
              </Select>
            ) : (
              <Input
                name="teamNumber"
                type="number"
                value={formData.teamNumber}
                onChange={(e) => handleBasicInputChange('teamNumber', e.target.value)}
                placeholder="Enter team number (e.g. 254)"
                required
                min="1"
                max="9999"
                className="focus:border-green-500"
              />
            )}
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
              renderScoringField('autonomous', key, config)
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
              renderScoringField('teleop', key, config)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameConfig && gameConfig.scoring && Object.entries(gameConfig.scoring.endgame).map(([key, config]) => 
              renderScoringField('endgame', key, config)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fouls */}
      {gameConfig && gameConfig.scoring && gameConfig.scoring.fouls && (
        <Card className="border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary/90">
              <AlertTriangle className="h-5 w-5" />
              Fouls & Penalties
            </CardTitle>
            <CardDescription>
              Track penalties and fouls committed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(gameConfig.scoring.fouls).map(([key, config]) => 
                renderScoringField('fouls', key, config)
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                onClick={() => setFormData(gameConfig ? initializeFormData(gameConfig) : defaultData)}
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
