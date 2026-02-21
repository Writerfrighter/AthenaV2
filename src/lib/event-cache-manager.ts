// Event Cache Manager
// Orchestrates downloading and caching all event data for full offline use

import { indexedDBService } from '@/lib/indexeddb-service';
import type { EventCacheStatus } from '@/lib/offline-types';
import type { PitEntry, MatchEntry } from '@/lib/shared-types';

export type CacheStepId =
  | 'session'
  | 'pages'
  | 'teams'
  | 'schedule'
  | 'scoutSchedule'
  | 'pitEntries'
  | 'matchEntries';

export interface CacheStep {
  id: CacheStepId;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error' | 'skipped';
  detail?: string;
  error?: string;
}

// Steps for scout-only mode (lightweight)
export const SCOUT_STEPS: CacheStepId[] = [
  'session',
  'pages',
  'teams',
  'schedule',
  'scoutSchedule',
];

// Additional steps for full event cache
export const FULL_CACHE_STEPS: CacheStepId[] = [
  ...SCOUT_STEPS,
  'pitEntries',
  'matchEntries',
];

function buildStepLabel(id: CacheStepId): string {
  switch (id) {
    case 'session': return 'Auth Session';
    case 'pages': return 'App Pages';
    case 'teams': return 'Event Teams';
    case 'schedule': return 'Match Schedule';
    case 'scoutSchedule': return 'Scouting Schedule';
    case 'pitEntries': return 'Pit Scouting Data';
    case 'matchEntries': return 'Match Scouting Data';
  }
}

export function buildSteps(stepIds: CacheStepId[]): CacheStep[] {
  return stepIds.map(id => ({
    id,
    label: buildStepLabel(id),
    status: 'pending',
  }));
}

interface CacheOptions {
  eventCode: string;
  eventName: string;
  competitionType: string;
  year: number;
  onStepUpdate: (stepId: CacheStepId, update: Partial<CacheStep>) => void;
}

async function fetchAndCache(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    cache: 'no-cache',
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response;
}

