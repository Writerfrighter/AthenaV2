'use client';

import { useState } from 'react';
import { useCurrentGameConfig } from '@/hooks/use-game-config';
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
import { db } from '@/db/db';

interface DynamicPitData {
  team: string;
  name: string;
  drivetrain: string;
  weight: string;
  length: string;
  width: string;
  hasAuto: boolean;
  notes: string;
  gameSpecificData: Record<string, any>;
}

export function DynamicPitScoutForm() {
  const gameConfig = useCurrentGameConfig();
  const [formData, setFormData] = useState<DynamicPitData>({
    team: '',
    name: '',
    drivetrain: '',
    weight: '',
    length: '',
    width: '',
    hasAuto: false,
    notes: '',
    gameSpecificData: {}
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleGameSpecificChange = (field: string, value: any) => {
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
        name: formData.name,
        year: new Date().getFullYear(),
        driveTrain: formData.drivetrain as "Swerve" | "Mecanum" | "Tank" | "Other",
        weight: Number(formData.weight),
        length: Number(formData.length),
        width: Number(formData.width),
        gameSpecificData: {
          hasAuto: formData.hasAuto,
          ...formData.gameSpecificData
        }
      };

      await db.pitEntries.add(entryToSave);
      
      toast("Scouting data saved!", {
        description: `Team ${formData.team} entry stored successfully.`
      });
      
      // Reset form
      setFormData({
        team: '',
        name: '',
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

  const renderCustomField = (field: any) => {
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
              value={value}
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
              checked={value || false}
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
              value={value} 
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
          {gameConfig.gameName} - Pit Scouting
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
                    <Input
                      name="team"
                      type="number"
                      value={formData.team}
                      onChange={handleChange}
                      placeholder="492"
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">
                      Team Name
                    </Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="The Titans"
                      required
                      className="h-12 text-base"
                    />
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
