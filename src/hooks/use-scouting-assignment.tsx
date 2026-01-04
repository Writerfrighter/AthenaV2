'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import type { ScoutingBlockWithAssignments } from '@/lib/shared-types';

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
  
  const [blocks, setBlocks] = useState<ScoutingBlockWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scouting blocks for the event
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedEvent?.code) {
        setBlocks([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}&competitionType=${competitionType}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch scouting blocks');
        }

        const data: ScoutingBlockWithAssignments[] = await response.json();
        setBlocks(data);
      } catch (err) {
        console.error('Error fetching scouting blocks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scouting schedule');
        setBlocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedEvent?.code, currentYear, competitionType]);

  // Find the current user's assignments across all blocks
  const userAssignments = useMemo((): ScoutingAssignment[] => {
    if (!session?.user?.id || blocks.length === 0) return [];

    const assignments: ScoutingAssignment[] = [];
    const userId = session.user.id;

    for (const block of blocks) {
      // Check red alliance positions
      block.redScouts.forEach((scoutId, index) => {
        if (scoutId === userId) {
          assignments.push({
            blockId: block.id!,
            blockNumber: block.blockNumber,
            startMatch: block.startMatch,
            endMatch: block.endMatch,
            alliance: 'red',
            position: index + 1 // Convert to 1-indexed
          });
        }
      });

      // Check blue alliance positions
      block.blueScouts.forEach((scoutId, index) => {
        if (scoutId === userId) {
          assignments.push({
            blockId: block.id!,
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
    getAssignmentForMatch
  };
}
