'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
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

  // Calculate unlisted teams (all event teams minus pick1, pick2, and own team)
  const unlistedTeams = useMemo(() => {
    const pick1TeamNumbers = new Set(pick1.entries.map(e => e.teamNumber));
    const pick2TeamNumbers = new Set(pick2.entries.map(e => e.teamNumber));
    
    return allEventTeams
      .filter(team => 
        team.teamNumber !== ownTeamNumber &&
        !pick1TeamNumbers.has(team.teamNumber) &&
        !pick2TeamNumbers.has(team.teamNumber)
      )
      .map((team, idx) => ({
        teamNumber: team.teamNumber,
        rank: idx + 1
      }));
  }, [allEventTeams, pick1.entries, pick2.entries, ownTeamNumber]);

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
    async (target: 'pick1' | 'pick2' | 'unlisted') => {
      if (!draggedTeam || !dragSource) return;
      if (dragSource === target) {
        setDraggedTeam(null);
        setDragSource(null);
        return;
      }

      try {
        // Handle drops to unlisted (just remove from source)
        if (target === 'unlisted') {
          if (dragSource === 'pick1') {
            const updatedEntries = pick1.entries
              .filter(e => e.teamNumber !== draggedTeam)
              .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));
            await pick1.updatePicklistOrder(updatedEntries);
          } else if (dragSource === 'pick2') {
            const updatedEntries = pick2.entries
              .filter(e => e.teamNumber !== draggedTeam)
              .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));
            await pick2.updatePicklistOrder(updatedEntries);
          }
          toast.success(`Team ${draggedTeam} moved to Unlisted`);
          setDraggedTeam(null);
          setDragSource(null);
          return;
        }

        // Handle drops to pick1 or pick2
        const targetPicklist = target === 'pick1' ? pick1 : pick2;
        const sourcePicklist = dragSource === 'pick1' ? pick1 : dragSource === 'pick2' ? pick2 : null;

        // Add to target at end
        const newTargetEntries = [
          ...targetPicklist.entries.map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 })),
          { teamNumber: draggedTeam, rank: targetPicklist.entries.length + 1 }
        ];
        await targetPicklist.updatePicklistOrder(newTargetEntries);

        // Remove from source if not unlisted
        if (sourcePicklist) {
          const newSourceEntries = sourcePicklist.entries
            .filter(e => e.teamNumber !== draggedTeam)
            .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));
          await sourcePicklist.updatePicklistOrder(newSourceEntries);
        }

        toast.success(`Team ${draggedTeam} moved to ${target === 'pick1' ? 'Pick 1' : 'Pick 2'}`);
      } catch (error) {
        console.error('Failed to move team:', error);
        toast.error('Failed to move team');
      } finally {
        setDraggedTeam(null);
        setDragSource(null);
      }
    },
    [draggedTeam, dragSource, pick1, pick2]
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
          draggable
          onDragStart={() => handleDragStart(teamNumber, source)}
          className={`border rounded-lg transition-all ${
            isDragging
              ? 'opacity-50 bg-muted'
              : 'hover:bg-accent hover:shadow-md cursor-move'
          }`}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-3 w-full">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              {rank !== null && (
                <div className="flex-shrink-0 font-bold text-lg w-8 text-right">
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
            <div className="px-3 pb-3 space-y-2 border-t pt-3">
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
        <h2 className="text-2xl font-bold">
          {competitionType === 'FRC' ? 'FRC' : 'FTC'} Picklist - {eventCode}
        </h2>
        {showInitialize && (
          <Button onClick={initializePicklists}>
            <Plus className="mr-2 h-4 w-4" />
            Initialize Picklist
          </Button>
        )}
      </div>

      {!showInitialize && (
        <div className={`grid gap-6 ${competitionType === 'FRC' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Pick 1 List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pick 1</CardTitle>
                <Badge variant="default">{pick1.entries.length} teams</Badge>
              </div>
            </CardHeader>
            <CardContent
              onDragOver={handleDragOver}
              onDrop={() => handleDrop('pick1')}
              className="min-h-96 space-y-2 border-2 border-dashed border-transparent hover:border-primary rounded-lg p-4 transition-colors"
            >
              {pick1.entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Drag teams here
                </div>
              ) : (
                pick1.entries
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
                  <Badge variant="secondary">{pick2.entries.length} teams</Badge>
                </div>
              </CardHeader>
              <CardContent
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('pick2')}
                className="min-h-96 space-y-2 border-2 border-dashed border-transparent hover:border-secondary rounded-lg p-4 transition-colors"
              >
                {pick2.entries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Drag teams here
                  </div>
                ) : (
                  pick2.entries
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
                unlistedTeams.map((team) => renderTeamCard(team.teamNumber, null, 'unlisted'))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!showInitialize && (
        <div className="text-center text-sm text-muted-foreground">
          Picklists auto-save on every change
        </div>
      )}
    </div>
  );
}
