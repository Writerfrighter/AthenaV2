import { DatabaseService, DatabaseConfig, DatabaseProvider } from './database-service';
import { AzureSqlDatabaseService } from './azuresql-database-service';
import { LocalDatabaseService } from './local-database-service';
import { FirebaseDatabaseService } from './firebase-database-service';
import { CosmosDatabaseService } from './cosmos-database-service';

class DatabaseManager {
  private static instance: DatabaseManager;
  private currentService: DatabaseService;
  private config: DatabaseConfig;

  private constructor() {
    // Allow explicit provider override via env var
    const envProvider = (process.env.DATABASE_PROVIDER || '').toLowerCase() as DatabaseProvider | '';

    // Azure SQL envs
    const azureSqlConnectionString = process.env.AZURE_SQL_CONNECTION_STRING;
    const azureSqlServer = process.env.AZURE_SQL_SERVER;
    const azureSqlDatabase = process.env.AZURE_SQL_DATABASE;
    const azureSqlUser = process.env.AZURE_SQL_USER;
    const azureSqlPassword = process.env.AZURE_SQL_PASSWORD;
    const useManagedIdentity = process.env.AZURE_SQL_USE_MANAGED_IDENTITY === 'true' ||
                  !azureSqlUser || !azureSqlPassword || (azureSqlUser?.includes('your-username') ?? false);

    const isAzureSqlConfigured = azureSqlConnectionString ||
                                 (azureSqlServer && azureSqlDatabase &&
                                  !azureSqlServer.includes('your-server') &&
                                  !azureSqlDatabase.includes('ScoutingDatabase'));

    // Local SQL envs
    const localSqlConnectionString = process.env.LOCAL_SQL_CONNECTION_STRING;
    const localSqlServer = process.env.LOCAL_SQL_SERVER;
    const localSqlDatabase = process.env.LOCAL_SQL_DATABASE;
    const localSqlUser = process.env.LOCAL_SQL_USER;
    const localSqlPassword = process.env.LOCAL_SQL_PASSWORD;
    const isLocalSqlConfigured = !!(localSqlConnectionString || (localSqlServer && localSqlDatabase));

    // Cosmos envs
    const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
    const cosmosKey = process.env.COSMOS_KEY;
    const cosmosDatabaseId = process.env.COSMOS_DATABASE_ID;
    const cosmosContainerId = process.env.COSMOS_CONTAINER_ID;

    // Firebase envs
    const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const firebaseDatabaseURL = process.env.FIREBASE_DATABASE_URL;

    // Choose provider: explicit env override first, then best-detect
    let selected: DatabaseProvider | null = null;
    if (envProvider === 'firebase' || envProvider === 'local' || envProvider === 'cosmos' || envProvider === 'azuresql') {
      selected = envProvider as DatabaseProvider;
    } else if (isAzureSqlConfigured) {
      selected = 'azuresql';
    } else if (cosmosEndpoint && cosmosKey) {
      selected = 'cosmos';
    } else if (firebaseServiceAccountPath || firebaseServiceAccountJson) {
      selected = 'firebase';
    } else if (isLocalSqlConfigured) {
      selected = 'local';
    } else {
      selected = 'local';
    }

    // Build config and instantiate service
    if (selected === 'azuresql') {
      this.config = {
        provider: 'azuresql',
        azuresql: (azureSqlServer && azureSqlDatabase) ? {
          server: azureSqlServer,
          database: azureSqlDatabase,
          user: useManagedIdentity ? undefined : azureSqlUser,
          password: useManagedIdentity ? undefined : azureSqlPassword,
          useManagedIdentity: useManagedIdentity
        } : {
          connectionString: azureSqlConnectionString,
          useManagedIdentity: false
        }
      };
      this.currentService = new AzureSqlDatabaseService(this.config.azuresql!);
    } else if (selected === 'cosmos') {
      this.config = { provider: 'cosmos', cosmos: { endpoint: cosmosEndpoint, key: cosmosKey, databaseId: cosmosDatabaseId, containerId: cosmosContainerId } };
      this.currentService = new CosmosDatabaseService(this.config.cosmos);
    } else if (selected === 'firebase') {
      const saJson = firebaseServiceAccountJson ? JSON.parse(firebaseServiceAccountJson) : undefined;
      this.config = { provider: 'firebase', firebase: { serviceAccountPath: firebaseServiceAccountPath, serviceAccountJson: saJson, databaseURL: firebaseDatabaseURL } } as DatabaseConfig;
      this.currentService = new FirebaseDatabaseService(this.config.firebase);
    } else if (selected === 'local') {
      this.config = {
        provider: 'local',
        local: localSqlConnectionString ? {
          connectionString: localSqlConnectionString
        } : {
          server: localSqlServer,
          database: localSqlDatabase,
          user: localSqlUser,
          password: localSqlPassword
        }
      };
      this.currentService = new LocalDatabaseService({
        connectionString: this.config.local?.connectionString,
        server: this.config.local?.server,
        database: this.config.local?.database,
        user: this.config.local?.user,
        password: this.config.local?.password,
        useManagedIdentity: false
      });
    } else {
      throw new Error('No supported database provider could be selected or detected');
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
    }
    if (config.provider === 'local' && config.local) {
      return new LocalDatabaseService({
        connectionString: config.local.connectionString,
        server: config.local.server,
        database: config.local.database,
        user: config.local.user,
        password: config.local.password,
        useManagedIdentity: false
      });
    }
    if (config.provider === 'firebase' && config.firebase) {
      return new FirebaseDatabaseService(config.firebase);
    }
    if (config.provider === 'cosmos' && config.cosmos) {
      return new CosmosDatabaseService(config.cosmos);
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
