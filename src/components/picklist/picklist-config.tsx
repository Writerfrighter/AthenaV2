'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChevronDown, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { CompetitionType, PicklistEntry } from '@/lib/shared-types';
import { usePicklist } from '@/hooks/use-picklist';
import { toast } from 'sonner';

interface PicklistTeamData {
  teamNumber: number;
  driveTrain: string;
  weight?: number;
  matchesPlayed: number;
  totalEPA: number;
  rank: number;
}

interface PicklistConfigProps {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
}

export function PicklistConfig({ eventCode, year, competitionType }: PicklistConfigProps) {
  const [activeTab, setActiveTab] = useState<'pick1' | 'pick2' | 'main'>(
    competitionType === 'FRC' ? 'pick1' : 'main'
  );
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teamNotes, setTeamNotes] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const pick1Picklist = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: competitionType === 'FRC' ? 'pick1' : undefined
  });

  const pick2Picklist = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: competitionType === 'FRC' ? 'pick2' : undefined
  });

  // Get the appropriate picklist based on competition type and active tab
  const getActivePicklist = () => {
    if (competitionType === 'FTC') return pick1Picklist;
    return activeTab === 'pick1' ? pick1Picklist : pick2Picklist;
  };

  const activePiclist = getActivePicklist();

  // Initialize picklist from initial ranking if not already created
  const initializePicklistFromRanking = useCallback(async () => {
    const picklist = activePiclist.picklist;
    if (picklist) return; // Already initialized

    try {
      const entriesToCreate: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[] =
        activePiclist.initialRanking.map((team) => ({
          picklistId: 0, // Will be set in createPicklist
          teamNumber: team.teamNumber,
          rank: team.rank,
          qualRanking: team.rank
        }));

      const picklistId = await activePiclist.createPicklist(entriesToCreate);
      toast.success(`${activeTab} picklist created with ${entriesToCreate.length} teams`);
    } catch (error) {
      console.error('Failed to initialize picklist:', error);
      toast.error('Failed to initialize picklist');
    }
  }, [activePiclist, activeTab]);

  const handleTeamClick = useCallback(
    async (teamNumber: number) => {
      setSelectedTeam(teamNumber);
      const notes = await activePiclist.getTeamNotes(teamNumber);
      setTeamNotes(notes.map((n: any) => n.note).join('\n\n'));
    },
    [activePiclist]
  );

  const handleAddNote = useCallback(async () => {
    if (!selectedTeam || !newNote.trim()) return;

    try {
      await activePiclist.addNote(selectedTeam, newNote);
      setNewNote('');
      const notes = await activePiclist.getTeamNotes(selectedTeam);
      setTeamNotes(notes.map((n: any) => n.note).join('\n\n'));
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [selectedTeam, newNote, activePiclist]);

  const toggleExpanded = (teamNumber: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(teamNumber)) {
      newExpanded.delete(teamNumber);
    } else {
      newExpanded.add(teamNumber);
    }
    setExpanded(newExpanded);
  };

  if (activePiclist.isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading picklist...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for FRC (Pick 1 / Pick 2) */}
      {competitionType === 'FRC' && (
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('pick1')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pick1'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pick 1
          </button>
          <button
            onClick={() => setActiveTab('pick2')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pick2'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pick 2
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Picklist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {competitionType === 'FRC' ? `${activeTab.toUpperCase()} Rankings` : 'Team Rankings'}
                </CardTitle>
                <Badge variant={activePiclist.picklist ? 'default' : 'secondary'}>
                  {activePiclist.entries.length} teams
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!activePiclist.picklist ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No picklist created yet. Initialize from qualification rankings:
                  </p>
                  <Button onClick={initializePicklistFromRanking} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create {activeTab === 'main' ? 'Picklist' : `${activeTab.toUpperCase()} Picklist`}
                  </Button>
                  {activePiclist.initialRanking.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground">Initial rankings preview:</p>
                      <div className="max-h-96 overflow-y-auto space-y-1">
                        {activePiclist.initialRanking.slice(0, 10).map((team) => (
                          <div key={team.teamNumber} className="flex justify-between text-xs p-2 hover:bg-accent rounded">
                            <span className="font-medium">#{team.rank}</span>
                            <span className="font-bold">{team.teamNumber}</span>
                            <span className="text-muted-foreground">{team.totalEPA.toFixed(1)} EPA</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activePiclist.entries
                    .sort((a, b) => a.rank - b.rank)
                    .map((entry) => (
                      <div
                        key={entry.teamNumber}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                        onClick={() => handleTeamClick(entry.teamNumber)}
                      >
                        <div className="flex-shrink-0 font-bold text-lg w-8">#{entry.rank}</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-lg">{entry.teamNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {expanded.has(entry.teamNumber) ? (
                              <Eye className="h-3 w-3 inline" />
                            ) : (
                              <EyeOff className="h-3 w-3 inline" />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(entry.teamNumber);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expanded.has(entry.teamNumber) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Details Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedTeam ? `Team ${selectedTeam}` : 'Select a team'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTeam && (
                <>
                  {/* Scouting Data */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        View Scouting Notes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Team {selectedTeam} - Scouting Notes</DialogTitle>
                        <DialogDescription>
                          Qualitative notes collected from pit and match scouting
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                          {teamNotes || 'No notes collected yet'}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Picklist Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Picklist Notes</label>
                    <Textarea
                      placeholder="Add picklist-specific notes for this team..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="h-24"
                    />
                    <Button onClick={handleAddNote} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Note
                    </Button>
                  </div>

                  {/* Existing Picklist Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Notes ({activePiclist.notes(selectedTeam).length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {activePiclist.notes(selectedTeam).map((note) => (
                        <div key={note.id} className="bg-muted p-2 rounded text-sm">
                          <p className="text-xs text-muted-foreground mb-1">{note.created_by}</p>
                          <p>{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      {activePiclist.picklist && (
        <div className="flex gap-2">
          <Button
            onClick={() => activePiclist.deletePicklist()}
            variant="destructive"
            className="ml-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Picklist
          </Button>
        </div>
      )}
    </div>
  );
}
