import { DatabaseService, DatabaseConfig, DatabaseProvider } from './database-service';
import { LocalDatabaseService } from './local-database-service';
import { CosmosDatabaseService } from './cosmos-database-service';

class DatabaseManager {
  private static instance: DatabaseManager;
  private currentService: DatabaseService;
  private config: DatabaseConfig;

  private constructor() {
    // Default to local database
    this.config = {
      provider: 'local',
      local: { name: 'ScoutingDatabase' }
    };
    this.currentService = new LocalDatabaseService();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  configure(config: DatabaseConfig): void {
    this.config = config;
    this.currentService = this.createService(config);
  }

  private createService(config: DatabaseConfig): DatabaseService {
    switch (config.provider) {
      case 'local':
        return new LocalDatabaseService();
      case 'cosmos':
        if (!config.cosmos) {
          throw new Error('Azure Cosmos DB configuration required');
        }
        const cosmosService = new CosmosDatabaseService(config.cosmos);
        // Initialize Cosmos DB client (fire and forget for now)
        (cosmosService as any).initializeClient().catch(console.error);
        return cosmosService;
      case 'supabase':
        // TODO: Implement Supabase service
        throw new Error('Supabase not implemented yet');
      case 'mongodb':
        // TODO: Implement MongoDB service
        throw new Error('MongoDB not implemented yet');
      default:
        throw new Error(`Unsupported database provider: ${config.provider}`);
    }
  }

  getService(): DatabaseService {
    return this.currentService;
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }

  // Convenience methods that delegate to the current service
  async exportData(year?: number) {
    return this.currentService.exportData(year);
  }

  async importData(data: Parameters<DatabaseService['importData']>[0]) {
    return this.currentService.importData(data);
  }

  async switchProvider(provider: DatabaseProvider, config?: Partial<DatabaseConfig>) {
    const newConfig: DatabaseConfig = {
      ...this.config,
      provider,
      ...config
    };
    this.configure(newConfig);
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
export { DatabaseManager };
