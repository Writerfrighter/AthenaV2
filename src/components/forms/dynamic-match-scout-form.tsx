'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameConfig, useCurrentGameConfig } from '@/hooks/use-game-config';
import { useSelectedEvent } from '@/hooks/use-event-config';
import { useEventTeamNumbers, useEventTeams } from '@/hooks/use-event-teams';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Award, AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { matchApi } from '@/lib/api/database-client';
import { ScoutSelector } from '@/components/scout-selector';
import { MatchInfoSection } from '@/components/forms/match-info-section';
import { ScoringSection } from '@/components/forms/scoring-section';
import { defaultData, hideSpinnersStyle, initializeFormData } from '@/components/forms/match-form-utils';
import type { DynamicMatchData, MatchEntry } from '@/lib/shared-types';

export function DynamicMatchScoutForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const gameConfig = useCurrentGameConfig();
  const { competitionType, currentYear } = useGameConfig();
  const selectedEvent = useSelectedEvent();
  const eventTeamNumbers = useEventTeamNumbers();
  const { loading: teamsLoading } = useEventTeams();
  const [formData, setFormData] = useState<DynamicMatchData>(() => 
    gameConfig ? initializeFormData(gameConfig) : defaultData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScoutId, setSelectedScoutId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Fetch entry for editing
  useEffect(() => {
    let isMounted = true;
    
    const fetchEntryForEdit = async () => {
      if (!editId || !gameConfig) return;
      
      setIsLoadingEdit(true);
      try {
        const response = await fetch(`/api/database/match?id=${editId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry for editing');
        }
        
        const entry: MatchEntry = await response.json();
        
        if (!isMounted) return;
        
        // Populate form with existing data
        const populatedData: DynamicMatchData = {
          matchNumber: entry.matchNumber,
          teamNumber: entry.teamNumber,
          alliance: entry.alliance,
          alliancePosition: entry.alliancePosition,
          autonomous: (entry.gameSpecificData?.autonomous as Record<string, number | string | boolean>) || {},
          teleop: (entry.gameSpecificData?.teleop as Record<string, number | string | boolean>) || {},
          endgame: (entry.gameSpecificData?.endgame as Record<string, number | string | boolean>) || {},
          fouls: (entry.gameSpecificData?.fouls as Record<string, number | string | boolean>) || {},
          notes: entry.notes || ''
        };
        
        setFormData(populatedData);
        setIsEditMode(true);
        setEditingEntryId(entry.id ?? null);
        
        toast.info('Editing entry', {
          description: `Match ${entry.matchNumber} - Team ${entry.teamNumber}`
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching entry for edit:', error);
        toast.error('Failed to load entry for editing');
      } finally {
        if (isMounted) {
          setIsLoadingEdit(false);
        }
      }
    };
    
    fetchEntryForEdit();
    
    return () => {
      isMounted = false;
    };
  }, [editId, gameConfig]);

  // Reinitialize form data when game config changes (but not in edit mode)
  useEffect(() => {
    if (gameConfig && !isEditMode) {
      setFormData(initializeFormData(gameConfig));
    }
  }, [gameConfig, isEditMode]);

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

  const handleAllianceChange = (alliance: 'red' | 'blue', position: number) => {
    setFormData(prev => ({
      ...prev,
      alliance,
      alliancePosition: position
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

    // For tablet accounts, ensure a scout is selected
    if (session?.user?.role === 'tablet' && !selectedScoutId && !isEditMode) {
      toast.error("Please select which scout you're entering data for");
      return;
    }

    // Check for duplicate match scout entry (only for new entries, not edits)
    if (!isEditMode && selectedEvent?.code) {
      try {
        const response = await fetch(
          `/api/database/match/check?teamNumber=${formData.teamNumber}&matchNumber=${formData.matchNumber}&eventCode=${selectedEvent.code}`
        );
        const data = await response.json();
        
        if (data.exists) {
          toast.error("Duplicate entry detected", {
            description: `Team ${formData.teamNumber} has already been scouted for Match ${formData.matchNumber}. Please check existing entries or edit the existing entry.`,
            icon: <AlertCircle className="h-4 w-4" />
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error checking for duplicate:', error);
      }
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editingEntryId) {
        // Update existing entry
        const response = await fetch('/api/database/match', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingEntryId,
            matchNumber: formData.matchNumber,
            teamNumber: formData.teamNumber,
            year: currentYear,
            competitionType: competitionType,
            alliance: formData.alliance,
            alliancePosition: formData.alliancePosition,
            eventName: selectedEvent?.name || 'Unknown Event',
            eventCode: selectedEvent?.code || 'Unknown Code',
            gameSpecificData: {
              autonomous: formData.autonomous,
              teleop: formData.teleop,
              endgame: formData.endgame,
              fouls: formData.fouls
            },
            notes: formData.notes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update match entry');
        }

        toast.success("Match entry updated!", {
          description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} updated successfully`,
          icon: <CheckCircle className="h-4 w-4" />
        });

        router.push('/dashboard/matchscouting');
      } else {
        // Create new entry
        const entryToSave = {
          matchNumber: formData.matchNumber,
          teamNumber: formData.teamNumber,
          year: currentYear,
          competitionType: competitionType,
          alliance: formData.alliance,
          alliancePosition: formData.alliancePosition,
          eventName: selectedEvent?.name || 'Unknown Event',
          eventCode: selectedEvent?.code || 'Unknown Code',
          gameSpecificData: {
            autonomous: formData.autonomous,
            teleop: formData.teleop,
            endgame: formData.endgame,
            fouls: formData.fouls
          },
          notes: formData.notes,
          timestamp: new Date(),
          ...(session?.user?.role === 'tablet' && selectedScoutId ? { scoutingForUserId: selectedScoutId } : {})
        };

        const result = await matchApi.create(entryToSave);

        if (result.isQueued) {
          toast.success("Data queued for sync", {
            description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} saved offline. Will sync when online.`,
            icon: <Clock className="h-4 w-4" />
          });
        } else {
          toast.success("Match data saved!", {
            description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} saved successfully`,
            icon: <CheckCircle className="h-4 w-4" />
          });
        }
        
        // Keep alliance position and increment match number when resetting form
        const newFormData = gameConfig ? initializeFormData(gameConfig) : defaultData;
        newFormData.alliance = formData.alliance;
        newFormData.alliancePosition = formData.alliancePosition;
        newFormData.matchNumber = Number(formData.matchNumber) + 1;
        setFormData(newFormData);
      }
    } catch (error) {
      toast.error("Failed to save data", {
        description: error instanceof Error ? error.message : "Unknown error",
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{hideSpinnersStyle}</style>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {gameConfig?.gameName || 'Unknown Game'} - {isEditMode ? 'Edit Match Entry' : 'Match Scouting'}
          </Badge>
        </div>

        {isLoadingEdit && (
          <Card className="border rounded-xl shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-muted-foreground">Loading entry for editing...</div>
            </CardContent>
          </Card>
        )}

        {session?.user && (
          <ScoutSelector
            selectedScoutId={selectedScoutId}
            onScoutChange={setSelectedScoutId}
            currentUserId={session.user.id || ''}
            currentUserRole={session.user.role || null}
          />
        )}

        <MatchInfoSection
          formData={formData}
          competitionType={competitionType}
          eventTeamNumbers={eventTeamNumbers}
          teamsLoading={teamsLoading}
          onBasicInputChange={handleBasicInputChange}
          onAllianceChange={handleAllianceChange}
        />

        {gameConfig?.scoring?.autonomous && (
          <ScoringSection
            title="Autonomous Period"
            description="Performance during the autonomous period"
            icon={<Zap className="h-5 w-5" />}
            section="autonomous"
            scoringConfig={gameConfig.scoring.autonomous}
            formData={formData}
            gameConfig={gameConfig}
            showStartPosition={true}
            onInputChange={handleInputChange}
            onNumberChange={handleNumberChange}
          />
        )}

        {gameConfig?.scoring?.teleop && (
          <ScoringSection
            title="Teleop Period"
            description="Driver-controlled period performance"
            icon={<Award className="h-5 w-5" />}
            section="teleop"
            scoringConfig={gameConfig.scoring.teleop}
            formData={formData}
            onInputChange={handleInputChange}
            onNumberChange={handleNumberChange}
          />
        )}

        {gameConfig?.scoring?.endgame && (
          <ScoringSection
            title="Endgame"
            icon={<AlertTriangle className="h-5 w-5" />}
            section="endgame"
            scoringConfig={gameConfig.scoring.endgame}
            formData={formData}
            onInputChange={handleInputChange}
            onNumberChange={handleNumberChange}
          />
        )}

        {gameConfig?.scoring?.fouls && (
          <ScoringSection
            title="Fouls & Penalties"
            description="Track penalties and fouls committed"
            icon={<AlertTriangle className="h-5 w-5" />}
            section="fouls"
            scoringConfig={gameConfig.scoring.fouls}
            formData={formData}
            onInputChange={handleInputChange}
            onNumberChange={handleNumberChange}
          />
        )}

        <Card className="border rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-2">
            <label className="text-sm font-medium text-primary/90">Additional Notes</label>
            <Textarea
              placeholder="Any additional observations about this match..."
              value={formData.notes}
              onChange={(e) => handleBasicInputChange('notes', e.target.value)}
              className="focus:border-green-500"
            />
          </CardContent>
        </Card>

        <Card className="border rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {isEditMode ? 'Update the entry and return to dashboard' : 'Data saves locally and syncs automatically'}
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                {isEditMode ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/matchscouting')}
                      className="h-14"
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="min-w-[140px] h-14 bg-green-600 hover:bg-green-700 text-base"
                      size="lg"
                    >
                      {isSubmitting ? "Updating..." : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Update Entry
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setFormData(gameConfig ? initializeFormData(gameConfig) : defaultData)}
                      className="hover:bg-green-50 h-14"
                      size="lg"
                    >
                      Clear Form
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="min-w-[140px] h-14 bg-green-600 hover:bg-green-700 text-base"
                      size="lg"
                    >
                      {isSubmitting ? "Saving..." : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Save Data
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
