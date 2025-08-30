// Main data models
export interface PitEntry {
  id?: number;
  teamNumber: number;
  year: number;
  driveTrain: "Swerve" | "Mecanum" | "Tank" | "Other";
  weight: number;
  length: number;
  width: number;
  eventName?: string;
  eventCode?: string;
  gameSpecificData: Record<string, number | string | boolean | Record<string, number | string | boolean>>; // Flexible object for year-specific fields
  [extra: string]: unknown;
}

export interface MatchEntry {
  id?: number;
  matchNumber: number;
  teamNumber: number;
  year: number;
  alliance: 'red' | 'blue';
  eventName?: string;
  eventCode?: string;
  gameSpecificData: Record<string, number | string | boolean | Record<string, number | string | boolean>>; // Flexible object for year-specific fields
  notes: string;
  timestamp: Date;
}

// Database service interface
export interface DatabaseService {
  // Pit scouting
  addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number>;
  getPitEntry(teamNumber: number, year: number): Promise<PitEntry | undefined>;
  getAllPitEntries(year?: number): Promise<PitEntry[]>;
  updatePitEntry(id: number, updates: Partial<PitEntry>): Promise<void>;
  deletePitEntry(id: number): Promise<void>;

  // Match scouting
  addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number>;
  getMatchEntries(teamNumber: number, year?: number): Promise<MatchEntry[]>;
  getAllMatchEntries(year?: number): Promise<MatchEntry[]>;
  updateMatchEntry(id: number, updates: Partial<MatchEntry>): Promise<void>;
  deleteMatchEntry(id: number): Promise<void>;

  // Sync operations
  exportData(year?: number): Promise<{pitEntries: PitEntry[], matchEntries: MatchEntry[]}>;
  importData(data: {pitEntries: PitEntry[], matchEntries: MatchEntry[]}): Promise<void>;
  resetDatabase(): Promise<void>;
  syncToCloud?(): Promise<void>;
  syncFromCloud?(): Promise<void>;
}

// Database configuration types
export type DatabaseProvider = 'local' | 'azuresql';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  local?: {
    name: string;
  };
  azuresql?: {
    server: string;
    database: string;
    user?: string;
    password?: string;
    connectionString?: string;
    useManagedIdentity?: boolean;
  };
}

// Azure SQL specific types
export interface AzureSqlConfig {
  server: string;
  database: string;
  user?: string;
  password?: string;
  connectionString?: string;
  useManagedIdentity?: boolean;
}

export interface PitEntryRow {
  id: number;
  teamNumber: number;
  year: number;
  driveTrain: string;
  weight: number;
  length: number;
  width: number;
  eventName: string | null;
  eventCode: string | null;
  gameSpecificData: string;
}

export interface MatchEntryRow {
  id: number;
  matchNumber: number;
  teamNumber: number;
  year: number;
  alliance: string;
  eventName: string | null;
  eventCode: string | null;
  gameSpecificData: string;
  notes: string;
  timestamp: Date;
}