/** Cache auth session so offline reloads stay logged in */
async function cacheSession(opts: CacheOptions): Promise<void> {
  opts.onStepUpdate('session', { status: 'loading', detail: 'Caching auth session...' });
  try {
    const res = await fetchAndCache('/api/auth/session');
    await res.text(); // consume body so SW caches it
    opts.onStepUpdate('session', { status: 'success', detail: 'Session cached' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('session', { status: 'error', error: msg });
    throw err;
  }
}

/** Cache pages for offline navigation */
async function cachePages(opts: CacheOptions): Promise<void> {
  opts.onStepUpdate('pages', { status: 'loading', detail: 'Caching app pages...' });
  const pages = ['/dashboard', '/scout/matchscout', '/scout/pitscout', '/login'];
  let cached = 0;

  for (const page of pages) {
    try {
      const res = await fetchAndCache(page);
      await res.text();
      cached++;
    } catch {
      // Non-critical — continue with other pages
    }
  }

  if (cached === 0) {
    opts.onStepUpdate('pages', { status: 'error', error: 'No pages cached' });
    throw new Error('Failed to cache any pages');
  }

  opts.onStepUpdate('pages', {
    status: 'success',
    detail: `${cached}/${pages.length} pages cached`,
  });
}

/** Cache event teams and return count */
async function cacheTeams(opts: CacheOptions): Promise<number> {
  opts.onStepUpdate('teams', { status: 'loading', detail: 'Downloading team list...' });
  try {
    const url = `/api/events/${opts.eventCode}/teams?competitionType=${opts.competitionType}&year=${opts.year}`;
    const res = await fetchAndCache(url);
    const teams = await res.json();
    const teamCount = Array.isArray(teams) ? teams.length : 0;
    opts.onStepUpdate('teams', {
      status: 'success',
      detail: `${teamCount} teams cached`,
    });
    return teamCount;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('teams', { status: 'error', error: msg });
    throw err;
  }
}

/** Cache match schedule */
async function cacheSchedule(opts: CacheOptions): Promise<void> {
  opts.onStepUpdate('schedule', { status: 'loading', detail: 'Downloading match schedule...' });
  try {
    const url = `/api/event/schedule?eventCode=${opts.eventCode}&competitionType=${opts.competitionType}&season=${opts.year}`;
    const res = await fetchAndCache(url);
    await res.text();
    opts.onStepUpdate('schedule', { status: 'success', detail: 'Schedule cached' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('schedule', { status: 'error', error: msg });
    // Non-critical — continue
  }
}

/** Cache scouting schedule */
async function cacheScoutSchedule(opts: CacheOptions): Promise<void> {
  opts.onStepUpdate('scoutSchedule', { status: 'loading', detail: 'Downloading scouting schedule...' });
  try {
    const url = `/api/schedule/blocks?eventCode=${opts.eventCode}&year=${opts.year}&competitionType=${opts.competitionType}`;
    const res = await fetchAndCache(url);
    await res.text();
    opts.onStepUpdate('scoutSchedule', { status: 'success', detail: 'Scouting schedule cached' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('scoutSchedule', { status: 'error', error: msg });
    // Non-critical — continue
  }
}

/** Download and cache all pit entries for the event into IndexedDB */
async function cachePitEntries(opts: CacheOptions): Promise<number> {
  opts.onStepUpdate('pitEntries', { status: 'loading', detail: 'Downloading pit scouting data...' });
  try {
    const url = `/api/database/pit?eventCode=${opts.eventCode}&year=${opts.year}&competitionType=${opts.competitionType}`;
    const res = await fetchAndCache(url);
    const entries: PitEntry[] = await res.json();
    const count = Array.isArray(entries) ? entries.length : 0;

    await indexedDBService.cachePitEntries(opts.eventCode, entries);

    opts.onStepUpdate('pitEntries', {
      status: 'success',
      detail: `${count} pit entries cached`,
    });
    return count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('pitEntries', { status: 'error', error: msg });
    throw err;
  }
}

/** Download and cache all match entries for the event into IndexedDB */
async function cacheMatchEntries(opts: CacheOptions): Promise<number> {
  opts.onStepUpdate('matchEntries', { status: 'loading', detail: 'Downloading match scouting data...' });
  try {
    const url = `/api/database/match?eventCode=${opts.eventCode}&year=${opts.year}&competitionType=${opts.competitionType}`;
    const res = await fetchAndCache(url);
    const entries: MatchEntry[] = await res.json();
    const count = Array.isArray(entries) ? entries.length : 0;

    await indexedDBService.cacheMatchEntries(opts.eventCode, entries);

    opts.onStepUpdate('matchEntries', {
      status: 'success',
      detail: `${count} match entries cached`,
    });
    return count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    opts.onStepUpdate('matchEntries', { status: 'error', error: msg });
    throw err;
  }
}

export interface CacheResult {
  success: boolean;
  stepResults: CacheStep[];
  teamCount: number;
  pitEntryCount: number;
  matchEntryCount: number;
}

/**
 * Run the full caching pipeline.
 * @param mode 'scout' for lightweight (pages + teams + schedules), 'full' for everything
 */
export async function runEventCache(
  mode: 'scout' | 'full',
  opts: CacheOptions,
): Promise<CacheResult> {
  const stepIds = mode === 'full' ? FULL_CACHE_STEPS : SCOUT_STEPS;
  let teamCount = 0;
  let pitEntryCount = 0;
  let matchEntryCount = 0;
  let hasError = false;

  // Always run session + pages first
  try {
    await cacheSession(opts);
  } catch {
    hasError = true;
  }

  try {
    await cachePages(opts);
  } catch {
    hasError = true;
  }

  // Teams
  if (stepIds.includes('teams')) {
    try {
      teamCount = await cacheTeams(opts);
    } catch {
      hasError = true;
    }
  }

  // Schedules
  if (stepIds.includes('schedule')) {
    await cacheSchedule(opts);
  }

  if (stepIds.includes('scoutSchedule')) {
    await cacheScoutSchedule(opts);
  }

  // Full cache mode: pit & match entries
  if (mode === 'full') {
    if (stepIds.includes('pitEntries')) {
      try {
        pitEntryCount = await cachePitEntries(opts);
      } catch {
        hasError = true;
      }
    }

    if (stepIds.includes('matchEntries')) {
      try {
        matchEntryCount = await cacheMatchEntries(opts);
      } catch {
        hasError = true;
      }
    }

    // Save cache status metadata
    try {
      const status: EventCacheStatus = {
        eventCode: opts.eventCode,
        eventName: opts.eventName,
        competitionType: opts.competitionType,
        year: opts.year,
        cachedAt: new Date(),
        pitEntryCount,
        matchEntryCount,
        teamCount,
        schedulesCached: true,
        pagesCached: true,
        sessionCached: true,
      };
      await indexedDBService.setEventCacheStatus(status);
    } catch {
      // Non-critical
    }
  }

  return {
    success: !hasError,
    stepResults: [],
    teamCount,
    pitEntryCount,
    matchEntryCount,
  };
}
