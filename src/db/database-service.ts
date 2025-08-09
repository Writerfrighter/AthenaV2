import { PitEntry, MatchEntry } from './db';

// Database service interface for different storage backends
export interface DatabaseService {
  // Pit scouting
  addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number>;
  getPitEntry(teamNumber: number, year: number): Promise<PitEntry | undefined>;
  getAllPitEntries(year?: number): Promise<PitEntry[]>;
  updatePitEntry(id: number, updates: Partial<PitEntry>): Promise<void>;
  deletePitEntry(id: number): Promise<void>;

  // Match scouting  
  addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number>;
  getMatchEntries(teamNumber: string, year?: number): Promise<MatchEntry[]>;
  getAllMatchEntries(year?: number): Promise<MatchEntry[]>;
  updateMatchEntry(id: number, updates: Partial<MatchEntry>): Promise<void>;
  deleteMatchEntry(id: number): Promise<void>;

  // Sync operations
  exportData(year?: number): Promise<{pitEntries: PitEntry[], matchEntries: MatchEntry[]}>;
  importData(data: {pitEntries: PitEntry[], matchEntries: MatchEntry[]}): Promise<void>;
  syncToCloud?(): Promise<void>;
  syncFromCloud?(): Promise<void>;
}

export type DatabaseProvider = 'local' | 'firebase' | 'cosmos' | 'supabase' | 'mongodb';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  local?: {
    name: string;
  };
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  cosmos?: {
    endpoint: string;
    databaseName: string;
    useKeyVault?: boolean;
    keyVaultUrl?: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
  mongodb?: {
    connectionString: string;
    database: string;
  };
}
