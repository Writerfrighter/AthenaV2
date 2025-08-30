// API client for Azure SQL database operations
// This replaces direct database access with API calls

import { PitEntry, MatchEntry } from '@/db/types';

const API_BASE = '/api/database';

export interface DashboardStats {
  totalTeams: number;
  totalMatches: number;
  totalPitScouts: number;
  matchCompletion: number;
  topTeams: Array<{
    teamNumber: number;
    name: string;
    matchesPlayed: number;
    avgEPA: number;
    totalEPA: number;
  }>;
  recentActivity: Array<{
    teamNumber: number;
    matchNumber: number;
    timestamp: Date;
  }>;
}

export interface AnalysisData {
  scoringAnalysis: Array<{
    category: string;
    average: number;
    count: number;
    data: number[];
  }>;
  teamEPAData: Array<{
    teamNumber: number;
    name: string;
    matchesPlayed: number;
    avgEPA: number;
    totalEPA: number;
    autoEPA: number;
    teleopEPA: number;
    endgameEPA: number;
    penaltiesEPA: number;
  }>;
  totalMatches: number;
  totalTeams: number;
}

export interface PicklistData {
  teams: Array<{
    teamNumber: number;
    name: string;
    driveTrain: string;
    weight: number;
    length: number;
    width: number;
    matchesPlayed: number;
    totalEPA: number;
    avgEPA: number;
    autoEPA: number;
    teleopEPA: number;
    endgameEPA: number;
    rank: number;
  }>;
  totalTeams: number;
  lastUpdated: string;
}

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
