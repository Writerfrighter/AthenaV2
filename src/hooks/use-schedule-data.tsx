'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';

type ScheduleBlock = {
  id: number;
  eventCode: string;
  year: number;
  blockNumber: number;
  startMatch: number;
  endMatch: number;
  created_at?: Date;
  updated_at?: Date;
  redScouts: Array<string | null>;
  blueScouts: Array<string | null>;
};

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
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
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

        const usersWithPartners: UserWithPartners[] = usersData.users.map(
          (user: User & { preferredPartners?: string[] }) => ({
            ...user,
            preferredPartners: user.preferredPartners || [],
          })
        );
        setUsers(usersWithPartners);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  // Fetch match count from API (unchanged behavior)
  useEffect(() => {
    const fetchMatchCount = async () => {
      if (!selectedEvent) {
        setApiMatchCount(0);
        setIsApiMatchCountAvailable(false);
        return;
      }

      try {
        const matchesResponse = await fetch(
          `/api/event/matches?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`
        );

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

  // Fetch virtual blocks for event
  useEffect(() => {
    const hydrateBlocks = async () => {
      if (!selectedEvent || matchCount <= 0 || blockSize <= 0) {
        setBlocks([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const scoutsPerAlliance = competitionType === 'FTC' ? 2 : 3;

        // Compute virtual shifts locally (no /api/schedule/blocks API).
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
              created_at: undefined,
              updated_at: undefined,
              redScouts: Array(scoutsPerAlliance).fill(null),
              blueScouts: Array(scoutsPerAlliance).fill(null),
            };
          }
        );

        // Hydrate from matchAssignments by collapsing match-level assignments to shift-level,
        // only when consistent across the whole shift range.
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
        console.error('Error hydrating schedule:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setBlocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateBlocks();
  }, [selectedEvent, currentYear, competitionType, matchCount, blockSize, refreshTrigger]);

  // Generate blocks based on match count and block size
  // Blocks are virtual now; this just triggers a refresh.
  const generateBlocks = useCallback(async () => {
    if (!selectedEvent || matchCount <= 0 || blockSize <= 0) return;
    setRefreshTrigger(prev => prev + 1);
  }, [selectedEvent, matchCount, blockSize]);

  // Sync match count from API
  const syncMatchCountFromApi = useCallback(async () => {
    if (!selectedEvent) return { success: false, count: 0 };

    try {
      const matchesResponse = await fetch(
        `/api/event/matches?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`
      );

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

  // Assign scout to a virtual block position (range write)
  const assignScout = useCallback(
    async (blockId: number, userId: string | null, alliance: 'red' | 'blue', position: number) => {
      if (!selectedEvent) return;

      const block = blocks.find(b => b.id === blockId);
      if (!block) return;

      const response = await fetch('/api/schedule/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventCode: selectedEvent.code,
          year: currentYear,
          startMatch: block.startMatch,
          endMatch: block.endMatch,
          alliance,
          position,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }
    },
    [selectedEvent, currentYear, blocks]
  );

  // Clear all assignments for the event
  const clearAllAssignments = useCallback(async () => {
    if (!selectedEvent) return;

    const response = await fetch(`/api/schedule/assignments?eventCode=${selectedEvent.code}&year=${currentYear}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear assignments');
    }

    setRefreshTrigger(prev => prev + 1);
  }, [selectedEvent, currentYear]);

  // Delete all blocks (virtual) => clear all schedule data
  const deleteAllBlocks = useCallback(async () => {
    // Clearing schedule == clearing all matchAssignments for this event
    await clearAllAssignments();
  }, [clearAllAssignments]);

  // Add/delete single block are no longer supported; keep them as helpers that refresh.
  const addBlock = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const deleteBlock = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1);
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
