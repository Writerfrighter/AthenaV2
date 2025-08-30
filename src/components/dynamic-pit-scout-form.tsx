'use client';

import { useState, useEffect } from 'react';
import { useCurrentGameConfig } from '@/hooks/use-game-config';
import { useSelectedEvent } from '@/hooks/use-event-config';
import { useEventTeamNumbers, useEventTeams } from '@/hooks/use-event-teams';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pitApi } from '@/lib/api/database-client';

interface DynamicPitData {
  team: number;
  drivetrain: string;
  weight: string;
  length: string;
  width: string;
  hasAuto: boolean;
  notes: string;
  gameSpecificData: Record<string, number | string | boolean>;
}

export function DynamicPitScoutForm() {
  const gameConfig = useCurrentGameConfig();
  const selectedEvent = useSelectedEvent();
  const eventTeamNumbers = useEventTeamNumbers();
  const { loading: teamsLoading } = useEventTeams();

  // Function to initialize form data with all pit scouting fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initializePitFormData = (config: any): DynamicPitData => {
    const data: DynamicPitData = {
      team: 0,
      drivetrain: '',
      weight: '',
      length: '',
      width: '',
      hasAuto: false,
      notes: '',
      gameSpecificData: {}
    };

    if (config?.pitScouting?.customFields) {
      config.pitScouting.customFields.forEach((field: { name: string; type: string; options?: string[] }) => {
        switch (field.type) {
          case 'text':
            data.gameSpecificData[field.name] = '';
            break;
          case 'number':
            data.gameSpecificData[field.name] = 0;
            break;
          case 'boolean':
            data.gameSpecificData[field.name] = false;
            break;
          case 'select':
            data.gameSpecificData[field.name] = field.options && field.options.length > 0 ? field.options[0] : '';
            break;
          default:
            data.gameSpecificData[field.name] = '';
        }
      });
    }

    return data;
  };

  const [formData, setFormData] = useState<DynamicPitData>(() => 
    gameConfig ? initializePitFormData(gameConfig) : {
      team: 0,
      drivetrain: '',
      weight: '',
      length: '',
      width: '',
      hasAuto: false,
      notes: '',
      gameSpecificData: {}
    }
  );

  // Reinitialize form data when game config changes
  useEffect(() => {
    if (gameConfig) {
      setFormData(initializePitFormData(gameConfig));
    }
  }, [gameConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'team') {
      setFormData((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'team') {
      setFormData((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  };

  const handleGameSpecificChange = (field: string, value: number | string | boolean) => {
    setFormData((f) => ({ 
      ...f, 
      gameSpecificData: { ...f.gameSpecificData, [field]: value }
    }));
  };

  const handleToggleAuto = (checked: boolean) => {
    setFormData((f) => ({ ...f, hasAuto: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const entryToSave = {
        teamNumber: Number(formData.team),
        year: new Date().getFullYear(),
        driveTrain: formData.drivetrain as "Swerve" | "Mecanum" | "Tank" | "Other",
        weight: Number(formData.weight),
        length: Number(formData.length),
        width: Number(formData.width),
        eventName: selectedEvent?.name || 'Unknown Event',
        eventCode: selectedEvent?.code || 'Unknown Code',
        gameSpecificData: {
          hasAuto: formData.hasAuto,
          ...formData.gameSpecificData
        }
      };

      await pitApi.create(entryToSave);
      
      toast("Scouting data saved!", {
        description: `Team ${formData.team} entry stored successfully.`
      });
      
      // Reset form
      setFormData(gameConfig ? initializePitFormData(gameConfig) : {
        team: 0,
        drivetrain: '',
        weight: '',
        length: '',
        width: '',
        hasAuto: false,
        notes: '',
        gameSpecificData: {}
      });
    } catch (error) {
      toast("Failed to save data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const renderCustomField = (field: { name: string; label: string; type: string; options?: string[] }) => {
    const value = formData.gameSpecificData[field.name] || '';
    
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-medium">
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={String(value || '')}
              onChange={(e) => handleGameSpecificChange(field.name, e.target.value)}
              className="h-12 text-base"
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-4">
            <Switch
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleGameSpecificChange(field.name, checked)}
              className="scale-125"
            />
            <Label htmlFor={field.name} className="text-base font-medium cursor-pointer">
              {field.label}
            </Label>
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-medium">
              {field.label}
            </Label>
            <Select 
              value={String(value || '')} 
              onValueChange={(value) => handleGameSpecificChange(field.name, value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {field.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Game Title */}
      <div className="text-center">
        <Badge variant="outline" className="text-lg px-4 py-2">
          {gameConfig?.gameName || 'Unknown Game'} - Pit Scouting
        </Badge>
      </div>

      {/* Main Form */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Team Information */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold mb-4">Team Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-base font-medium">
                      Team Number
                    </Label>
                    {eventTeamNumbers.length > 0 ? (
                      <Select value={formData.team === 0 ? undefined : String(formData.team)} onValueChange={(value) => handleSelectChange('team', value)}>
                        <SelectTrigger className="h-12 text-base">
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
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Loading teams..." />
                        </SelectTrigger>
                      </Select>
                    ) : (
                      <Input
                        name="team"
                        type="number"
                        value={formData.team}
                        onChange={handleChange}
                        placeholder="Enter team number (e.g. 254)"
                        required
                        min="1"
                        max="9999"
                        className="h-12 text-base"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Robot Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Robot Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="drivetrain" className="text-base font-medium">
                      Drivetrain
                    </Label>
                    <Select 
                      value={formData.drivetrain} 
                      onValueChange={(value) => handleSelectChange('drivetrain', value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select drivetrain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="tank">Tank Drive</SelectItem>
                          <SelectItem value="mecanum">Mecanum Drive</SelectItem>
                          <SelectItem value="swerve">Swerve Drive</SelectItem>
                          <SelectItem value="west-coast">West Coast Drive</SelectItem>
                          <SelectItem value="omni">Omni Drive</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Robot Specifications */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Robot Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="length" className="text-base font-medium">
                      Length (inches)
                    </Label>
                    <Input
                      name="length"
                      type="number"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="30"
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-base font-medium">
                      Width (inches)
                    </Label>
                    <Input
                      name="width"
                      type="number"
                      value={formData.width}
                      onChange={handleChange}
                      placeholder="30"
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-base font-medium">
                      Weight (lbs)
                    </Label>
                    <Input
                      name="weight"
                      type="number"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="125"
                      required
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Autonomous Capabilities */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Switch
                    id="hasAuto"
                    checked={formData.hasAuto}
                    onCheckedChange={handleToggleAuto}
                    className="scale-125"
                  />
                  <Label htmlFor="hasAuto" className="text-base font-medium cursor-pointer">
                    Has Autonomous Capabilities
                  </Label>
                </div>
              </div>

              {/* Game-Specific Fields */}
              {gameConfig && gameConfig.pitScouting && gameConfig.pitScouting.customFields && gameConfig.pitScouting.customFields.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {gameConfig.gameName} Specific Capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gameConfig.pitScouting.customFields.map(renderCustomField)}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-4">
                <Label htmlFor="notes" className="text-base font-medium">
                  Additional Notes
                </Label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional observations about this team..."
                  className="min-h-[4rem]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Save Scouting Data
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
