'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';

const assignmentsCache = new Map<string, MatchAssignmentRow[]>();
const getAssignmentsCacheKey = (eventCode: string, year: number) => `${eventCode}-${year}`;

interface ScoutingAssignment {
  blockId: number;
  blockNumber: number;
  startMatch: number;
  endMatch: number;
  matchNumber: number;
  alliance: 'red' | 'blue';
  position: number; // 1-indexed (1, 2, 3)
}

type MatchAssignmentRow = {
  matchNumber: number;
  alliance: 'red' | 'blue';
  position: number;
  userId: string;
};

export function useScoutingAssignment() {
  const { data: session } = useSession();
  const selectedEvent = useSelectedEvent();
  const { currentYear, competitionType } = useGameConfig();
  
  const [rows, setRows] = useState<MatchAssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch per-match scouting assignments for the event
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedEvent?.code) {
        setRows([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = getAssignmentsCacheKey(selectedEvent.code, currentYear);
        const cachedRows = assignmentsCache.get(cacheKey);
        if (cachedRows) {
          setRows(cachedRows);
          setIsLoading(false);
        }

        const res = await fetch(
          `/api/database/match-assignments?eventCode=${selectedEvent.code}&year=${currentYear}`
        );

        if (!res.ok) {
          if (!cachedRows) setRows([]);
          return;
        }

        const data = (await res.json()) as MatchAssignmentRow[];
        assignmentsCache.set(cacheKey, data);
        setRows(data);
      } catch (err) {
        console.error('Error loading scouting schedule:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scouting schedule');
        if (!assignmentsCache.get(getAssignmentsCacheKey(selectedEvent.code, currentYear))) {
          setRows([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedEvent?.code, currentYear, competitionType]);

  // Find the current user's assignments across all matches
  const userAssignments = useMemo((): ScoutingAssignment[] => {
    if (!session?.user?.id || rows.length === 0) return [];

    const userId = session.user.id;
    const blockSize = competitionType === 'FTC' ? 3 : 5;

    const assignments = rows
      .filter(r => r.userId === userId)
      .map(r => {
        const blockNumber = Math.floor((r.matchNumber - 1) / blockSize) + 1;
        const startMatch = (blockNumber - 1) * blockSize + 1;
        const endMatch = startMatch + blockSize - 1;

        return {
          blockId: blockNumber,
          blockNumber,
          startMatch,
          endMatch,
          matchNumber: r.matchNumber,
          alliance: r.alliance,
          position: r.position + 1,
        };
      });

    return assignments.sort((a, b) => a.matchNumber - b.matchNumber);
  }, [session?.user?.id, rows, competitionType]);

  // Get the first assignment (for initial form setup)
  const firstAssignment = useMemo((): ScoutingAssignment | null => {
    return userAssignments.length > 0 ? userAssignments[0] : null;
  }, [userAssignments]);

  // Get assignment for a specific match number
  const getAssignmentForMatch = (matchNumber: number): ScoutingAssignment | null => {
    return userAssignments.find(a => a.matchNumber === matchNumber) || null;
  };

  /**
   * Get the recommended next assignment based on the last submitted match.
   * Finds the assignment block that covers `lastSubmittedMatch + 1`.
   * If no block covers it, falls back to the next block whose start is > lastSubmittedMatch,
   * then falls back to the first assignment.
   */
  const getNextAssignment = (lastSubmittedMatch: number): ScoutingAssignment | null => {
    if (userAssignments.length === 0) return null;

    const upcoming = userAssignments.find(a => a.matchNumber > lastSubmittedMatch);
    if (upcoming) return upcoming;

    return firstAssignment;
  };

  // Check if user has any scouting assignments
  const hasAssignments = userAssignments.length > 0;

  // Get recommended starting match number (first assigned match)
  const recommendedStartMatch = firstAssignment?.matchNumber || null;

  // Get recommended alliance and position
  const recommendedAlliance = firstAssignment?.alliance || null;
  const recommendedPosition = firstAssignment?.position || null;

  return {
    blocks: [],
    userAssignments,
    firstAssignment,
    isLoading,
    error,
    hasAssignments,
    recommendedStartMatch,
    recommendedAlliance,
    recommendedPosition,
    getAssignmentForMatch,
    getNextAssignment
  };
}
