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
  const { currentYear, competitionType } = useGameConfig();
  
  // Core state
  const [users, setUsers] = useState<UserWithPartners[]>([]);
  const [blocks, setBlocks] = useState<ScoutingBlockWithAssignments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Configuration state
  const [blockSize, setBlockSize] = useState<number>(5);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [apiMatchCount, setApiMatchCount] = useState<number>(0);
  const [isApiMatchCountAvailable, setIsApiMatchCountAvailable] = useState(false);

  // Reset event-specific state when event changes
  useEffect(() => {
    setBlocks([]);
    setMatchCount(0);
    setApiMatchCount(0);
    setIsApiMatchCountAvailable(false);
  }, [selectedEvent?.code, currentYear]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        
        const usersWithPartners: UserWithPartners[] = usersData.users.map((user: User & { preferredPartners?: string[] }) => ({
          ...user,
          preferredPartners: user.preferredPartners || []
        }));
        setUsers(usersWithPartners);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  // Fetch blocks for event
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedEvent) {
        setBlocks([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const blocksResponse = await fetch(
          `/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}&competitionType=${competitionType}`
        );
        if (blocksResponse.ok) {
          const blocksData = await blocksResponse.json();
          setBlocks(blocksData);
          
          // Extract block size from existing blocks if any
          if (blocksData.length > 0) {
            const firstBlock = blocksData[0];
            const size = firstBlock.endMatch - firstBlock.startMatch + 1;
            if (size > 0) {
              setBlockSize(size);
            }
          }
        } else {
          setBlocks([]);
        }
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedEvent, currentYear, competitionType, refreshTrigger]);

  // Fetch match count from API
  useEffect(() => {
    const fetchMatchCount = async () => {
      if (!selectedEvent) {
        setApiMatchCount(0);
        setIsApiMatchCountAvailable(false);
        return;
      }

      try {
        const matchesResponse = await fetch(`/api/event/matches?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`);
        
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          const count = matchesData.qualMatchesCount || matchesData.totalMatches || 0;
          setApiMatchCount(count);
          setIsApiMatchCountAvailable(count > 0);
          
          // Auto-set match count if not already set and API has data
          if (count > 0 && matchCount === 0) {
            setMatchCount(count);
          }
        } else {
          // Try custom events fallback
          const customResponse = await fetch(`/api/database/custom-events?year=${currentYear}`);
          if (customResponse.ok) {
            const customEvents = await customResponse.json();
            const customEvent = customEvents.find((e: { eventCode: string }) => e.eventCode === selectedEvent.code);
            const count = customEvent?.matchCount || 0;
            setApiMatchCount(count);
            setIsApiMatchCountAvailable(count > 0);
            if (count > 0 && matchCount === 0) {
              setMatchCount(count);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching match count:', error);
        setIsApiMatchCountAvailable(false);
      }
    };

    fetchMatchCount();
  }, [selectedEvent, currentYear, competitionType, matchCount]);

  // Generate blocks based on match count and block size
  const generateBlocks = useCallback(async () => {
    if (!selectedEvent || matchCount <= 0 || blockSize <= 0) return;

    try {
      // Delete existing blocks first
      await fetch(`/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}`, {
        method: 'DELETE',
      });

      // Calculate number of blocks
      const numBlocks = Math.ceil(matchCount / blockSize);
      
      // Create blocks with proper match ranges
      const blockPromises = [];
      let currentMatch = 1;
      
      for (let i = 0; i < numBlocks; i++) {
        const startMatch = currentMatch;
        const endMatch = Math.min(currentMatch + blockSize - 1, matchCount);
        
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
        
        currentMatch = endMatch + 1;
      }

      await Promise.all(blockPromises);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error generating blocks:', error);
      throw error;
    }
  }, [selectedEvent, currentYear, matchCount, blockSize]);

  // Sync match count from API
  const syncMatchCountFromApi = useCallback(async () => {
    if (!selectedEvent) return { success: false, count: 0 };

    try {
      const matchesResponse = await fetch(`/api/event/matches?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`);
      
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const count = matchesData.qualMatchesCount || matchesData.totalMatches || 0;
        if (count > 0) {
          setApiMatchCount(count);
          setIsApiMatchCountAvailable(true);
          setMatchCount(count);
          return { success: true, count };
        }
      }
      return { success: false, count: 0 };
    } catch (error) {
      console.error('Error syncing match count from API:', error);
      return { success: false, count: 0 };
    }
  }, [selectedEvent, competitionType, currentYear]);

  // Set manual match count
  const setManualMatchCount = useCallback((count: number) => {
    setMatchCount(count);
  }, []);

  // Assign scout to block position
  const assignScout = useCallback(async (
    blockId: number,
    userId: string | null,
    alliance: 'red' | 'blue',
    position: number
  ) => {
    try {
      if (userId === null) {
        const blockToUpdate = blocks?.find((b: ScoutingBlockWithAssignments) => b.id === blockId);
        if (!blockToUpdate) return;

        const scoutsArray = alliance === 'red' ? blockToUpdate.redScouts : blockToUpdate.blueScouts;
        const currentUserId = scoutsArray[position];
        
        if (currentUserId) {
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
        const response = await fetch('/api/schedule/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockId,
            userId,
            alliance,
            position
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create assignment');
        }
      }
    } catch (error) {
      console.error('Error assigning scout:', error);
      throw error;
    }
  }, [blocks]);

  // Clear all assignments for the event
  const clearAllAssignments = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      await Promise.all(
        blocks.map((block: ScoutingBlockWithAssignments) => 
          fetch(`/api/schedule/assignments?blockId=${block.id}`, {
            method: 'DELETE',
          })
        )
      );

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing assignments:', error);
      throw error;
    }
  }, [selectedEvent, blocks]);

  // Delete all blocks
  const deleteAllBlocks = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      await fetch(`/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}`, {
        method: 'DELETE',
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting blocks:', error);
      throw error;
    }
  }, [selectedEvent, currentYear]);

  // Add a single block at the end
  const addBlock = useCallback(async () => {
    if (!selectedEvent || blocks.length === 0) return;

    try {
      const lastBlock = [...blocks].sort((a, b) => b.blockNumber - a.blockNumber)[0];
      const nextBlockNumber = lastBlock.blockNumber + 1;
      const startMatch = lastBlock.endMatch + 1;
      const endMatch = startMatch + blockSize - 1;

      const response = await fetch('/api/schedule/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventCode: selectedEvent.code,
          year: currentYear,
          blockNumber: nextBlockNumber,
          startMatch,
          endMatch
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create block');
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding block:', error);
      throw error;
    }
  }, [selectedEvent, currentYear, blocks, blockSize]);

  // Delete a single block
  const deleteBlock = useCallback(async (blockId: number) => {
    try {
      const response = await fetch(`/api/schedule/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete block');
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting block:', error);
      throw error;
    }
  }, []);

  // Refresh data manually
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    // Data
    users,
    blocks,
    
    // Configuration
    blockSize,
    setBlockSize,
    matchCount,
    setManualMatchCount,
    apiMatchCount,
    isApiMatchCountAvailable,
    competitionType,
    
    // State
    isLoading,
    error,
    hasEvent: !!selectedEvent,
    
    // Actions
    generateBlocks,
    syncMatchCountFromApi,
    assignScout,
    clearAllAssignments,
    deleteAllBlocks,
    addBlock,
    deleteBlock,
    refreshData,
  };
}
