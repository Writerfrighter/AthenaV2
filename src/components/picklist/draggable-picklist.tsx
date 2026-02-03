'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Save, Loader2, Plus } from 'lucide-react';
import { CompetitionType, PicklistEntry } from '@/lib/shared-types';
import { usePicklist } from '@/hooks/use-picklist';
import { useEventTeams } from '@/hooks/use-event-teams';
import { toast } from 'sonner';

interface DraggablePicklistProps {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
}

type ListType = 'pick1' | 'pick2' | 'unlisted';

export function DraggablePicklist({ eventCode, year, competitionType }: DraggablePicklistProps) {
  const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<ListType | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [newNotes, setNewNotes] = useState<Map<number, string>>(new Map());
  const { teams: eventTeams, loading: teamsLoading } = useEventTeams();

  // Get user's own team number from session/config (default to 492 for now)
  const ownTeamNumber = 492; // TODO: Get from user session

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

  // FTC only uses one list (pick1)
  const isFRC = competitionType === 'FRC';

  // Calculate unlisted teams (all event teams not in pick1 or pick2, excluding own team)
  const unlistedTeams = eventTeams.filter(
    (team) => 
      team.teamNumber !== ownTeamNumber &&
      !pick1.entries.find((e) => e.teamNumber === team.teamNumber) &&
      (!isFRC || !pick2.entries.find((e) => e.teamNumber === team.teamNumber))
  );

  // Initialize picklists if needed
  const initializePicklists = useCallback(async () => {
    if ((pick1.picklist && (!isFRC || pick2.picklist)) || teamsLoading) return;

    try {
      // Filter out own team from initial rankings
      const availableTeams = pick1.initialRanking.filter(t => t.teamNumber !== ownTeamNumber);
      
      if (isFRC) {
        // Split teams between pick1 and unlisted for FRC
        const midpoint = Math.min(8, Math.ceil(availableTeams.length / 3)); // Top 8 in pick1
        
        const pick1Entries: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[] =
          availableTeams.slice(0, midpoint).map((team, idx) => ({
            picklistId: 0,
            teamNumber: team.teamNumber,
            rank: idx + 1,
            qualRanking: team.rank
          }));

        // Rest go to unlisted initially (pick2 starts empty)
        await pick1.createPicklist(pick1Entries);
        await pick2.createPicklist([]); // Empty pick2 initially
      } else {
        // FTC: put top teams in main list
        const topCount = Math.min(12, Math.ceil(availableTeams.length / 2));
        const ftcEntries: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[] =
          availableTeams.slice(0, topCount).map((team, idx) => ({
            picklistId: 0,
            teamNumber: team.teamNumber,
            rank: idx + 1,
            qualRanking: team.rank
          }));
        await pick1.createPicklist(ftcEntries);
      }
      
      toast.success('Picklist initialized from rankings');
    } catch (error) {
      console.error('Failed to initialize picklists:', error);
      toast.error('Failed to initialize picklists');
    }
  }, [pick1, pick2, isFRC, teamsLoading, ownTeamNumber]);

  useEffect(() => {
    initializePicklists();
  }, [initializePicklists]);

  const toggleTeamExpanded = (teamNumber: number) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamNumber)) {
      newExpanded.delete(teamNumber);
    } else {
      newExpanded.add(teamNumber);
    }
    setExpandedTeams(newExpanded);
  };

  const handleDragStart = (teamNumber: number, source: ListType) => {
    setDraggedTeam(teamNumber);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(
    async (target: ListType) => {
      if (!draggedTeam || !dragSource) {
        setDraggedTeam(null);
        setDragSource(null);
        return;
      }

      // Don't do anything if dropping on the same list
      if (dragSource === target) {
        setDraggedTeam(null);
        setDragSource(null);
        return;
      }

      try {
        const getPicklist = (listType: ListType) => {
          if (listType === 'pick1') return pick1;
          if (listType === 'pick2') return pick2;
          return null;
        };

        const sourcePicklist = getPicklist(dragSource);
        const targetPicklist = getPicklist(target);

        // Handle moves involving unlisted
        if (dragSource === 'unlisted') {
          // Moving from unlisted to a picklist
          if (!targetPicklist?.picklist?.id) return;
          
          const targetEntries = targetPicklist.entries
            .map(e => ({ teamNumber: e.teamNumber, rank: e.rank }))
            .sort((a, b) => a.rank - b.rank);
          
          // Add to end
          targetEntries.push({ teamNumber: draggedTeam, rank: targetEntries.length + 1 });
          
          // Reindex
          const reindexed = targetEntries.map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));
          
          await targetPicklist.updatePicklistOrder(reindexed);
        } else if (target === 'unlisted') {
          // Moving from a picklist to unlisted (just remove from source)
          if (!sourcePicklist?.picklist?.id) return;
          
          const sourceEntries = sourcePicklist.entries
            .filter((e) => e.teamNumber !== draggedTeam)
            .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));
          
          await sourcePicklist.updatePicklistOrder(sourceEntries);
        } else {
          // Moving between two different picklists
          if (!sourcePicklist?.picklist?.id || !targetPicklist?.picklist?.id) return;

          // Remove from source
          const sourceEntries = sourcePicklist.entries
            .filter((e) => e.teamNumber !== draggedTeam)
            .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));

          // Add to target at end
          const targetEntries = targetPicklist.entries
            .map(e => ({ teamNumber: e.teamNumber, rank: e.rank }))
            .sort((a, b) => a.rank - b.rank);
          
          targetEntries.push({ teamNumber: draggedTeam, rank: targetEntries.length + 1 });
          
          // Reindex
          const reindexed = targetEntries.map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));

          await sourcePicklist.updatePicklistOrder(sourceEntries);
          await targetPicklist.updatePicklistOrder(reindexed);
        }

        toast.success(`Team ${draggedTeam} moved to ${target === 'unlisted' ? 'Unlisted' : target.toUpperCase()}`);
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

  const handleAddNote = async (teamNumber: number, picklistHook: ReturnType<typeof usePicklist>) => {
    const note = newNotes.get(teamNumber);
    if (!note?.trim()) return;

    try {
      await picklistHook.addNote(teamNumber, note);
      setNewNotes(new Map(newNotes).set(teamNumber, ''));
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const renderTeamCard = (teamNumber: number, rank: number, listType: ListType, picklistHook?: ReturnType<typeof usePicklist>) => {
    const isExpanded = expandedTeams.has(teamNumber);
    const teamNotes = picklistHook ? picklistHook.notes(teamNumber) : [];
    const newNote = newNotes.get(teamNumber) || '';
    const isDragging = draggedTeam === teamNumber;

    return (
      <Collapsible
        key={teamNumber}
        open={isExpanded}
        onOpenChange={() => toggleTeamExpanded(teamNumber)}
      >
        <div
          draggable
          onDragStart={() => handleDragStart(teamNumber, listType)}
          className={`border rounded-lg transition-all ${
            isDragging
              ? 'opacity-30 bg-muted'
              : 'hover:bg-accent hover:shadow-md cursor-move'
          }`}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-3 cursor-pointer">
              <div className="flex-shrink-0 font-bold text-lg w-8 text-right">
                #{rank}
              </div>
              <div className="flex-grow font-semibold text-lg">{teamNumber}</div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3 border-t pt-3">
              {/* Team Stats/Info would go here */}
              <div className="text-sm text-muted-foreground">
                <p>EPA: TBD</p>
                <p>Matches: TBD</p>
              </div>

              {/* Existing Notes */}
              {teamNotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Picklist Notes:</p>
                  {teamNotes.map((note) => (
                    <div key={note.id} className="text-sm bg-muted p-2 rounded">
                      <p>{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.created_by} • {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Note */}
              {picklistHook && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note for this team..."
                    value={newNote}
                    onChange={(e) => setNewNotes(new Map(newNotes).set(teamNumber, e.target.value))}
                    className="min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddNote(teamNumber, picklistHook)}
                    disabled={!newNote.trim()}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Note
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  if (pick1.isLoading || pick2.isLoading || teamsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading picklists...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-4 text-sm">
        <div>
          <span className="font-semibold">Total Event Teams:</span> {eventTeams.length}
        </div>
        <div>
          <span className="font-semibold">Pick 1:</span> {pick1.entries.length}
        </div>
        {isFRC && (
          <div>
            <span className="font-semibold">Pick 2:</span> {pick2.entries.length}
          </div>
        )}
        <div>
          <span className="font-semibold">Unlisted:</span> {unlistedTeams.length}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className={`grid ${isFRC ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        {/* Pick 1 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pick 1</CardTitle>
              <Badge variant="default">{pick1.entries.length}</Badge>
            </div>
          </CardHeader>
          <CardContent
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop('pick1');
            }}
            className="min-h-[400px] space-y-2 border-2 border-dashed border-transparent hover:border-primary rounded-lg p-3 transition-colors"
          >
            {pick1.entries.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Drag teams here for Pick 1
              </div>
            ) : (
              pick1.entries
                .sort((a, b) => a.rank - b.rank)
                .map((entry) => renderTeamCard(entry.teamNumber, entry.rank, 'pick1', pick1))
            )}
          </CardContent>
        </Card>

        {/* Pick 2 (FRC only) */}
        {isFRC && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pick 2</CardTitle>
                <Badge variant="secondary">{pick2.entries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop('pick2');
              }}
              className="min-h-[400px] space-y-2 border-2 border-dashed border-transparent hover:border-secondary rounded-lg p-3 transition-colors"
            >
              {pick2.entries.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Drag teams here for Pick 2
                </div>
              ) : (
                pick2.entries
                  .sort((a, b) => a.rank - b.rank)
                  .map((entry) => renderTeamCard(entry.teamNumber, entry.rank, 'pick2', pick2))
              )}
            </CardContent>
          </Card>
        )}

        {/* Unlisted */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Unlisted</CardTitle>
              <Badge variant="outline">{unlistedTeams.length}</Badge>
            </div>
          </CardHeader>
          <CardContent
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop('unlisted');
            }}
            className="min-h-[400px] space-y-2 border-2 border-dashed border-transparent hover:border-muted-foreground/50 rounded-lg p-3 transition-colors"
          >
            {unlistedTeams.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                All teams are in picklists
              </div>
            ) : (
              unlistedTeams.map((team, idx) => renderTeamCard(team.teamNumber, idx + 1, 'unlisted'))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auto-save indicator */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {pick1.isSaving || pick2.isSaving ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1 h-3 w-3" />
              Changes saved automatically
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
