import Dexie, { type EntityTable } from "dexie";

interface PitEntry {
  id?: number;
  teamNumber: number;
  name: string;
  year: number;
  driveTrain: "Swerve" | "Mecanum" | "Tank" | "Other";
  weight: number;
  length: number;
  width: number;
  gameSpecificData: Record<string, any>; // Flexible object for year-specific fields
  [extra: string]: unknown
}

interface MatchEntry {
  id?: number;
  matchNumber: string;
  teamNumber: string;
  year: number;
  alliance: 'red' | 'blue';
  position: '1' | '2' | '3';
  gameSpecificData: Record<string, any>; // Flexible object for year-specific fields
  notes: string;
  timestamp: Date;
}

const db = new Dexie("ScoutingDatabase") as Dexie & {
  pitEntries: EntityTable<PitEntry, "id">;
  matchEntries: EntityTable<MatchEntry, "id">;
};

// Schema declaration with version management for backwards compatibility
db.version(1).stores({
  pitEntries: "++id, teamNumber, year, name, drivetrain, weight, length, width",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, position, timestamp"
});

// Migration for existing data
db.version(2).stores({
  pitEntries: "++id, teamNumber, year, name, drivetrain, weight, length, width, gameSpecificData",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, position, gameSpecificData, timestamp"
}).upgrade(tx => {
  // Add year and gameSpecificData fields to existing entries
  return tx.table("pitEntries").toCollection().modify(entry => {
    if (!entry.year) {
      entry.year = new Date().getFullYear(); // Default to current year
    }
    if (!entry.gameSpecificData) {
      entry.gameSpecificData = {};
    }
  });
});

export type { PitEntry, MatchEntry };
export { db };
