import { DatabaseService } from './database-service';
import { db } from './db';
import { PitEntry, MatchEntry } from './types';

export class LocalDatabaseService implements DatabaseService {
  // Pit scouting methods
  async addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number> {
    const id = await db.pitEntries.add(entry as PitEntry);
    return id as number;
  }

  async getPitEntry(teamNumber: number, year: number): Promise<PitEntry | undefined> {
    return await db.pitEntries
      .where('teamNumber')
      .equals(teamNumber)
      .and(entry => entry.year === year)
      .first();
  }

  async getAllPitEntries(year?: number, eventCode?: string): Promise<PitEntry[]> {
    let results = await db.pitEntries.toArray();
    
    if (year) {
      results = results.filter(entry => entry.year === year);
    }
    
    if (eventCode) {
      results = results.filter(entry => entry.eventCode === eventCode);
    }
    
    return results;
  }

  async updatePitEntry(id: number, updates: Partial<PitEntry>): Promise<void> {
    await db.pitEntries.update(id, updates);
  }

  async deletePitEntry(id: number): Promise<void> {
    await db.pitEntries.delete(id);
  }

  // Match scouting methods
  async addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number> {
    const id = await db.matchEntries.add(entry as MatchEntry);
    return id as number;
  }

  async getMatchEntries(teamNumber: number, year?: number): Promise<MatchEntry[]> {
    let query = db.matchEntries.where('teamNumber').equals(teamNumber);
    if (year) {
      query = query.and(entry => entry.year === year);
    }
    return await query.toArray();
  }

  async getAllMatchEntries(year?: number, eventCode?: string): Promise<MatchEntry[]> {
    let results = await db.matchEntries.toArray();
    
    if (year) {
      results = results.filter(entry => entry.year === year);
    }
    
    if (eventCode) {
      results = results.filter(entry => entry.eventCode === eventCode);
    }
    
    return results;
  }

  async updateMatchEntry(id: number, updates: Partial<MatchEntry>): Promise<void> {
    await db.matchEntries.update(id, updates);
  }

  async deleteMatchEntry(id: number): Promise<void> {
    await db.matchEntries.delete(id);
  }

  // Export/Import methods
  async exportData(year?: number): Promise<{pitEntries: PitEntry[], matchEntries: MatchEntry[]}> {
    const pitEntries = await this.getAllPitEntries(year);
    const matchEntries = await this.getAllMatchEntries(year);
    return { pitEntries, matchEntries };
  }

  async importData(data: {pitEntries: PitEntry[], matchEntries: MatchEntry[]}): Promise<void> {
    // Clear existing data for the years being imported
    const years = new Set([
      ...data.pitEntries.map(entry => entry.year),
      ...data.matchEntries.map(entry => entry.year)
    ]);

    for (const year of years) {
      await db.pitEntries.where('year').equals(year).delete();
      await db.matchEntries.where('year').equals(year).delete();
    }

    // Import new data
    await db.pitEntries.bulkAdd(data.pitEntries);
    await db.matchEntries.bulkAdd(data.matchEntries);
  }

  async resetDatabase(): Promise<void> {
    // Clear all data from tables
    await db.pitEntries.clear();
    await db.matchEntries.clear();
  }
}
