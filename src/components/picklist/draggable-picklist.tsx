'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, GripVertical, Trash2, Save } from 'lucide-react';
import { CompetitionType, PicklistEntry } from '@/lib/shared-types';
import { usePicklist } from '@/hooks/use-picklist';
import { useEventTeams } from '@/hooks/use-event-teams';
import { toast } from 'sonner';

interface DraggablePicklistProps {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
  ownTeamNumber?: number;
}

interface TeamRankingData {
  teamNumber: number;
  rank: number;
  qualRanking?: number;
}

export function DraggablePicklist({ 
  eventCode, 
  year, 
  competitionType,
  ownTeamNumber = 492 
}: DraggablePicklistProps) {
  const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'pick1' | 'pick2' | 'unlisted' | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [teamNotes, setTeamNotes] = useState<Record<number, string>>({});
  const [rankingData, setRankingData] = useState<Map<number, TeamRankingData>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localPick1Order, setLocalPick1Order] = useState<PicklistEntry[]>([]);
  const [localPick2Order, setLocalPick2Order] = useState<PicklistEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Get all event teams
  const { teams: allEventTeams = [] } = useEventTeams();

  // Initialize picklists
  const pick1 = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: 'pick1'
  });

  const pick2 = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: 'pick2'
  });

  // Sync local state with picklist entries (but not during save)
  useEffect(() => {
    if (!isSaving) {
      setLocalPick1Order(pick1.entries);
      setLocalPick2Order(pick2.entries);
      setHasUnsavedChanges(false);
    }
  }, [pick1.entries, pick2.entries, isSaving]);

  // Fetch ranking data from API when event/year changes
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const params = new URLSearchParams({
          eventCode,
          year: year.toString(),
          competitionType
        });
        const response = await fetch(`/api/database/picklist?${params}`);
        if (response.ok) {
          const data = await response.json();
          const rankMap = new Map<number, TeamRankingData>();
          if (data.teams && Array.isArray(data.teams)) {
            data.teams.forEach((team: any) => {
              rankMap.set(team.teamNumber, {
                teamNumber: team.teamNumber,
                rank: team.rank,
                qualRanking: team.rank
              });
            });
          }
          setRankingData(rankMap);
        }
      } catch (error) {
        console.error('Error fetching rankings:', error);
      }
    };
    fetchRankings();
  }, [eventCode, year, competitionType]);

  // Calculate unlisted teams (all event teams minus pick1, pick2, and own team)
  const unlistedTeams = useMemo(() => {
    const pick1TeamNumbers = new Set(localPick1Order.map(e => e.teamNumber));
    const pick2TeamNumbers = new Set(localPick2Order.map(e => e.teamNumber));
    
    return allEventTeams
      .filter(team => 
        team.teamNumber !== ownTeamNumber &&
        !pick1TeamNumbers.has(team.teamNumber) &&
        !pick2TeamNumbers.has(team.teamNumber)
      )
      .map((team, idx) => {
        const rankInfo = rankingData.get(team.teamNumber);
        return {
          teamNumber: team.teamNumber,
          rank: idx + 1,
          qualRanking: rankInfo?.qualRanking
        };
      });
  }, [allEventTeams, localPick1Order, localPick2Order, ownTeamNumber, rankingData]);

  // Initialize picklists if needed
  const initializePicklists = useCallback(async () => {
    if (pick1.picklist || pick2.picklist) return;

    try {
      // Start with empty pick1 and pick2
      await pick1.createPicklist([]);
      await pick2.createPicklist([]);
      toast.success('Picklists initialized - drag teams from Unlisted');
    } catch (error) {
      console.error('Failed to initialize picklists:', error);
      toast.error('Failed to initialize picklists');
    }
  }, [pick1, pick2]);

  // Calculate total unique teams in picklists (excluding team 492)
  const totalPicklistTeams = useMemo(() => {
    const allPicklistTeams = new Set<number>();
    localPick1Order.forEach(e => allPicklistTeams.add(e.teamNumber));
    localPick2Order.forEach(e => allPicklistTeams.add(e.teamNumber));
    return allPicklistTeams.size;
  }, [localPick1Order, localPick2Order]);

  const totalEventTeams = allEventTeams.filter(t => t.teamNumber !== ownTeamNumber).length;
  
  // Detect mismatches: either wrong total count or duplicates within picklists
  const actualPicklistCount = localPick1Order.length + localPick2Order.length;
  const hasDiscrepancy = (
    totalPicklistTeams + unlistedTeams.length !== totalEventTeams || // Total mismatch
    totalPicklistTeams !== actualPicklistCount // Duplicates exist
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Deduplicate local state before saving
      const deduplicatePick1 = () => {
        const seen = new Set<number>();
        return localPick1Order.filter(e => {
          if (seen.has(e.teamNumber)) {
            console.warn(`Removing duplicate team ${e.teamNumber} from Pick 1 before save`);
            return false;
          }
          seen.add(e.teamNumber);
          return true;
        });
      };

      const deduplicatePick2 = () => {
        const seen = new Set<number>();
        return localPick2Order.filter(e => {
          if (seen.has(e.teamNumber)) {
            console.warn(`Removing duplicate team ${e.teamNumber} from Pick 2 before save`);
            return false;
          }
          seen.add(e.teamNumber);
          return true;
        });
      };

      const dedupedPick1 = deduplicatePick1();
      const dedupedPick2 = deduplicatePick2();

      // Update local state with deduplicated data
      setLocalPick1Order(dedupedPick1.map((e, idx) => ({ ...e, rank: idx + 1 })));
      setLocalPick2Order(dedupedPick2.map((e, idx) => ({ ...e, rank: idx + 1 })));

      // Save pick1
      const pick1Data = dedupedPick1.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1
      }));
      
      // Save pick2
      const pick2Data = dedupedPick2.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1
      }));

      // Wait for both saves to complete
      await Promise.all([
        pick1.updatePicklistOrder(pick1Data),
        pick2.updatePicklistOrder(pick2Data)
      ]);

      // Refetch to ensure we have the latest data from server
      await Promise.all([
        pick1.fetchExistingPicklist(),
        pick2.fetchExistingPicklist()
      ]);

      setHasUnsavedChanges(false);
      toast.success('Picklist saved successfully');
    } catch (error) {
      console.error('Failed to save picklist:', error);
      toast.error('Failed to save picklist');
    } finally {
      setIsSaving(false);
    }
  }, [localPick1Order, localPick2Order, pick1, pick2]);

  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset the picklist? This will delete all current picks and start fresh.')) {
      return;
    }
    try {
      await pick1.deletePicklist();
      await pick2.deletePicklist();
      setLocalPick1Order([]);
      setLocalPick2Order([]);
      setHasUnsavedChanges(false);
      toast.success('Picklists reset - click Initialize to start fresh');
    } catch (error) {
      console.error('Failed to reset picklists:', error);
    }
  }, [pick1, pick2]);

  const toggleTeamExpanded = (teamNumber: number) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamNumber)) {
        next.delete(teamNumber);
      } else {
        next.add(teamNumber);
      }
      return next;
    });
  };

  const handleDragStart = (teamNumber: number, source: 'pick1' | 'pick2' | 'unlisted') => {
    setDraggedTeam(teamNumber);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(
    (target: 'pick1' | 'pick2' | 'unlisted') => {
      if (!draggedTeam || !dragSource) return;
      if (dragSource === target) {
        setDraggedTeam(null);
        setDragSource(null);
        return;
      }

      // Handle drops to unlisted (just remove from source)
      if (target === 'unlisted') {
        if (dragSource === 'pick1') {
          const updatedEntries = localPick1Order
            .filter(e => e.teamNumber !== draggedTeam)
            .map((e, idx) => ({ ...e, rank: idx + 1 }));
          setLocalPick1Order(updatedEntries);
        } else if (dragSource === 'pick2') {
          const updatedEntries = localPick2Order
            .filter(e => e.teamNumber !== draggedTeam)
            .map((e, idx) => ({ ...e, rank: idx + 1 }));
          setLocalPick2Order(updatedEntries);
        }
        setHasUnsavedChanges(true);
        setDraggedTeam(null);
        setDragSource(null);
        return;
      }

      // Handle drops to pick1 or pick2
      // Find the team being moved
      let movedTeam: PicklistEntry | undefined;
      if (dragSource === 'pick1') {
        movedTeam = localPick1Order.find(e => e.teamNumber === draggedTeam);
      } else if (dragSource === 'pick2') {
        movedTeam = localPick2Order.find(e => e.teamNumber === draggedTeam);
      }

      // Create the team entry to add if coming from unlisted
      const teamToAdd = movedTeam || {
        teamNumber: draggedTeam,
        picklistId: target === 'pick1' ? pick1.picklist?.id || 0 : pick2.picklist?.id || 0
      } as PicklistEntry;

      // Start with current state
      let newPick1 = [...localPick1Order];
      let newPick2 = [...localPick2Order];

      // Remove from source list first
      if (dragSource === 'pick1') {
        newPick1 = localPick1Order.filter(e => e.teamNumber !== draggedTeam);
      } else if (dragSource === 'pick2') {
        newPick2 = localPick2Order.filter(e => e.teamNumber !== draggedTeam);
      }

      // Add to target list (no need to filter first since we know it's not there after removing from source)
      if (target === 'pick1') {
        newPick1 = [...newPick1, teamToAdd];
      } else {
        newPick2 = [...newPick2, teamToAdd];
      }

      // Recalculate ranks
      newPick1 = newPick1.map((e, idx) => ({ ...e, rank: idx + 1 }));
      newPick2 = newPick2.map((e, idx) => ({ ...e, rank: idx + 1 }));

      // Update state
      setLocalPick1Order(newPick1);
      setLocalPick2Order(newPick2);

      setHasUnsavedChanges(true);
      setDraggedTeam(null);
      setDragSource(null);
    },
    [draggedTeam, dragSource, localPick1Order, localPick2Order, pick1.picklist?.id, pick2.picklist?.id]
  );

  const renderTeamCard = (
    teamNumber: number, 
    rank: number | null, 
    source: 'pick1' | 'pick2' | 'unlisted',
    qualRanking?: number
  ) => {
    const isExpanded = expandedTeams.has(teamNumber);
    const isDragging = draggedTeam === teamNumber;

    return (
      <Collapsible
        key={teamNumber}
        open={isExpanded}
        onOpenChange={() => toggleTeamExpanded(teamNumber)}
      >
        <div
          className={`border rounded-lg transition-all ${
            isDragging
              ? 'opacity-50 bg-muted'
              : ''
          }`}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 p-3 w-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleTeamExpanded(teamNumber);
              }}
            >
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(teamNumber, source);
                }}
                className="cursor-move hover:bg-accent rounded p-1 flex-shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              {rank !== null && (
                <div className="flex-shrink-0 font-bold text-lg">
                  #{rank}
                </div>
              )}
              <div className="flex-grow font-semibold text-lg">{teamNumber}</div>
              {qualRanking && (
                <Badge variant="outline" className="flex-shrink-0">
                  Qual: {qualRanking}
                </Badge>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-2 border-t pt-3 bg-background">
              <div className="text-sm font-medium">Notes:</div>
              <Textarea
                value={teamNotes[teamNumber] || ''}
                onChange={(e) => setTeamNotes(prev => ({
                  ...prev,
                  [teamNumber]: e.target.value
                }))}
                placeholder="Add notes about this team..."
                className="min-h-20"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-xs text-muted-foreground">
                Qual Rank: {qualRanking || 'N/A'}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  if (pick1.isLoading || pick2.isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading picklists...</div>
        </CardContent>
      </Card>
    );
  }

  const showInitialize = !pick1.picklist || !pick2.picklist;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {competitionType === 'FRC' ? 'FRC' : 'FTC'} Picklist - {eventCode}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalPicklistTeams + unlistedTeams.length} / {totalEventTeams} teams (excluding #{ownTeamNumber})
            {hasDiscrepancy && (
              <span className="text-destructive ml-2">⚠ Team count mismatch detected</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {showInitialize ? (
            <Button onClick={initializePicklists}>
              <Plus className="mr-2 h-4 w-4" />
              Initialize Picklist
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleSave} 
                disabled={!hasUnsavedChanges || isSaving}
                variant="default"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {hasDiscrepancy && (
                <Button variant="destructive" onClick={handleReset}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Picklist
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!showInitialize && (
        <div className={`grid gap-6 ${competitionType === 'FRC' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Pick 1 List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pick 1</CardTitle>
                <Badge variant="default">{localPick1Order.length} teams</Badge>
              </div>
            </CardHeader>
            <CardContent
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('pick1')}
              className="min-h-96 space-y-2 border-2 border-dashed border-transparent hover:border-primary rounded-lg p-4 transition-colors"
            >
              {localPick1Order.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Drag teams here
                </div>
              ) : (
                localPick1Order
                  .sort((a, b) => a.rank - b.rank)
                  .map((entry) => renderTeamCard(entry.teamNumber, entry.rank, 'pick1', entry.qualRanking))
              )}
            </CardContent>
          </Card>

          {/* Pick 2 List (FRC only) */}
          {competitionType === 'FRC' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pick 2</CardTitle>
                  <Badge variant="secondary">{localPick2Order.length} teams</Badge>
                </div>
              </CardHeader>
              <CardContent
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('pick2')}
                className="min-h-96 space-y-2 border-2 border-dashed border-transparent hover:border-secondary rounded-lg p-4 transition-colors"
              >
                {localPick2Order.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Drag teams here
                  </div>
                ) : (
                  localPick2Order
                    .sort((a, b) => a.rank - b.rank)
                    .map((entry) => renderTeamCard(entry.teamNumber, entry.rank, 'pick2', entry.qualRanking))
                )}
              </CardContent>
            </Card>
          )}

          {/* Unlisted Teams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unlisted</CardTitle>
                <Badge variant="outline">{unlistedTeams.length} teams</Badge>
              </div>
            </CardHeader>
            <CardContent
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('unlisted')}
              className="min-h-96 space-y-2 border-2 border-dashed border-transparent hover:border-muted rounded-lg p-4 transition-colors"
            >
              {unlistedTeams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  All teams assigned
                </div>
              ) : (
                unlistedTeams.map((team) => renderTeamCard(team.teamNumber, null, 'unlisted', team.qualRanking))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!showInitialize && hasUnsavedChanges && (
        <div className="text-center text-sm text-amber-600 dark:text-amber-500 font-medium">
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
