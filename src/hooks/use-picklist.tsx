'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Picklist, PicklistEntry, PicklistNote, CompetitionType } from '@/lib/shared-types';

interface UsePicklistOptions {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
  picklistType?: 'pick1' | 'pick2' | 'main';
}

interface TeamPicklistData {
  teamNumber: number;
  driveTrain: string;
  weight?: number;
  length?: number;
  width?: number;
  matchesPlayed: number;
  totalEPA: number;
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
  rank: number;
}

export function usePicklist(options: UsePicklistOptions) {
  const [picklist, setPicklist] = useState<Picklist | null>(null);
  const [entries, setEntries] = useState<PicklistEntry[]>([]);
  const [notes, setNotes] = useState<Map<number, PicklistNote[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialRanking, setInitialRanking] = useState<TeamPicklistData[]>([]);

  // Fetch initial rankings from TBA/calculated EPA data
  const fetchInitialRanking = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        eventCode: options.eventCode,
        year: options.year.toString(),
        competitionType: options.competitionType
      });

      const response = await fetch(`/api/database/picklist?${params}`);
      if (!response.ok) throw new Error('Failed to fetch initial ranking');

      const data = await response.json();
      setInitialRanking(data.teams);
    } catch (error) {
      console.error('Error fetching initial ranking:', error);
      toast.error('Failed to load ranking data');
    } finally {
      setIsLoading(false);
    }
  }, [options.eventCode, options.year, options.competitionType]);

  // Fetch existing picklist if available
  const fetchExistingPicklist = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        eventCode: options.eventCode,
        year: options.year.toString(),
        competitionType: options.competitionType,
        picklistType: options.picklistType || 'main'
      });

      // First get the picklist metadata
      const picklistResponse = await fetch(`/api/database/picklist?${params}`);
      if (!picklistResponse.ok) return;

      const picklistData = await picklistResponse.json();
      if (picklistData.picklist) {
        setPicklist(picklistData.picklist);

        // Then fetch entries
        const entriesParams = new URLSearchParams({
          picklistId: picklistData.picklist.id.toString()
        });
        const entriesResponse = await fetch(`/api/database/picklist/entries?${entriesParams}`);
        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          setEntries(entriesData.entries);
        }
      }
    } catch (error) {
      console.error('Error fetching existing picklist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.eventCode, options.year, options.competitionType, options.picklistType]);

  // Create a new picklist
  const createPicklist = useCallback(
    async (picklistEntries: Omit<PicklistEntry, 'id' | 'created_at' | 'updated_at'>[]) => {
      try {
        setIsSaving(true);
        const response = await fetch('/api/database/picklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventCode: options.eventCode,
            year: options.year,
            competitionType: options.competitionType,
            picklistType: options.picklistType || 'main',
            entries: picklistEntries
          })
        });

        if (!response.ok) throw new Error('Failed to create picklist');

        const data = await response.json();
        setPicklist({
          id: data.id,
          eventCode: options.eventCode,
          year: options.year,
          competitionType: options.competitionType,
          picklistType: options.picklistType || 'main'
        });
        setEntries(picklistEntries as PicklistEntry[]);
        toast.success('Picklist created successfully');
        return data.id;
      } catch (error) {
        console.error('Error creating picklist:', error);
        toast.error('Failed to create picklist');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [options.eventCode, options.year, options.competitionType, options.picklistType]
  );

  // Update picklist entry order
  const updatePicklistOrder = useCallback(
    async (newEntries: Array<{ teamNumber: number; rank: number }>) => {
      if (!picklist?.id) {
        toast.error('No picklist to update');
        return;
      }

      try {
        setIsSaving(true);
        const response = await fetch('/api/database/picklist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            picklistId: picklist.id,
            entries: newEntries
          })
        });

        if (!response.ok) throw new Error('Failed to update picklist order');

        // Completely rebuild entries from newEntries
        const updatedEntries: PicklistEntry[] = newEntries.map(newEntry => {
          const existingEntry = entries.find(e => e.teamNumber === newEntry.teamNumber);
          return {
            id: existingEntry?.id,
            picklistId: picklist.id,
            teamNumber: newEntry.teamNumber,
            rank: newEntry.rank,
            qualRanking: existingEntry?.qualRanking,
            created_at: existingEntry?.created_at,
            updated_at: new Date()
          } as PicklistEntry;
        });
        
        setEntries(updatedEntries);
      } catch (error) {
        console.error('Error updating picklist order:', error);
        toast.error('Failed to update picklist order');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [picklist?.id, entries]
  );

  // Add a note for a team
  const addNote = useCallback(
    async (teamNumber: number, note: string) => {
      if (!picklist?.id) {
        toast.error('No picklist selected');
        return;
      }

      try {
        const response = await fetch('/api/database/picklist/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            picklistId: picklist.id,
            teamNumber,
            note
          })
        });

        if (!response.ok) throw new Error('Failed to add note');

        const data = await response.json();
        const teamNotes = notes.get(teamNumber) || [];
        teamNotes.push(data);
        setNotes(new Map(notes).set(teamNumber, teamNotes));
        toast.success('Note added');
      } catch (error) {
        console.error('Error adding note:', error);
        toast.error('Failed to add note');
        throw error;
      }
    },
    [picklist?.id, notes]
  );

  // Get notes for a team
  const getTeamNotes = useCallback(
    async (teamNumber: number) => {
      if (!picklist?.id) return [];

      try {
        const params = new URLSearchParams({
          picklistId: picklist.id.toString(),
          teamNumber: teamNumber.toString()
        });

        const response = await fetch(`/api/database/picklist/notes?${params}`);
        if (!response.ok) throw new Error('Failed to fetch notes');

        const data = await response.json();
        setNotes(new Map(notes).set(teamNumber, data.notes));
        return data.notes;
      } catch (error) {
        console.error('Error fetching team notes:', error);
        return [];
      }
    },
    [picklist?.id, notes]
  );

  // Update a note
  const updateNote = useCallback(
    async (noteId: number, teamNumber: number, newText: string) => {
      try {
        const response = await fetch('/api/database/picklist/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId,
            note: newText
          })
        });

        if (!response.ok) throw new Error('Failed to update note');

        const teamNotes = notes.get(teamNumber) || [];
        const updatedNotes = teamNotes.map(n => (n.id === noteId ? { ...n, note: newText } : n));
        setNotes(new Map(notes).set(teamNumber, updatedNotes));
        toast.success('Note updated');
      } catch (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
        throw error;
      }
    },
    [notes]
  );

  // Delete a note
  const deleteNote = useCallback(
    async (noteId: number, teamNumber: number) => {
      try {
        const response = await fetch(`/api/database/picklist/notes?noteId=${noteId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete note');

        const teamNotes = notes.get(teamNumber) || [];
        const updatedNotes = teamNotes.filter(n => n.id !== noteId);
        setNotes(new Map(notes).set(teamNumber, updatedNotes));
        toast.success('Note deleted');
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        throw error;
      }
    },
    [notes]
  );

  // Delete picklist
  const deletePicklist = useCallback(async () => {
    if (!picklist?.id) {
      toast.error('No picklist to delete');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/database/picklist?picklistId=${picklist.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete picklist');

      setPicklist(null);
      setEntries([]);
      setNotes(new Map());
      toast.success('Picklist deleted');
    } catch (error) {
      console.error('Error deleting picklist:', error);
      toast.error('Failed to delete picklist');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [picklist?.id]);

  // Initialize on mount
  useEffect(() => {
    fetchInitialRanking();
    fetchExistingPicklist();
  }, [fetchInitialRanking, fetchExistingPicklist]);

  return {
    // State
    picklist,
    entries,
    notes: (teamNumber: number) => notes.get(teamNumber) || [],
    isLoading,
    isSaving,
    initialRanking,

    // Actions
    createPicklist,
    updatePicklistOrder,
    addNote,
    getTeamNotes,
    updateNote,
    deleteNote,
    deletePicklist,
    fetchInitialRanking,
    fetchExistingPicklist
  };
}
