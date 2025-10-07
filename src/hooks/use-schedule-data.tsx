'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import type { ScoutingBlockWithAssignments, BlockAssignment } from '@/lib/shared-types';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserWithPartners extends User {
  preferredPartners: string[];
}

export function useScheduleData() {
  const selectedEvent = useSelectedEvent();
  const { currentYear } = useGameConfig();
  const [matchCount, setMatchCount] = useState<number>(0);
  const [users, setUsers] = useState<UserWithPartners[]>([]);
  const [blocks, setBlocks] = useState<ScoutingBlockWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        
        // Map users with empty preferred partners for now
        // The preferredPartners field is stored as JSON in the users table
        // but we'll need to parse it or fetch from individual endpoints
        const usersWithPartners: UserWithPartners[] = usersData.users.map((user: User) => ({
          ...user,
          preferredPartners: [] as string[] // TODO: Parse from user record if available
        }));
        setUsers(usersWithPartners);

        // Fetch blocks with assignments (only if event is selected)
        if (selectedEvent) {
          const blocksResponse = await fetch(
            `/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}`
          );
          if (blocksResponse.ok) {
            const blocksData = await blocksResponse.json();
            setBlocks(blocksData);
          } else {
            setBlocks([]);
          }
        } else {
          setBlocks([]);
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedEvent, currentYear, refreshTrigger]);

  // Fetch match count from TBA or custom events
  useEffect(() => {
    const fetchMatchCount = async () => {
      if (!selectedEvent) {
        setMatchCount(0);
        return;
      }

      try {
        // Try TBA API first
        const tbaResponse = await fetch(`/api/tba/qualification-matches?eventCode=${selectedEvent.code}`);
        
        if (tbaResponse.ok) {
          const tbaData = await tbaResponse.json();
          setMatchCount(tbaData.qualMatchesCount || 0);
        } else {
          // Fall back to custom events
          const customResponse = await fetch(`/api/database/custom-events?year=${currentYear}`);
          if (customResponse.ok) {
            const customEvents = await customResponse.json();
            const customEvent = customEvents.find((e: { eventCode: string }) => e.eventCode === selectedEvent.code);
            setMatchCount(customEvent?.matchCount || 0);
          } else {
            console.error('Failed to fetch match count from both TBA and custom events');
            setMatchCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching match count:', error);
        // Fall back to custom events on error
        try {
          const customResponse = await fetch(`/api/database/custom-events?year=${currentYear}`);
          if (customResponse.ok) {
            const customEvents = await customResponse.json();
            const customEvent = customEvents.find((e: { eventCode: string }) => e.eventCode === selectedEvent.code);
            setMatchCount(customEvent?.matchCount || 0);
          } else {
            setMatchCount(0);
          }
        } catch (customError) {
          console.error('Both TBA and custom event fallback failed:', customError);
          setMatchCount(0);
        }
      }
    };

    fetchMatchCount();
  }, [selectedEvent, currentYear]);

  // Create scouting blocks
  const createBlocks = useCallback(async (blockSize: number, totalMatches: number) => {
    if (!selectedEvent) return;

    try {
      // First, delete existing blocks for this event
      await fetch(`/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}`, {
        method: 'DELETE',
      });

      // Calculate number of blocks needed
      const numBlocks = Math.ceil(totalMatches / blockSize);
      
      // Create new blocks
      const blockPromises = [];
      for (let i = 0; i < numBlocks; i++) {
        const startMatch = i * blockSize + 1;
        const endMatch = Math.min((i + 1) * blockSize, totalMatches);
        
        blockPromises.push(
          fetch('/api/schedule/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventCode: selectedEvent.code,
              year: currentYear,
              blockNumber: i + 1,
              startMatch,
              endMatch
            })
          })
        );
      }

      await Promise.all(blockPromises);
      
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating blocks:', error);
      throw error;
    }
  }, [selectedEvent, currentYear]);

  // Assign scout to block position
  const assignScout = useCallback(async (
    blockId: number,
    userId: string | null,
    alliance: 'red' | 'blue',
    position: number
  ) => {
    try {
      if (userId === null) {
        // Find and delete the assignment
        const assignments = blocks?.find((b: ScoutingBlockWithAssignments) => b.id === blockId);
        if (!assignments) return;

        const scoutsArray = alliance === 'red' ? assignments.redScouts : assignments.blueScouts;
        const currentUserId = scoutsArray[position];
        
        if (currentUserId) {
          // We need the assignment ID to delete - this requires getting all assignments for the block
          const assignmentsResponse = await fetch(`/api/schedule/assignments?blockId=${blockId}`);
          if (assignmentsResponse.ok) {
            const allAssignments: BlockAssignment[] = await assignmentsResponse.json();
            const assignmentToDelete = allAssignments.find(
              a => a.userId === currentUserId && a.alliance === alliance && a.position === position
            );
            
            if (assignmentToDelete?.id) {
              await fetch(`/api/schedule/assignments/${assignmentToDelete.id}`, {
                method: 'DELETE',
              });
            }
          }
        }
      } else {
        // Create new assignment
        await fetch('/api/schedule/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockId,
            userId,
            alliance,
            position
          })
        });
      }

      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error assigning scout:', error);
      throw error;
    }
  }, [blocks]);

  // Clear all assignments for the event
  const clearAllAssignments = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      const currentBlocks = blocks || [];
      
      // Delete assignments for each block
      await Promise.all(
        currentBlocks.map((block: ScoutingBlockWithAssignments) => 
          fetch(`/api/schedule/assignments?blockId=${block.id}`, {
            method: 'DELETE',
          })
        )
      );

      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing assignments:', error);
      throw error;
    }
  }, [selectedEvent, blocks]);

  // Update user's preferred partners
  const updatePreferredPartners = useCallback(async (partnerIds: string[]) => {
    try {
      await fetch('/api/users/me/preferred-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredPartners: partnerIds })
      });

      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating preferred partners:', error);
      throw error;
    }
  }, []);

  return {
    users,
    blocks,
    matchCount,
    isLoading,
    error,
    hasEvent: !!selectedEvent,
    createBlocks,
    assignScout,
    clearAllAssignments,
    updatePreferredPartners,
  };
}
