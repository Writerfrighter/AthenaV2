import Dexie, { type EntityTable } from "dexie";
import { PitEntry, MatchEntry } from './types';

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

// Add event fields
db.version(3).stores({
  pitEntries: "++id, teamNumber, year, name, drivetrain, weight, length, width, gameSpecificData, eventName, eventCode",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, position, gameSpecificData, timestamp, eventName, eventCode"
}).upgrade(tx => {
  // Add event fields to existing entries
  return Promise.all([
    tx.table("pitEntries").toCollection().modify(entry => {
      if (!entry.eventName) {
        entry.eventName = 'Unknown Event';
      }
      if (!entry.eventCode) {
        entry.eventCode = 'Unknown Code';
      }
    }),
    tx.table("matchEntries").toCollection().modify(entry => {
      if (!entry.eventName) {
        entry.eventName = 'Unknown Event';
      }
      if (!entry.eventCode) {
        entry.eventCode = 'Unknown Code';
      }
    })
  ]);
});

db.version(4).stores({
  pitEntries: "++id, teamNumber, year, name, drivetrain, weight, length, width, gameSpecificData, eventName, eventCode",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, position, gameSpecificData, timestamp, eventName, eventCode"
}).upgrade(tx => {
  // Add cast teamNumber to number and matchnumber "Q<number>" to a number
  return Promise.all([
    tx.table("pitEntries").toCollection().modify(entry => {
      entry.teamNumber = Number(entry.teamNumber);
    }),
    tx.table("matchEntries").toCollection().modify(entry => {
      entry.teamNumber = Number(entry.teamNumber);
      entry.matchNumber = Number(entry.matchNumber.replace("Q", ""));
    })
  ]);
});

// Remove name field from pitEntries as team number is sufficient
db.version(5).stores({
  pitEntries: "++id, teamNumber, year, drivetrain, weight, length, width, gameSpecificData, eventName, eventCode",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, position, gameSpecificData, timestamp, eventName, eventCode"
}).upgrade(tx => {
  // Remove name field from existing entries
  return tx.table("pitEntries").toCollection().modify(entry => {
    delete entry.name;
  });
});

// Remove position field from matchEntries
db.version(6).stores({
  pitEntries: "++id, teamNumber, year, drivetrain, weight, length, width, gameSpecificData, eventName, eventCode",
  matchEntries: "++id, teamNumber, year, matchNumber, alliance, gameSpecificData, timestamp, eventName, eventCode"
}).upgrade(tx => {
  // Remove position field from existing entries
  return tx.table("matchEntries").toCollection().modify(entry => {
    delete entry.position;
  });
});

export type { PitEntry, MatchEntry };
export { db };