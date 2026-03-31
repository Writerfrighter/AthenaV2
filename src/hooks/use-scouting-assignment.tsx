'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';

type ScheduleBlock = {
  id: number;
  eventCode: string;
  year: number;
  blockNumber: number;
  startMatch: number;
  endMatch: number;
  redScouts: Array<string | null>;
  blueScouts: Array<string | null>;
};

interface ScoutingAssignment {
  blockId: number;
  blockNumber: number;
  startMatch: number;
  endMatch: number;
  alliance: 'red' | 'blue';
  position: number; // 1-indexed (1, 2, 3)
}

export function useScoutingAssignment() {
  const { data: session } = useSession();
  const selectedEvent = useSelectedEvent();
  const { currentYear, competitionType } = useGameConfig();
  
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scouting schedule for the event
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedEvent?.code) {
        setBlocks([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Default shift size if user hasn't configured it here.
        const blockSize = competitionType === 'FTC' ? 3 : 5;

        // Get matchCount (prefer API, fallback to custom-events)
        let matchCount = 0;
        const matchesResponse = await fetch(
          `/api/event/matches?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          matchCount = matchesData.qualMatchesCount || matchesData.totalMatches || 0;
        }

        if (!matchCount) {
          const customResponse = await fetch(`/api/database/custom-events?year=${currentYear}`);
          if (customResponse.ok) {
            const customEvents = await customResponse.json();
            const customEvent = customEvents.find((e: { eventCode: string }) => e.eventCode === selectedEvent.code);
            matchCount = customEvent?.matchCount || 0;
          }
        }

        if (!matchCount) {
          setBlocks([]);
          return;
        }

        const scoutsPerAlliance = competitionType === 'FTC' ? 2 : 3;

        const computedBlocks: ScheduleBlock[] = Array.from(
          { length: Math.ceil(matchCount / blockSize) },
          (_, i) => {
            const startMatch = i * blockSize + 1;
            const endMatch = Math.min(startMatch + blockSize - 1, matchCount);
            return {
              id: i + 1,
              eventCode: selectedEvent.code,
              year: currentYear,
              blockNumber: i + 1,
              startMatch,
              endMatch,
              redScouts: Array(scoutsPerAlliance).fill(null),
              blueScouts: Array(scoutsPerAlliance).fill(null),
            };
          }
        );

        const res = await fetch(
          `/api/database/match-assignments?eventCode=${selectedEvent.code}&year=${currentYear}`
        );

        if (!res.ok) {
          setBlocks(computedBlocks);
          return;
        }

        const rows = (await res.json()) as Array<{
          matchNumber: number;
          alliance: 'red' | 'blue';
          position: number;
          userId: string;
        }>;

        const byMatch = new Map<number, Map<'red' | 'blue', Map<number, string>>>();
        for (const r of rows) {
          let byAlliance = byMatch.get(r.matchNumber);
          if (!byAlliance) {
            byAlliance = new Map();
            byMatch.set(r.matchNumber, byAlliance);
          }
          let byPos = byAlliance.get(r.alliance);
          if (!byPos) {
            byPos = new Map();
            byAlliance.set(r.alliance, byPos);
          }
          byPos.set(r.position, r.userId);
        }

        const hydrated = computedBlocks.map(block => {
          const getConsistent = (alliance: 'red' | 'blue', position: number): string | null => {
            let value: string | null = null;
            for (let matchNumber = block.startMatch; matchNumber <= block.endMatch; matchNumber++) {
              const v = byMatch.get(matchNumber)?.get(alliance)?.get(position) ?? null;
              if (matchNumber === block.startMatch) value = v;
              else if (value !== v) return null;
            }
            return value;
          };

          const redScouts = [...block.redScouts];
          const blueScouts = [...block.blueScouts];
          for (let pos = 0; pos < scoutsPerAlliance; pos++) {
            redScouts[pos] = getConsistent('red', pos);
            blueScouts[pos] = getConsistent('blue', pos);
          }

          return { ...block, redScouts, blueScouts };
        });

        setBlocks(hydrated);
      } catch (err) {
        console.error('Error loading scouting schedule:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scouting schedule');
        setBlocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedEvent?.code, currentYear, competitionType]);

  // Find the current user's assignments across all blocks
  const userAssignments = useMemo((): ScoutingAssignment[] => {
    if (!session?.user?.id || blocks.length === 0) return [];

    const assignments: ScoutingAssignment[] = [];
    const userId = session.user.id;

    for (const block of blocks) {
      // Check red alliance positions
      block.redScouts.forEach((scoutId: string | null, index: number) => {
        if (scoutId === userId) {
          assignments.push({
            blockId: block.id,
            blockNumber: block.blockNumber,
            startMatch: block.startMatch,
            endMatch: block.endMatch,
            alliance: 'red',
            position: index + 1 // Convert to 1-indexed
          });
        }
      });

      // Check blue alliance positions
      block.blueScouts.forEach((scoutId: string | null, index: number) => {
        if (scoutId === userId) {
          assignments.push({
            blockId: block.id,
            blockNumber: block.blockNumber,
            startMatch: block.startMatch,
            endMatch: block.endMatch,
            alliance: 'blue',
            position: index + 1 // Convert to 1-indexed
          });
        }
      });
    }

    // Sort by block number
    return assignments.sort((a, b) => a.blockNumber - b.blockNumber);
  }, [session?.user?.id, blocks]);

  // Get the first assignment (for initial form setup)
  const firstAssignment = useMemo((): ScoutingAssignment | null => {
    return userAssignments.length > 0 ? userAssignments[0] : null;
  }, [userAssignments]);

  // Get the current block based on a match number
  const getAssignmentForMatch = (matchNumber: number): ScoutingAssignment | null => {
    return userAssignments.find(
      a => matchNumber >= a.startMatch && matchNumber <= a.endMatch
    ) || null;
  };

  /**
   * Get the recommended next assignment based on the last submitted match.
   * Finds the assignment block that covers `lastSubmittedMatch + 1`.
   * If no block covers it, falls back to the next block whose start is > lastSubmittedMatch,
   * then falls back to the first assignment.
   */
  const getNextAssignment = (lastSubmittedMatch: number): ScoutingAssignment | null => {
    if (userAssignments.length === 0) return null;
    const nextMatch = lastSubmittedMatch + 1;

    // 1. Exact block that covers the next match
    const covering = userAssignments.find(
      a => nextMatch >= a.startMatch && nextMatch <= a.endMatch
    );
    if (covering) return covering;

    // 2. Next block that starts after the submitted match
    const upcoming = userAssignments.find(a => a.startMatch > lastSubmittedMatch);
    if (upcoming) return upcoming;

    // 3. Fall back to the very first assignment
    return firstAssignment;
  };

  // Check if user has any scouting assignments
  const hasAssignments = userAssignments.length > 0;

  // Get recommended starting match number (first match of first assignment)
  const recommendedStartMatch = firstAssignment?.startMatch || null;

  // Get recommended alliance and position
  const recommendedAlliance = firstAssignment?.alliance || null;
  const recommendedPosition = firstAssignment?.position || null;

  return {
    blocks,
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
