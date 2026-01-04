// Offline data types for IndexedDB storage and synchronization
// Handles caching of pit and match scouting data when offline

import type { PitEntry, MatchEntry } from '@/lib/shared-types';

// Status of a queued entry
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

// Base interface for queued data entries
export interface QueuedEntry {
  id: string; // UUID for the queued entry
  type: 'pit' | 'match';
  status: SyncStatus;
  data: Omit<PitEntry, 'id'> | Omit<MatchEntry, 'id'>;
  createdAt: Date;
  lastAttempt?: Date;
  attempts: number;
  error?: string;
  remoteId?: number; // ID from the server after successful sync
}

// Queued pit scouting entry
export interface QueuedPitEntry extends QueuedEntry {
  type: 'pit';
  data: Omit<PitEntry, 'id'>;
}

// Queued match scouting entry
export interface QueuedMatchEntry extends QueuedEntry {
  type: 'match';
  data: Omit<MatchEntry, 'id'>;
}

// Sync configuration
export interface SyncConfig {
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  autoSyncEnabled: boolean;
}

// Sync result for tracking sync operations
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
  timestamp: Date;
}

// Network status tracking
export interface NetworkStatus {
  isOnline: boolean;
  lastOnline?: Date;
  lastOffline?: Date;
}

// Cached team info for offline scouting
export interface CachedTeamInfo {
  teamNumber: number;
  nickname: string;
  key: string;
}

// Cached event teams data
export interface CachedEventTeams {
  eventCode: string;
  competitionType: string;
  year: number;
  teams: CachedTeamInfo[];
  cachedAt: Date;
}

// Cached event list data
export interface CachedEventList {
  teamNumber: number;
  competitionType: string;
  year: number;
  events: Array<{
    name: string;
    region: string;
    code: string;
  }>;
  cachedAt: Date;
}

// IndexedDB schema version - increment when adding new stores
export const DB_VERSION = 2;
export const DB_NAME = 'athena-offline-cache';

// Store names
export const STORES = {
  QUEUE: 'queue',
  SYNC_LOG: 'sync_log',
  CONFIG: 'config',
  EVENT_TEAMS: 'event_teams',
  EVENT_LIST: 'event_list'
} as const;