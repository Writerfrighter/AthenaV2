// API client for Azure SQL database operations with offline support
// Handles online/offline scenarios by queuing data when offline

import { PitEntry, MatchEntry } from '@/db/types';
import type { DashboardStats, AnalysisData, TeamData, PicklistData } from '@/lib/shared-types';
import { offlineQueueManager } from '@/lib/offline-queue-manager';

// Check if we're online
const isOnline = (): boolean => {
  return typeof window !== 'undefined' ? navigator.onLine : true;
};

// Result type for create operations that may be queued
export interface CreateResult {
  id?: number; // Server ID if synced immediately
  queueId?: string; // Queue ID if stored offline
  isQueued: boolean;
}

const API_BASE = '/api/database';

// Pit scouting operations
export const pitApi = {
  // Get all pit entries or filter by year/team
  async getAll(year?: number): Promise<PitEntry[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/pit?${params}`);
    if (!response.ok) throw new Error('Failed to fetch pit entries');
    return response.json();
  },

  async getByTeam(teamNumber: number, year?: number): Promise<PitEntry | null> {
    const params = new URLSearchParams();
    params.append('teamNumber', teamNumber.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/pit?${params}`);
    if (!response.ok) throw new Error('Failed to fetch pit entry');
    return response.json();
  },

  async create(entry: Omit<PitEntry, 'id'>): Promise<CreateResult> {
    // If offline, queue the entry
    if (!isOnline()) {
      const queueId = await offlineQueueManager.queuePitEntry(entry);
      return { queueId, isQueued: true };
    }

    // If online, try to submit immediately
    try {
      const response = await fetch(`${API_BASE}/pit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        // If network error, queue the entry
        if (!response.status || response.status >= 500) {
          const queueId = await offlineQueueManager.queuePitEntry(entry);
          return { queueId, isQueued: true };
        }
        throw new Error('Failed to create pit entry');
      }
      
      const result = await response.json();
      return { id: result.id, isQueued: false };
    } catch (error) {
      // On network error, queue the entry
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const queueId = await offlineQueueManager.queuePitEntry(entry);
        return { queueId, isQueued: true };
      }
      throw error;
    }
  },

  async update(id: number, updates: Partial<PitEntry>): Promise<void> {
    const response = await fetch(`${API_BASE}/pit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    if (!response.ok) throw new Error('Failed to update pit entry');
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/pit?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete pit entry');
  }
};

// Match scouting operations
export const matchApi = {
  async getAll(year?: number): Promise<MatchEntry[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/match?${params}`);
    if (!response.ok) throw new Error('Failed to fetch match entries');
    return response.json();
  },

  async getByTeam(teamNumber: number, year?: number): Promise<MatchEntry[]> {
    const params = new URLSearchParams();
    params.append('teamNumber', teamNumber.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/match?${params}`);
    if (!response.ok) throw new Error('Failed to fetch match entries');
    return response.json();
  },

  async create(entry: Omit<MatchEntry, 'id'>): Promise<CreateResult> {
    // If offline, queue the entry
    if (!isOnline()) {
      const queueId = await offlineQueueManager.queueMatchEntry(entry);
      return { queueId, isQueued: true };
    }

    // If online, try to submit immediately
    try {
      const response = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        // If network error, queue the entry
        if (!response.status || response.status >= 500) {
          const queueId = await offlineQueueManager.queueMatchEntry(entry);
          return { queueId, isQueued: true };
        }
        throw new Error('Failed to create match entry');
      }
      
      const result = await response.json();
      return { id: result.id, isQueued: false };
    } catch (error) {
      // On network error, queue the entry
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const queueId = await offlineQueueManager.queueMatchEntry(entry);
        return { queueId, isQueued: true };
      }
      throw error;
    }
  },

  async update(id: number, updates: Partial<MatchEntry>): Promise<void> {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    if (!response.ok) throw new Error('Failed to update match entry');
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/match?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete match entry');
  }
};

// Statistics and analysis operations
export const statsApi = {
  async getDashboardStats(year?: number, eventCode?: string, competitionType?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);
    if (competitionType) params.append('competitionType', competitionType);

    const response = await fetch(`${API_BASE}/stats?${params}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  async getAnalysisData(year?: number, eventCode?: string, competitionType?: string): Promise<AnalysisData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);
    if (competitionType) params.append('competitionType', competitionType);

    const response = await fetch(`${API_BASE}/analysis?${params}`);
    if (!response.ok) throw new Error('Failed to fetch analysis data');
    return response.json();
  },

  async getPicklistData(year?: number, eventCode?: string, competitionType?: string): Promise<PicklistData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);
    if (competitionType) params.append('competitionType', competitionType);

    const response = await fetch(`${API_BASE}/picklist?${params}`);
    if (!response.ok) throw new Error('Failed to fetch picklist data');
    return response.json();
  }
};

// Team data operations
export const teamApi = {
  async getTeamData(teamNumber: number, year?: number, eventCode?: string, competitionType?: string): Promise<TeamData> {
    const params = new URLSearchParams();
    params.append('teamNumber', teamNumber.toString());
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);
    if (competitionType) params.append('competitionType', competitionType);

    const response = await fetch(`${API_BASE}/team?${params}`);
    if (!response.ok) throw new Error('Failed to fetch team data');
    const data = await response.json();
    // console.log("Data:", data);
    return data;
  }
};

// Data export/import operations
export const dataApi = {
  async exportData(year?: number): Promise<{ pitEntries: PitEntry[], matchEntries: MatchEntry[] }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE}/export?${params}`);
    if (!response.ok) throw new Error('Failed to export data');
    return response.json();
  },

  async importData(data: { pitEntries: PitEntry[], matchEntries: MatchEntry[] }): Promise<void> {
    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to import data');
  }
};

// Offline queue management operations
export const offlineApi = {
  // Get count of pending offline entries
  async getPendingCount(): Promise<number> {
    return offlineQueueManager.getPendingCount();
  },

  // Get count of all queued entries
  async getTotalQueuedCount(): Promise<number> {
    return offlineQueueManager.getTotalQueuedCount();
  },

  // Sync all pending entries
  async syncPending(): Promise<import('@/lib/offline-types').SyncResult> {
    return offlineQueueManager.syncPendingEntries();
  },

  // Retry failed entries
  async retryFailed(): Promise<import('@/lib/offline-types').SyncResult> {
    return offlineQueueManager.retryFailedEntries();
  },

  // Clear synced entries
  async clearSynced(): Promise<number> {
    return offlineQueueManager.clearSyncedEntries();
  },

  // Get all queued entries (for UI display)
  async getAllQueued(): Promise<import('@/lib/offline-types').QueuedEntry[]> {
    return offlineQueueManager.getAllQueuedEntries();
  },

  // Get recent sync logs
  async getSyncLogs(limit = 10): Promise<import('@/lib/offline-types').SyncResult[]> {
    return offlineQueueManager.getRecentSyncLogs(limit);
  },

  // Get/set sync configuration
  async getSyncConfig(): Promise<import('@/lib/offline-types').SyncConfig> {
    return offlineQueueManager.getSyncConfig();
  },

  async setSyncConfig(config: Partial<import('@/lib/offline-types').SyncConfig>): Promise<void> {
    return offlineQueueManager.setSyncConfig(config);
  }
};
