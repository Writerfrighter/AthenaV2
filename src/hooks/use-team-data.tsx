'use client';

import { useState, useEffect } from 'react';
import { useSelectedEvent } from './use-event-config';
import { useGameConfig } from './use-game-config';
import { teamApi } from '@/lib/api/database-client';
import { indexedDBService } from '@/lib/indexeddb-service';
import type { TeamData } from '@/lib/shared-types';

export function useTeamData(teamNumber: string) {
  const selectedEvent = useSelectedEvent();
  const { currentYear, competitionType } = useGameConfig();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true);
        setError(null);
        setIsOfflineData(false);

        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const eventCode = selectedEvent?.code;

        // If offline, reconstruct from cached pit/match entries
        if (!isOnline && eventCode) {
          const offlineData = await buildTeamDataFromCache(teamNumber, eventCode);
          if (offlineData) {
            setTeamData(offlineData);
            setIsOfflineData(true);
            return;
          }
          setError('Offline — no cached data available for this team');
          return;
        }

        // Fetch team data from API
        const data = await teamApi.getTeamData(
          parseInt(teamNumber), 
          currentYear, 
          eventCode,
          competitionType
        );

        setTeamData(data);
      } catch (err) {
        console.error('Error fetching team data:', err);

        // Fallback to IndexedDB cache on network error
        const eventCode = selectedEvent?.code;
        if (eventCode) {
          try {
            const offlineData = await buildTeamDataFromCache(teamNumber, eventCode);
            if (offlineData) {
              setTeamData(offlineData);
              setIsOfflineData(true);
              return;
            }
          } catch (cacheErr) {
            console.warn('Failed to read cached team data:', cacheErr);
          }
        }

        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    }

    if (teamNumber && currentYear) {
      fetchTeamData();
    } else {
      setLoading(false);
    }
  }, [teamNumber, currentYear, selectedEvent?.code, competitionType]);

  return { teamData, loading, error, isOfflineData };
}

/** Reconstruct a partial TeamData from cached pit/match entries */
async function buildTeamDataFromCache(
  teamNumber: string,
  eventCode: string
): Promise<TeamData | null> {
  const teamNum = parseInt(teamNumber);

  const [cachedMatch, cachedPit] = await Promise.all([
    indexedDBService.getCachedMatchEntries(eventCode),
    indexedDBService.getCachedPitEntries(eventCode),
  ]);

  const matchEntries = cachedMatch?.entries.filter(e => e.teamNumber === teamNum) ?? [];
  const pitEntry = cachedPit?.entries.find(e => e.teamNumber === teamNum) ?? null;

  // Only return data if we have something useful
  if (matchEntries.length === 0 && !pitEntry) return null;

  return {
    teamNumber: teamNum,
    eventCode,
    matchEntries,
    pitEntry,
    // Server-computed fields are unavailable offline
    stats: null,
    epa: null,
    matchCount: matchEntries.length,
  };
}
