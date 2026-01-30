'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ArrowRight, Save } from 'lucide-react';
import { CompetitionType, PicklistEntry } from '@/lib/shared-types';
import { usePicklist } from '@/hooks/use-picklist';
import { toast } from 'sonner';

interface DraggablePicklistProps {
  eventCode: string;
  year: number;
  competitionType: 'FRC'; // This component is only for FRC
}

export function DraggablePicklist({ eventCode, year, competitionType }: DraggablePicklistProps) {
  const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'pick1' | 'pick2' | null>(null);

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

  // Initialize both picklists if needed
  const initializePicklists = useCallback(async () => {
    if (pick1.picklist && pick2.picklist) return;

    try {
      // Create entries split roughly in half
      const totalTeams = pick1.initialRanking.length;
      const midpoint = Math.ceil(totalTeams / 2);

      const pick1Entries: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[] =
        pick1.initialRanking.slice(0, midpoint).map((team, idx) => ({
          picklistId: 0,
          teamNumber: team.teamNumber,
          rank: idx + 1,
          qualRanking: team.rank
        }));

      const pick2Entries: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[] =
        pick1.initialRanking.slice(midpoint).map((team, idx) => ({
          picklistId: 0,
          teamNumber: team.teamNumber,
          rank: idx + 1,
          qualRanking: team.rank
        }));

      await pick1.createPicklist(pick1Entries);
      await pick2.createPicklist(pick2Entries);
      toast.success('Picklists initialized from rankings');
    } catch (error) {
      console.error('Failed to initialize picklists:', error);
      toast.error('Failed to initialize picklists');
    }
  }, [pick1, pick2]);

  const handleDragStart = (teamNumber: number, source: 'pick1' | 'pick2') => {
    setDraggedTeam(teamNumber);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(
    async (target: 'pick1' | 'pick2') => {
      if (!draggedTeam || !dragSource || dragSource === target) return;

      try {
        const sourcePicklist = dragSource === 'pick1' ? pick1 : pick2;
        const targetPicklist = target === 'pick1' ? pick1 : pick2;

        // Get entries from source
        const sourceEntries = sourcePicklist.entries;
        const entryToMove = sourceEntries.find((e) => e.teamNumber === draggedTeam);

        if (!entryToMove) return;

        // Remove from source and reorder
        const updatedSourceEntries = sourceEntries
          .filter((e) => e.teamNumber !== draggedTeam)
          .map((e, idx) => ({ teamNumber: e.teamNumber, rank: idx + 1 }));

        // Add to target at the end and reorder
        const targetEntries = targetPicklist.entries.map((e, idx) => ({
          teamNumber: e.teamNumber,
          rank: idx + 1
        }));
        targetEntries.push({ teamNumber: draggedTeam, rank: targetEntries.length + 1 });

        // Save both
        await sourcePicklist.updatePicklistOrder(updatedSourceEntries);
        await targetPicklist.updatePicklistOrder(targetEntries);

        toast.success(`Team ${draggedTeam} moved to ${target.toUpperCase()}`);
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
        <h2 className="text-2xl font-bold">FRC Picklists - Draggable Editor</h2>
        {showInitialize && (
          <Button onClick={initializePicklists}>
            Initialize from Rankings
          </Button>
        )}
      </div>

      {!showInitialize && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  Drag teams here to add to Pick 1
                </div>
              ) : (
                pick1.entries
                  .sort((a, b) => a.rank - b.rank)
                  .map((entry) => (
                    <div
                      key={entry.teamNumber}
                      draggable
                      onDragStart={() => handleDragStart(entry.teamNumber, 'pick1')}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                        draggedTeam === entry.teamNumber
                          ? 'opacity-50 bg-muted'
                          : 'hover:bg-accent hover:shadow-md'
                      }`}
                    >
                      <div className="flex-shrink-0 font-bold text-lg w-8 text-right">
                        #{entry.rank}
                      </div>
                      <div className="flex-grow font-semibold text-lg">{entry.teamNumber}</div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Pick 2 List */}
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
                  Drag teams here to add to Pick 2
                </div>
              ) : (
                pick2.entries
                  .sort((a, b) => a.rank - b.rank)
                  .map((entry) => (
                    <div
                      key={entry.teamNumber}
                      draggable
                      onDragStart={() => handleDragStart(entry.teamNumber, 'pick2')}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                        draggedTeam === entry.teamNumber
                          ? 'opacity-50 bg-muted'
                          : 'hover:bg-accent hover:shadow-md'
                      }`}
                    >
                      <div className="flex-shrink-0 font-bold text-lg w-8 text-right">
                        #{entry.rank}
                      </div>
                      <div className="flex-grow font-semibold text-lg">{entry.teamNumber}</div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!showInitialize && (
        <div className="flex justify-center">
          <Button disabled={pick1.isSaving || pick2.isSaving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Picklists auto-saved
          </Button>
        </div>
      )}
    </div>
  );
}
