import { DatabaseService } from './database-service';
import { PitEntry, MatchEntry } from './db';
import { CosmosClient, Database, Container, ItemResponse, FeedResponse } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

// Azure Cosmos DB service implementation
// Uses @azure/cosmos SDK with managed identity authentication
// Reference: https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-api-nodejs-get-started

interface CosmosConfig {
  endpoint: string;
  databaseName: string;
  // Using managed identity - no keys needed
  useKeyVault?: boolean;
  keyVaultUrl?: string;
}

export class CosmosDatabaseService implements DatabaseService {
  private cosmosClient: CosmosClient | null = null;
  private database: Database | null = null;
  private pitContainer: Container | null = null;
  private matchContainer: Container | null = null;
  private config: CosmosConfig;

  constructor(config: CosmosConfig) {
    this.config = config;
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Initialize with managed identity (no connection string needed)
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.endpoint,
        aadCredentials: new DefaultAzureCredential()
      });

      // Initialize database and containers
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.config.databaseName
      });
      this.database = database;

      // Create containers with optimized partition keys and indexing
      const { container: pitContainer } = await this.database.containers.createIfNotExists({
        id: 'pitEntries',
        partitionKey: { paths: ['/year'] }, // Partition by year for better distribution
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/teamNumber/*' },
            { path: '/year/*' },
            { path: '/name/*' }
          ]
        },
        defaultTtl: -1 // No auto-expiration
      });
      this.pitContainer = pitContainer;

      const { container: matchContainer } = await this.database.containers.createIfNotExists({
        id: 'matchEntries',
        partitionKey: { paths: ['/year'] },
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/teamNumber/*' },
            { path: '/year/*' },
            { path: '/matchNumber/*' },
            { path: '/timestamp/*' },
            { path: '/alliance/*' }
          ]
        },
        defaultTtl: -1
      });
      this.matchContainer = matchContainer;

      console.log('Cosmos DB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  private ensureInitialized() {
    if (!this.cosmosClient || !this.database || !this.pitContainer || !this.matchContainer) {
      throw new Error('Cosmos DB service not initialized. Call initializeClient() first.');
    }
  }

  // Pit scouting methods with retry logic and proper error handling
  async addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number> {
    this.ensureInitialized();
    try {
      const entryWithId = {
        ...entry,
        id: `pit-${entry.teamNumber}-${entry.year}`, // Consistent ID format
        ttl: -1 // No expiration
      };

      const { resource } = await this.retryOperation(() =>
        this.pitContainer!.items.create(entryWithId)
      );

      return parseInt(resource?.id.split('-')[1] || '0'); // Return team number as ID
    } catch (error) {
      console.error('Error adding pit entry:', error);
      throw new Error(`Failed to add pit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPitEntry(teamNumber: number, year: number): Promise<PitEntry | undefined> {
    this.ensureInitialized();
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.teamNumber = @teamNumber AND c.year = @year',
        parameters: [
          { name: '@teamNumber', value: teamNumber },
          { name: '@year', value: year }
        ]
      };

      const { resources } = await this.retryOperation(() =>
        this.pitContainer!.items.query(query, { partitionKey: year }).fetchAll()
      );

      return resources.length > 0 ? this.mapCosmosToPitEntry(resources[0]) : undefined;
    } catch (error) {
      console.error('Error getting pit entry:', error);
      return undefined;
    }
  }

  async getAllPitEntries(year?: number): Promise<PitEntry[]> {
    this.ensureInitialized();
    try {
      let query;
      const options: Record<string, unknown> = {};

      if (year) {
        query = {
          query: 'SELECT * FROM c WHERE c.year = @year ORDER BY c.teamNumber',
          parameters: [{ name: '@year', value: year }]
        };
        options.partitionKey = year;
      } else {
        query = {
          query: 'SELECT * FROM c ORDER BY c.year DESC, c.teamNumber',
          parameters: []
        };
      }

      const { resources } = await this.retryOperation(() =>
        this.pitContainer!.items.query(query, options).fetchAll()
      );

      return resources.map(this.mapCosmosToPitEntry);
    } catch (error) {
      console.error('Error getting all pit entries:', error);
      return [];
    }
  }

  async updatePitEntry(id: number, updates: Partial<PitEntry>): Promise<void> {
    this.ensureInitialized();
    try {
      // Find the entry first to get the year for partition key
      const existingEntry = await this.getPitEntry(id, updates.year || new Date().getFullYear());
      if (!existingEntry) {
        throw new Error(`Pit entry with ID ${id} not found`);
      }

      const cosmosId = `pit-${id}-${existingEntry.year}`;
      const updatedEntry = { ...existingEntry, ...updates, id: cosmosId };

      await this.retryOperation(() =>
        this.pitContainer!.item(cosmosId, existingEntry.year).replace(updatedEntry)
      );
    } catch (error) {
      console.error('Error updating pit entry:', error);
      throw new Error(`Failed to update pit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePitEntry(id: number): Promise<void> {
    this.ensureInitialized();
    try {
      // We need to find the entry to get the year for the partition key
      const query = {
        query: 'SELECT * FROM c WHERE c.teamNumber = @teamNumber',
        parameters: [{ name: '@teamNumber', value: id }]
      };

      const { resources } = await this.retryOperation(() =>
        this.pitContainer!.items.query(query).fetchAll()
      );

      if (resources.length === 0) {
        throw new Error(`Pit entry with ID ${id} not found`);
      }

      for (const resource of resources) {
        await this.retryOperation(() =>
          this.pitContainer!.item(resource.id, resource.year).delete()
        );
      }
    } catch (error) {
      console.error('Error deleting pit entry:', error);
      throw new Error(`Failed to delete pit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Match scouting methods
  async addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number> {
    this.ensureInitialized();
    try {
      const entryWithId = {
        ...entry,
        id: `match-${entry.teamNumber}-${entry.matchNumber}-${entry.year}-${Date.now()}`,
        timestamp: entry.timestamp || new Date(),
        ttl: -1
      };

      const { resource } = await this.retryOperation(() =>
        this.matchContainer!.items.create(entryWithId)
      );

      return Date.now(); // Return timestamp as ID
    } catch (error) {
      console.error('Error adding match entry:', error);
      throw new Error(`Failed to add match entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMatchEntries(teamNumber: string, year?: number): Promise<MatchEntry[]> {
    this.ensureInitialized();
    try {
      let query;
      const options: Record<string, unknown> = {};

      if (year) {
        query = {
          query: 'SELECT * FROM c WHERE c.teamNumber = @teamNumber AND c.year = @year ORDER BY c.timestamp DESC',
          parameters: [
            { name: '@teamNumber', value: teamNumber },
            { name: '@year', value: year }
          ]
        };
        options.partitionKey = year;
      } else {
        query = {
          query: 'SELECT * FROM c WHERE c.teamNumber = @teamNumber ORDER BY c.timestamp DESC',
          parameters: [{ name: '@teamNumber', value: teamNumber }]
        };
      }

      const { resources } = await this.retryOperation(() =>
        this.matchContainer!.items.query(query, options).fetchAll()
      );

      return resources.map(this.mapCosmosToMatchEntry);
    } catch (error) {
      console.error('Error getting match entries:', error);
      return [];
    }
  }

  async getAllMatchEntries(year?: number): Promise<MatchEntry[]> {
    this.ensureInitialized();
    try {
      let query;
      const options: Record<string, unknown> = {};

      if (year) {
        query = {
          query: 'SELECT * FROM c WHERE c.year = @year ORDER BY c.timestamp DESC',
          parameters: [{ name: '@year', value: year }]
        };
        options.partitionKey = year;
      } else {
        query = {
          query: 'SELECT * FROM c ORDER BY c.year DESC, c.timestamp DESC',
          parameters: []
        };
      }

      const { resources } = await this.retryOperation(() =>
        this.matchContainer!.items.query(query, options).fetchAll()
      );

      return resources.map(this.mapCosmosToMatchEntry);
    } catch (error) {
      console.error('Error getting all match entries:', error);
      return [];
    }
  }

  async updateMatchEntry(id: number, updates: Partial<MatchEntry>): Promise<void> {
    this.ensureInitialized();
    try {
      // Find the entry by ID (timestamp)
      const query = {
        query: 'SELECT * FROM c WHERE c.id CONTAINS @id',
        parameters: [{ name: '@id', value: id.toString() }]
      };

      const { resources } = await this.retryOperation(() =>
        this.matchContainer!.items.query(query).fetchAll()
      );

      if (resources.length === 0) {
        throw new Error(`Match entry with ID ${id} not found`);
      }

      const existingEntry = resources[0];
      const updatedEntry = { ...existingEntry, ...updates };

      await this.retryOperation(() =>
        this.matchContainer!.item(existingEntry.id, existingEntry.year).replace(updatedEntry)
      );
    } catch (error) {
      console.error('Error updating match entry:', error);
      throw new Error(`Failed to update match entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteMatchEntry(id: number): Promise<void> {
    this.ensureInitialized();
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.id CONTAINS @id',
        parameters: [{ name: '@id', value: id.toString() }]
      };

      const { resources } = await this.retryOperation(() =>
        this.matchContainer!.items.query(query).fetchAll()
      );

      if (resources.length === 0) {
        throw new Error(`Match entry with ID ${id} not found`);
      }

      for (const resource of resources) {
        await this.retryOperation(() =>
          this.matchContainer!.item(resource.id, resource.year).delete()
        );
      }
    } catch (error) {
      console.error('Error deleting match entry:', error);
      throw new Error(`Failed to delete match entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export/Import with batch operations for better performance
  async exportData(year?: number): Promise<{pitEntries: PitEntry[], matchEntries: MatchEntry[]}> {
    try {
      const [pitEntries, matchEntries] = await Promise.all([
        this.getAllPitEntries(year),
        this.getAllMatchEntries(year)
      ]);

      return { pitEntries, matchEntries };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importData(data: {pitEntries: PitEntry[], matchEntries: MatchEntry[]}): Promise<void> {
    try {
      // Clear existing data for the years being imported
      const years = new Set([
        ...data.pitEntries.map(entry => entry.year),
        ...data.matchEntries.map(entry => entry.year)
      ]);

      // Delete existing data by year
      for (const year of years) {
        await this.deleteDataByYear(year);
      }

      // Batch import new data for better performance
      const batchSize = 100; // Cosmos DB batch limit

      // Import pit entries in batches
      for (let i = 0; i < data.pitEntries.length; i += batchSize) {
        const batch = data.pitEntries.slice(i, i + batchSize);
        await Promise.all(
          batch.map(entry => this.addPitEntry(entry))
        );
      }

      // Import match entries in batches
      for (let i = 0; i < data.matchEntries.length; i += batchSize) {
        const batch = data.matchEntries.slice(i, i + batchSize);
        await Promise.all(
          batch.map(entry => this.addMatchEntry(entry))
        );
      }

      console.log(`Successfully imported ${data.pitEntries.length} pit entries and ${data.matchEntries.length} match entries`);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cloud sync methods
  async syncToCloud(): Promise<void> {
    this.ensureInitialized();
    // This is already cloud storage, so just validate connection
    try {
      await this.database!.read();
      console.log('Cloud sync validated - already using Azure Cosmos DB');
    } catch (error) {
      throw new Error(`Cloud sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async syncFromCloud(): Promise<void> {
    this.ensureInitialized();
    // This is already cloud storage, so just validate connection
    try {
      await this.database!.read();
      console.log('Cloud sync validated - already using Azure Cosmos DB');
    } catch (error) {
      throw new Error(`Cloud sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private async deleteDataByYear(year: number): Promise<void> {
    this.ensureInitialized();
    try {
      // Delete pit entries for the year
      const pitQuery = {
        query: 'SELECT c.id FROM c WHERE c.year = @year',
        parameters: [{ name: '@year', value: year }]
      };

      const { resources: pitResources } = await this.pitContainer!.items
        .query(pitQuery, { partitionKey: year })
        .fetchAll();

      for (const resource of pitResources) {
        await this.pitContainer!.item(resource.id, year).delete();
      }

      // Delete match entries for the year
      const matchQuery = {
        query: 'SELECT c.id FROM c WHERE c.year = @year',
        parameters: [{ name: '@year', value: year }]
      };

      const { resources: matchResources } = await this.matchContainer!.items
        .query(matchQuery, { partitionKey: year })
        .fetchAll();

      for (const resource of matchResources) {
        await this.matchContainer!.item(resource.id, year).delete();
      }
    } catch (error) {
      console.error(`Error deleting data for year ${year}:`, error);
      throw error;
    }
  }

  private mapCosmosToPitEntry(cosmosItem: Record<string, unknown>): PitEntry {
    return {
      id: cosmosItem.teamNumber as number,
      teamNumber: cosmosItem.teamNumber as number,
      name: cosmosItem.name as string,
      year: cosmosItem.year as number,
      driveTrain: cosmosItem.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
      weight: cosmosItem.weight as number,
      length: cosmosItem.length as number,
      width: cosmosItem.width as number,
      gameSpecificData: (cosmosItem.gameSpecificData as Record<string, number | string | boolean | Record<string, number | string | boolean>>) || {}
    };
  }

  private mapCosmosToMatchEntry(cosmosItem: Record<string, unknown>): MatchEntry {
    return {
      id: parseInt((cosmosItem.id as string).split('-').pop() || '0'),
      matchNumber: cosmosItem.matchNumber as string,
      teamNumber: cosmosItem.teamNumber as string,
      year: cosmosItem.year as number,
      alliance: cosmosItem.alliance as "red" | "blue",
      position: cosmosItem.position as "1" | "2" | "3",
      gameSpecificData: (cosmosItem.gameSpecificData as Record<string, number | string | boolean | Record<string, number | string | boolean>>) || {},
      notes: (cosmosItem.notes as string) || '',
      timestamp: new Date(cosmosItem.timestamp as string | number)
    };
  }

  // Retry logic with exponential backoff for transient failures
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (400-499)
        if (lastError.message.includes('400') || lastError.message.includes('404')) {
          throw lastError;
        }

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Retry attempt ${attempt} after ${delay}ms for:`, lastError.message);
      }
    }

    throw lastError!;
  }
}
