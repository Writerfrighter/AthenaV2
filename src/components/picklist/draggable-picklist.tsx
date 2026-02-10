'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ReactSortable, ItemInterface } from 'react-sortablejs';
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
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from 'sonner';

interface DraggablePicklistProps {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
  ownTeamNumber?: number;
}

interface TeamEPAData {
  totalEPA: number;
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
}

interface SortableTeamItem extends ItemInterface {
  id: string;
  teamNumber: number;
}

export function DraggablePicklist({ 
  eventCode, 
  year, 
  competitionType,
  ownTeamNumber = 492 
}: DraggablePicklistProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [teamNotes, setTeamNotes] = useState<Record<number, string>>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [qualRankings, setQualRankings] = useState<Map<number, number>>(new Map());
  const [epaData, setEpaData] = useState<Map<number, TeamEPAData>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localPick1Order, setLocalPick1Order] = useState<SortableTeamItem[]>([]);
  const [localPick2Order, setLocalPick2Order] = useState<SortableTeamItem[]>([]);
  const [localUnlisted, setLocalUnlisted] = useState<SortableTeamItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const noteSaveTimersRef = useRef<Record<number, NodeJS.Timeout>>({});
  const notesLoadedRef = useRef(false);
  const syncingRef = useRef(false);
  const pick1IdRef = useRef<number | undefined>(undefined);
  const pick2IdRef = useRef<number | undefined>(undefined);
  const localPick1Ref = useRef<SortableTeamItem[]>([]);
  const localPick2Ref = useRef<SortableTeamItem[]>([]);

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

  // Keep refs in sync for use in debounced autosave (avoids stale closures)
  useEffect(() => { pick1IdRef.current = pick1.picklist?.id; }, [pick1.picklist?.id]);
  useEffect(() => { pick2IdRef.current = pick2.picklist?.id; }, [pick2.picklist?.id]);
  useEffect(() => { localPick1Ref.current = localPick1Order; }, [localPick1Order]);
  useEffect(() => { localPick2Ref.current = localPick2Order; }, [localPick2Order]);

  // Helper to convert PicklistEntry[] to SortableTeamItem[]
  const toSortableItems = useCallback((entries: PicklistEntry[]): SortableTeamItem[] => {
    return entries.map(e => ({
      id: String(e.teamNumber),
      teamNumber: e.teamNumber,
    }));
  }, []);

  // Sync local state with picklist entries (but not during save)
  useEffect(() => {
    if (!isSaving && !syncingRef.current) {
      setLocalPick1Order(toSortableItems(pick1.entries));
      setLocalPick2Order(toSortableItems(pick2.entries));
      setHasUnsavedChanges(false);
    }
  }, [pick1.entries, pick2.entries, isSaving, toSortableItems]);

  // Compute unlisted teams whenever picks or event teams change
  useEffect(() => {
    const pick1TeamNumbers = new Set(localPick1Order.map(e => e.teamNumber));
    const pick2TeamNumbers = new Set(localPick2Order.map(e => e.teamNumber));
    
    const unlisted = allEventTeams
      .filter(team => 
        team.teamNumber !== ownTeamNumber &&
        !pick1TeamNumbers.has(team.teamNumber) &&
        !pick2TeamNumbers.has(team.teamNumber)
      )
      .map(team => ({
        id: String(team.teamNumber),
        teamNumber: team.teamNumber,
        qualRanking: qualRankings.get(team.teamNumber) ?? 999,
      }))
      .sort((a, b) => a.qualRanking - b.qualRanking);
    
    setLocalUnlisted(unlisted);
  }, [allEventTeams, localPick1Order, localPick2Order, ownTeamNumber, qualRankings]);

  // Fetch qualification rankings from dedicated TBA endpoint (always returns real qual rankings)
  useEffect(() => {
    const fetchQualRankings = async () => {
      try {
        const params = new URLSearchParams({
          eventCode,
          competitionType,
          year: year.toString(),
        });
        const response = await fetch(`/api/event/rankings?${params}`);
        if (response.ok) {
          const data = await response.json();
          const qualMap = new Map<number, number>();
          // TBA returns [{ rankings: [{ team_key, rank, ... }] }]
          const rankingBlock = Array.isArray(data) ? data[0] : data;
          const rankingItems = rankingBlock?.rankings || [];
          rankingItems.forEach((item: any) => {
            const teamNumber = parseInt(String(item.team_key).replace(/^frc/i, ''), 10);
            if (!isNaN(teamNumber)) {
              qualMap.set(teamNumber, item.rank);
            }
          });
          if (qualMap.size > 0) {
            setQualRankings(qualMap);
          }
        }
      } catch (error) {
        console.error('Error fetching qual rankings:', error);
      }
    };
    fetchQualRankings();
  }, [eventCode, year, competitionType]);

  // Fetch EPA data from picklist API (uses local scouting data)
  useEffect(() => {
    const fetchEpaData = async () => {
      try {
        const params = new URLSearchParams({
          eventCode,
          year: year.toString(),
          competitionType
        });
        const response = await fetch(`/api/database/picklist?${params}`);
        if (response.ok) {
          const data = await response.json();
          const epaMap = new Map<number, TeamEPAData>();
          if (data.teams && Array.isArray(data.teams)) {
            data.teams.forEach((team: any) => {
              epaMap.set(team.teamNumber, {
                totalEPA: team.totalEPA ?? 0,
                autoEPA: team.autoEPA ?? 0,
                teleopEPA: team.teleopEPA ?? 0,
                endgameEPA: team.endgameEPA ?? 0,
              });
            });
          }
          if (epaMap.size > 0) {
            setEpaData(epaMap);
          }
        }
      } catch (error) {
        console.error('Error fetching EPA data:', error);
      }
    };
    fetchEpaData();
  }, [eventCode, year, competitionType]);

  // Load notes from database when picklists are ready
  useEffect(() => {
    if (notesLoadedRef.current) return;
    const picklistId = pick1.picklist?.id || pick2.picklist?.id;
    if (!picklistId) return;

    const loadNotes = async () => {
      try {
        const loaded: Record<number, string> = {};
        if (pick1.picklist?.id) {
          const res = await fetch(`/api/database/picklist/notes?picklistId=${pick1.picklist.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.notes && Array.isArray(data.notes)) {
              data.notes.forEach((n: any) => {
                const content = n.note || n.content || '';
                if (content) loaded[n.teamNumber] = content;
              });
            }
          }
        }
        if (pick2.picklist?.id) {
          const res = await fetch(`/api/database/picklist/notes?picklistId=${pick2.picklist.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.notes && Array.isArray(data.notes)) {
              data.notes.forEach((n: any) => {
                const content = n.note || n.content || '';
                if (content) loaded[n.teamNumber] = content;
              });
            }
          }
        }
        setTeamNotes(prev => ({ ...prev, ...loaded }));
        notesLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };
    loadNotes();
  }, [pick1.picklist?.id, pick2.picklist?.id]);

  // Compute EPA min/max for gradient scaling
  const epaRange = useMemo(() => {
    const allValues = Array.from(epaData.values()).map(e => e.totalEPA);
    if (allValues.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...allValues), max: Math.max(...allValues) };
  }, [epaData]);

  const getEpaColor = useCallback((value: number) => {
    const { min, max } = epaRange;
    if (max === min) return 'hsl(60, 70%, 45%)';
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = Math.round(t * 120);
    return `hsl(${hue}, 75%, 40%)`;
  }, [epaRange]);

  const getEpaBgColor = useCallback((value: number) => {
    const { min, max } = epaRange;
    if (max === min) return 'hsla(60, 70%, 45%, 0.12)';
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = Math.round(t * 120);
    return `hsla(${hue}, 75%, 45%, 0.12)`;
  }, [epaRange]);

  // Initialize picklists if needed
  const initializePicklists = useCallback(async () => {
    if (pick1.picklist || pick2.picklist) return;
    try {
      await pick1.createPicklist([]);
      await pick2.createPicklist([]);
      toast.success('Picklists initialized - drag teams from Unlisted');
    } catch (error) {
      console.error('Failed to initialize picklists:', error);
      toast.error('Failed to initialize picklists');
    }
  }, [pick1, pick2]);

  // Calculate total unique teams in picklists
  const totalPicklistTeams = useMemo(() => {
    const allPicklistTeams = new Set<number>();
    localPick1Order.forEach(e => allPicklistTeams.add(e.teamNumber));
    localPick2Order.forEach(e => allPicklistTeams.add(e.teamNumber));
    return allPicklistTeams.size;
  }, [localPick1Order, localPick2Order]);

  const totalEventTeams = allEventTeams.filter(t => t.teamNumber !== ownTeamNumber).length;
  
  const actualPicklistCount = localPick1Order.length + localPick2Order.length;
  const hasDiscrepancy = (
    totalPicklistTeams + localUnlisted.length !== totalEventTeams ||
    totalPicklistTeams !== actualPicklistCount
  );

  // Resolve which picklistId a team belongs to (pick1, pick2, or fallback)
  const resolvePicklistId = useCallback((teamNumber: number): number | undefined => {
    if (localPick1Ref.current.some(e => e.teamNumber === teamNumber)) {
      return pick1IdRef.current;
    }
    if (localPick2Ref.current.some(e => e.teamNumber === teamNumber)) {
      return pick2IdRef.current;
    }
    // Unlisted teams: use whichever picklist exists
    return pick1IdRef.current ?? pick2IdRef.current;
  }, []);

  // Auto-save note to database with debounce
  // Uses refs so the debounced timer always reads the latest values
  const handleNoteChange = useCallback((teamNumber: number, value: string) => {
    setTeamNotes(prev => ({ ...prev, [teamNumber]: value }));

    // Clear any pending save for this team
    if (noteSaveTimersRef.current[teamNumber]) {
      clearTimeout(noteSaveTimersRef.current[teamNumber]);
    }

    noteSaveTimersRef.current[teamNumber] = setTimeout(async () => {
      // Resolve picklistId at fire time from refs (always fresh)
      const picklistId = resolvePicklistId(teamNumber);
      if (!picklistId) {
        console.warn('Cannot save note: no picklist ID available for team', teamNumber);
        return;
      }

      try {
        if (value.trim()) {
          const res = await fetch('/api/database/picklist/notes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ picklistId, teamNumber, note: value })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('Failed to save note:', res.status, errData);
            toast.error('Failed to save note');
          }
        } else {
          const res = await fetch(
            `/api/database/picklist/notes?picklistId=${picklistId}&teamNumber=${teamNumber}`,
            { method: 'DELETE' }
          );
          if (!res.ok) {
            console.error('Failed to delete note:', res.status);
          }
        }
      } catch (error) {
        console.error('Error saving note:', error);
        toast.error('Failed to save note');
      }
    }, 800);
  }, [resolvePicklistId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const pick1Data = localPick1Order.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1
      }));
      const pick2Data = localPick2Order.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1
      }));

      await Promise.all([
        pick1.updatePicklistOrder(pick1Data),
        pick2.updatePicklistOrder(pick2Data)
      ]);

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

  const confirmReset = useCallback(async () => {
    try {
      await pick1.deletePicklist();
      await pick2.deletePicklist();
      setLocalPick1Order([]);
      setLocalPick2Order([]);
      setHasUnsavedChanges(false);
      notesLoadedRef.current = false;
      setShowResetDialog(false);
      toast.success('Picklists reset - click Initialize to start fresh');
    } catch (error) {
      console.error('Failed to reset picklists:', error);
      setShowResetDialog(false);
    }
  }, [pick1, pick2]);

  const toggleTeamExpanded = (teamNumber: number) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamNumber)) next.delete(teamNumber);
      else next.add(teamNumber);
      return next;
    });
  };

  // ── SortableJS handlers ──
  const handlePick1Change = useCallback((newState: SortableTeamItem[]) => {
    syncingRef.current = true;
    setLocalPick1Order(newState);
    setHasUnsavedChanges(true);
    setTimeout(() => { syncingRef.current = false; }, 0);
  }, []);

  const handlePick2Change = useCallback((newState: SortableTeamItem[]) => {
    syncingRef.current = true;
    setLocalPick2Order(newState);
    setHasUnsavedChanges(true);
    setTimeout(() => { syncingRef.current = false; }, 0);
  }, []);

  const handleUnlistedChange = useCallback((newState: SortableTeamItem[]) => {
    syncingRef.current = true;
    setLocalUnlisted(newState);
    setHasUnsavedChanges(true);
    setTimeout(() => { syncingRef.current = false; }, 0);
  }, []);

  // ── Team card renderer ──
  const renderTeamCard = (
    teamNumber: number,
    rank: number | null,
  ) => {
    const isExpanded = expandedTeams.has(teamNumber);
    const qualRank = qualRankings.get(teamNumber);
    const epa = epaData.get(teamNumber);

    return (
      <div key={teamNumber} data-id={String(teamNumber)}>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleTeamExpanded(teamNumber)}
        >
          <div className="border rounded-lg transition-all">
            <div className="flex items-center gap-2 p-3 w-full">
              <div className="sortable-handle cursor-grab active:cursor-grabbing hover:bg-accent rounded p-1 flex-shrink-0">
                <GripVertical className="h-4 w-4" />
              </div>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 flex-grow min-w-0 cursor-pointer">
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    : <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  }
                  {rank !== null && (
                    <div className="flex-shrink-0 font-bold text-lg w-8">#{rank}</div>
                  )}
                  <div className="flex-grow font-semibold text-lg text-left">{teamNumber}</div>
                </button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {epa && (
                  <div
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      color: getEpaColor(epa.totalEPA),
                      backgroundColor: getEpaBgColor(epa.totalEPA),
                    }}
                    title={`Auto: ${epa.autoEPA.toFixed(1)} | Teleop: ${epa.teleopEPA.toFixed(1)} | Endgame: ${epa.endgameEPA.toFixed(1)}`}
                  >
                    EPA {epa.totalEPA.toFixed(1)}
                  </div>
                )}
                {qualRank !== undefined && (
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    Q{qualRank}
                  </Badge>
                )}
              </div>
            </div>

            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-3 border-t pt-3 bg-background">
                {epa && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border p-2">
                      <div className="text-xs text-muted-foreground">Auto</div>
                      <div className="text-sm font-bold" style={{ color: getEpaColor(epa.autoEPA) }}>
                        {epa.autoEPA.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-xs text-muted-foreground">Teleop</div>
                      <div className="text-sm font-bold" style={{ color: getEpaColor(epa.teleopEPA) }}>
                        {epa.teleopEPA.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="text-xs text-muted-foreground">Endgame</div>
                      <div className="text-sm font-bold" style={{ color: getEpaColor(epa.endgameEPA) }}>
                        {epa.endgameEPA.toFixed(1)}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium mb-1">Notes:</div>
                  <Textarea
                    value={teamNotes[teamNumber] || ''}
                    onChange={(e) => handleNoteChange(teamNumber, e.target.value)}
                    placeholder="Add notes about this team..."
                    className="min-h-20"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Auto-saves after you stop typing
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    );
  };

  // ── Loading state ──
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

  const sortableGroupOptions = {
    name: 'picklist',
    pull: true as const,
    put: true as const,
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {competitionType === 'FRC' ? 'FRC' : 'FTC'} Picklist - {eventCode}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalPicklistTeams + localUnlisted.length} / {totalEventTeams} teams (excluding #{ownTeamNumber})
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
              <Button variant="destructive" onClick={() => setShowResetDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Picklist
              </Button>
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
            <CardContent className="min-h-96 space-y-2 p-4">
              <ReactSortable
                list={localPick1Order}
                setList={handlePick1Change}
                group={sortableGroupOptions}
                animation={200}
                handle=".sortable-handle"
                filter="textarea,button,input"
                preventOnFilter={false}
                ghostClass="opacity-30"
                dragClass="shadow-lg"
                className="space-y-2 min-h-48"
              >
                {localPick1Order.map((item, idx) => renderTeamCard(item.teamNumber, idx + 1))}
              </ReactSortable>
              {localPick1Order.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Drag teams here</div>
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
              <CardContent className="min-h-96 space-y-2 p-4">
                <ReactSortable
                  list={localPick2Order}
                  setList={handlePick2Change}
                  group={sortableGroupOptions}
                  animation={200}
                  handle=".sortable-handle"
                  filter="textarea,button,input"
                  preventOnFilter={false}
                  ghostClass="opacity-30"
                  dragClass="shadow-lg"
                  className="space-y-2 min-h-48"
                >
                  {localPick2Order.map((item, idx) => renderTeamCard(item.teamNumber, idx + 1))}
                </ReactSortable>
                {localPick2Order.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">Drag teams here</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unlisted Teams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unlisted</CardTitle>
                <Badge variant="outline">{localUnlisted.length} teams</Badge>
              </div>
            </CardHeader>
            <CardContent className="min-h-96 space-y-2 p-4">
              <ReactSortable
                list={localUnlisted}
                setList={handleUnlistedChange}
                group={sortableGroupOptions}
                animation={200}
                handle=".sortable-handle"
                filter="textarea,button,input"
                preventOnFilter={false}
                ghostClass="opacity-30"
                dragClass="shadow-lg"
                sort={false}
                className="space-y-2 min-h-48"
              >
                {localUnlisted.map((item) => renderTeamCard(item.teamNumber, null))}
              </ReactSortable>
              {localUnlisted.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">All teams assigned</div>
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
      
      <DeleteConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={confirmReset}
        title="Reset Picklist"
        description="Are you sure you want to reset the picklist? This will delete all current picks and start fresh."
        confirmButtonText="Reset"
        loadingText="Resetting..."
      />
    </div>
  );
}
