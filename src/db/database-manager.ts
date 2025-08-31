import { DatabaseService, DatabaseConfig, DatabaseProvider } from './database-service';
import { LocalDatabaseService } from './local-database-service';
import { AzureSqlDatabaseService } from './azuresql-database-service';

class DatabaseManager {
  private static instance: DatabaseManager;
  private currentService: DatabaseService;
  private config: DatabaseConfig;

  private constructor() {
    // Check if Azure SQL is properly configured
    const azureSqlConnectionString = process.env.AZURE_SQL_CONNECTION_STRING;
    const azureSqlServer = process.env.AZURE_SQL_SERVER;
    const azureSqlDatabase = process.env.AZURE_SQL_DATABASE;
    const azureSqlUser = process.env.AZURE_SQL_USER;
    const azureSqlPassword = process.env.AZURE_SQL_PASSWORD;
    const useManagedIdentity = process.env.AZURE_SQL_USE_MANAGED_IDENTITY === 'true' ||
                              (!azureSqlUser || !azureSqlPassword || azureSqlUser.includes('your-username'));

    const isAzureSqlConfigured = azureSqlConnectionString ||
                                 (azureSqlServer && azureSqlDatabase &&
                                  !azureSqlServer.includes('your-server') &&
                                  !azureSqlDatabase.includes('ScoutingDatabase'));

    if (isAzureSqlConfigured) {
      this.config = {
        provider: 'azuresql',
        azuresql: azureSqlConnectionString ? {
          connectionString: azureSqlConnectionString,
          useManagedIdentity: false // Connection string handles auth
        } : {
          server: azureSqlServer,
          database: azureSqlDatabase,
          user: useManagedIdentity ? undefined : azureSqlUser,
          password: useManagedIdentity ? undefined : azureSqlPassword,
          useManagedIdentity: useManagedIdentity
        }
      };
      this.currentService = new AzureSqlDatabaseService(this.config.azuresql!);
    } else {
      // Fall back to local database
      this.config = {
        provider: 'local',
        local: {
          name: 'AthenaScouting'
        }
      };
      this.currentService = new LocalDatabaseService();
    }
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
    if (config.provider === 'azuresql' && config.azuresql) {
      return new AzureSqlDatabaseService(config.azuresql);
    } else if (config.provider === 'local') {
      return new LocalDatabaseService();
    }
    throw new Error('Invalid database configuration');
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

  async resetDatabase() {
    return this.currentService.resetDatabase();
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
