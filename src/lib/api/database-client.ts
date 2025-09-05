// API client for Azure SQL database operations
// This replaces direct database access with API calls

import { PitEntry, MatchEntry } from '@/db/types';
import type { DashboardStats, AnalysisData, TeamData, PicklistData } from '@/lib/shared-types';

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

  async create(entry: Omit<PitEntry, 'id'>): Promise<{ id: number }> {
    const response = await fetch(`${API_BASE}/pit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Failed to create pit entry');
    return response.json();
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

  async create(entry: Omit<MatchEntry, 'id'>): Promise<{ id: number }> {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Failed to create match entry');
    return response.json();
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
  async getDashboardStats(year?: number, eventCode?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);

    const response = await fetch(`${API_BASE}/stats?${params}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  async getAnalysisData(year?: number, eventCode?: string): Promise<AnalysisData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);

    const response = await fetch(`${API_BASE}/analysis?${params}`);
    if (!response.ok) throw new Error('Failed to fetch analysis data');
    return response.json();
  },

  async getPicklistData(year?: number, eventCode?: string): Promise<PicklistData> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);

    const response = await fetch(`${API_BASE}/picklist?${params}`);
    if (!response.ok) throw new Error('Failed to fetch picklist data');
    return response.json();
  }
};

// Team data operations
export const teamApi = {
  async getTeamData(teamNumber: number, year?: number, eventCode?: string): Promise<TeamData> {
    const params = new URLSearchParams();
    params.append('teamNumber', teamNumber.toString());
    if (year) params.append('year', year.toString());
    if (eventCode) params.append('eventCode', eventCode);

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
