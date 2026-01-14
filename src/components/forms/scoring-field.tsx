'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, CheckCircle } from 'lucide-react';
import { getFieldType } from './match-form-utils';
import type { ScoringDefinition } from '@/lib/shared-types';

interface ScoringFieldProps {
  section: 'autonomous' | 'teleop' | 'endgame' | 'fouls';
  fieldKey: string;
  fieldConfig: ScoringDefinition;
  currentValue: number | string | boolean;
  onValueChange: (section: string, field: string, value: number | string | boolean) => void;
  onNumberChange: (section: string, field: string, increment: boolean) => void;
}

export function ScoringField({
  section,
  fieldKey,
  fieldConfig,
  currentValue,
  onValueChange,
  onNumberChange
}: ScoringFieldProps) {
  const fieldType = getFieldType(fieldConfig);
  
  switch (fieldType) {
    case 'boolean':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{fieldConfig.label}</Label>
          <div className="flex items-center justify-center">
            <Button
              variant={Boolean(currentValue) ? "default" : "outline"}
              size="lg"
              onClick={() => onValueChange(section, fieldKey, !Boolean(currentValue))}
              className="h-16 w-full font-semibold transition-all duration-200 border-2"
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">{fieldConfig.label}</Label>
          <div className="flex items-center justify-center">
            <Select 
              value={selectValue}
              onValueChange={(value) => onValueChange(section, fieldKey, value)}
            >
              <SelectTrigger className="h-16 w-full text-base font-semibold focus:ring-2 focus:ring-primary/20 bg-muted border-2">
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">{fieldConfig.label}</Label>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNumberChange(section, fieldKey, false)}
              className="h-16 w-16 p-0 flex-shrink-0"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <div className="flex flex-col justify-center items-center flex-grow">
              <Input
                type="number"
                min={0}
                value={numValue}
                onChange={e => onValueChange(section, fieldKey, Math.max(0, Number(e.target.value)))}
                className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-primary/20"
                style={{height: '4rem'}}
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNumberChange(section, fieldKey, true)}
              className="h-16 w-16 p-0 flex-shrink-0"
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
}
