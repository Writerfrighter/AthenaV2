import { DatabaseService } from './database-service';
import { PitEntry, MatchEntry, CustomEvent, AzureSqlConfig, PitEntryRow, MatchEntryRow, CustomEventRow, CompetitionType } from './types';

export class AzureSqlDatabaseService implements DatabaseService {
  private pool: import('mssql').ConnectionPool | null = null;
  private config: AzureSqlConfig;
  private tokenExpiresAt: Date | null = null;

  constructor(config: AzureSqlConfig) {
    this.config = config;
  }

  public async getPool(): Promise<import('mssql').ConnectionPool> {
    // Check if we need to refresh the token for managed identity
    if (this.pool && this.config.useManagedIdentity && this.isTokenExpired()) {
      console.log('Azure SQL token expired, refreshing connection pool...');
      await this.closePool();
    }

    if (this.pool) {
      return this.pool;
    }

    const mssql = await import('mssql');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config: any;

    if (this.config.connectionString) {
      config = {
        connectionString: this.config.connectionString
      };
    } else if (this.config.useManagedIdentity) {
      // Use managed identity authentication
      const { DefaultAzureCredential } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      const token = await credential.getToken('https://database.windows.net/.default');

      if (!this.config.server || !this.config.database) {
        throw new Error('Server and database are required for managed identity authentication');
      }

      // Store token expiration time (subtract 5 minutes for safety buffer)
      this.tokenExpiresAt = new Date(token.expiresOnTimestamp - 300000);
      console.log('Azure SQL: New token acquired, expires at:', this.tokenExpiresAt);

      config = {
        server: this.config.server,
        database: this.config.database,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        authentication: {
          type: 'azure-active-directory-access-token',
          options: {
            token: token.token
          }
        }
      };
    } else {
      if (!this.config.server || !this.config.database) {
        throw new Error('Server and database are required for username/password authentication');
      }

      config = {
        server: this.config.server,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      };
    }

    try {
      this.pool = await mssql.connect(config);
      console.log('Azure SQL: Connection pool created successfully');
      await this.initializeTables();
      return this.pool;
    } catch (error) {
      console.error('Azure SQL: Failed to create connection pool:', error);
      this.pool = null;
      this.tokenExpiresAt = null;
      throw error;
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    return new Date() >= this.tokenExpiresAt;
  }

  private async closePool(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
        console.log('Azure SQL: Connection pool closed');
      } catch (error) {
        console.error('Azure SQL: Error closing connection pool:', error);
      }
      this.pool = null;
      this.tokenExpiresAt = null;
    }
  }

  private async initializeTables(): Promise<void> {
    const pool = await this.getPool();

    // Create users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255),
        username NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'scout',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create pitEntries table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pitEntries' AND xtype='U')
      CREATE TABLE pitEntries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        teamNumber INT NOT NULL,
        year INT NOT NULL,
        competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
        driveTrain NVARCHAR(50) NOT NULL,
        weight DECIMAL(10,2) NOT NULL,
        length DECIMAL(10,2) NOT NULL,
        width DECIMAL(10,2) NOT NULL,
        eventName NVARCHAR(255),
        eventCode NVARCHAR(50),
        userId NVARCHAR(255),
        gameSpecificData NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create matchEntries table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='matchEntries' AND xtype='U')
      CREATE TABLE matchEntries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        matchNumber INT NOT NULL,
        teamNumber INT NOT NULL,
        year INT NOT NULL,
        competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
        alliance NVARCHAR(10) NOT NULL,
        alliancePosition INT,
        eventName NVARCHAR(255),
        eventCode NVARCHAR(50),
        userId NVARCHAR(255),
        gameSpecificData NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        timestamp DATETIME2 NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create customEvents table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customEvents' AND xtype='U')
      CREATE TABLE customEvents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        eventCode NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        endDate DATE,
        matchCount INT NOT NULL DEFAULT 0,
        location NVARCHAR(255),
        region NVARCHAR(100),
        year INT NOT NULL,
        competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create scoutingBlocks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='scoutingBlocks' AND xtype='U')
      CREATE TABLE scoutingBlocks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        eventCode NVARCHAR(50) NOT NULL,
        year INT NOT NULL,
        blockNumber INT NOT NULL,
        startMatch INT NOT NULL,
        endMatch INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        UNIQUE(eventCode, year, blockNumber)
      )
    `);

    // Create blockAssignments table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='blockAssignments' AND xtype='U')
      CREATE TABLE blockAssignments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        blockId INT NOT NULL,
        userId NVARCHAR(255) NOT NULL,
        alliance NVARCHAR(10) NOT NULL,
        position INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (blockId) REFERENCES scoutingBlocks(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(blockId, alliance, position)
      )
    `);

    // Add preferredPartners column to users table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'preferredPartners')
      ALTER TABLE users ADD preferredPartners NVARCHAR(MAX)
    `);
  }

  // Pit scouting methods
  async addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('teamNumber', mssql.Int, entry.teamNumber)
      .input('year', mssql.Int, entry.year)
      .input('competitionType', mssql.NVarChar, entry.competitionType)
      .input('driveTrain', mssql.NVarChar, entry.driveTrain)
      .input('weight', mssql.Decimal(10, 2), entry.weight)
      .input('length', mssql.Decimal(10, 2), entry.length)
      .input('width', mssql.Decimal(10, 2), entry.width)
      .input('eventName', mssql.NVarChar, entry.eventName)
      .input('eventCode', mssql.NVarChar, entry.eventCode)
      .input('userId', mssql.NVarChar, entry.userId || null)
      .input('gameSpecificData', mssql.NVarChar, JSON.stringify(entry.gameSpecificData))
      .query(`
        INSERT INTO pitEntries (teamNumber, year, competitionType, driveTrain, weight, length, width, eventName, eventCode, userId, gameSpecificData)
        OUTPUT INSERTED.id
        VALUES (@teamNumber, @year, @competitionType, @driveTrain, @weight, @length, @width, @eventName, @eventCode, @userId, @gameSpecificData)
      `);

    return result.recordset[0].id;
  }

  async getPitEntry(teamNumber: number, year: number, competitionType?: CompetitionType): Promise<PitEntry | undefined> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM pitEntries WHERE teamNumber = @teamNumber AND year = @year';
    let request = pool.request()
      .input('teamNumber', mssql.Int, teamNumber)
      .input('year', mssql.Int, year);
    
    if (competitionType) {
      query += ' AND competitionType = @competitionType';
      request = request.input('competitionType', mssql.NVarChar, competitionType);
    }
    
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return undefined;
    }

    const row = result.recordset[0] as PitEntryRow;
    return {
      id: row.id,
      teamNumber: row.teamNumber,
      year: row.year,
      competitionType: (row.competitionType || 'FRC') as CompetitionType,
      driveTrain: row.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
      weight: row.weight,
      length: row.length,
      width: row.width,
      eventName: row.eventName || undefined,
      eventCode: row.eventCode || undefined,
      userId: row.userId || undefined,
      gameSpecificData: JSON.parse(row.gameSpecificData),
    };
  }

  async getAllPitEntries(year?: number, eventCode?: string, competitionType?: CompetitionType): Promise<PitEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM pitEntries';
    let request = pool.request();
    const conditions: string[] = [];

    if (year !== undefined) {
      conditions.push('year = @year');
      request = request.input('year', mssql.Int, year);
    }

    if (eventCode !== undefined) {
      conditions.push('eventCode = @eventCode');
      request = request.input('eventCode', mssql.NVarChar, eventCode);
    }

    if (competitionType !== undefined) {
      conditions.push('competitionType = @competitionType');
      request = request.input('competitionType', mssql.NVarChar, competitionType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await request.query(query);

    return result.recordset.map((row: PitEntryRow) => {
      const pitRow = row as unknown as PitEntryRow;
      return {
        id: pitRow.id,
        teamNumber: pitRow.teamNumber,
        year: pitRow.year,
        competitionType: (pitRow.competitionType || 'FRC') as CompetitionType,
        driveTrain: pitRow.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
        weight: pitRow.weight,
        length: pitRow.length,
        width: pitRow.width,
        eventName: pitRow.eventName || undefined,
        eventCode: pitRow.eventCode || undefined,
        userId: pitRow.userId || undefined,
        gameSpecificData: JSON.parse(pitRow.gameSpecificData),
      };
    });
  }

  async updatePitEntry(id: number, updates: Partial<PitEntry>): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const setParts: string[] = [];
    const request = pool.request().input('id', mssql.Int, id);

    if (updates.teamNumber !== undefined) {
      setParts.push('teamNumber = @teamNumber');
      request.input('teamNumber', mssql.Int, updates.teamNumber);
    }
    if (updates.year !== undefined) {
      setParts.push('year = @year');
      request.input('year', mssql.Int, updates.year);
    }
    if (updates.driveTrain !== undefined) {
      setParts.push('driveTrain = @driveTrain');
      request.input('driveTrain', mssql.NVarChar, updates.driveTrain);
    }
    if (updates.weight !== undefined) {
      setParts.push('weight = @weight');
      request.input('weight', mssql.Decimal(10, 2), updates.weight);
    }
    if (updates.length !== undefined) {
      setParts.push('length = @length');
      request.input('length', mssql.Decimal(10, 2), updates.length);
    }
    if (updates.width !== undefined) {
      setParts.push('width = @width');
      request.input('width', mssql.Decimal(10, 2), updates.width);
    }
    if (updates.eventName !== undefined) {
      setParts.push('eventName = @eventName');
      request.input('eventName', mssql.NVarChar, updates.eventName);
    }
    if (updates.eventCode !== undefined) {
      setParts.push('eventCode = @eventCode');
      request.input('eventCode', mssql.NVarChar, updates.eventCode);
    }
    if (updates.gameSpecificData !== undefined) {
      setParts.push('gameSpecificData = @gameSpecificData');
      request.input('gameSpecificData', mssql.NVarChar, JSON.stringify(updates.gameSpecificData));
    }

    if (setParts.length > 0) {
      const query = `UPDATE pitEntries SET ${setParts.join(', ')} WHERE id = @id`;
      await request.query(query);
    }
  }

  async deletePitEntry(id: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('id', mssql.Int, id)
      .query('DELETE FROM pitEntries WHERE id = @id');
  }

  async checkPitScoutExists(teamNumber: number, eventCode: string): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const mssql = await import('mssql');
      const result = await pool.request()
        .input('teamNumber', mssql.Int, teamNumber)
        .input('eventCode', mssql.NVarChar, eventCode)
        .query(`
          SELECT COUNT(*) as count 
          FROM pitEntries 
          WHERE teamNumber = @teamNumber AND eventCode = @eventCode
        `);
      
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Error checking pit scout existence:', error);
      throw error;
    }
  }

  // Match scouting methods
  async addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('matchNumber', mssql.Int, entry.matchNumber)
      .input('teamNumber', mssql.Int, entry.teamNumber)
      .input('year', mssql.Int, entry.year)
      .input('competitionType', mssql.NVarChar, entry.competitionType)
      .input('alliance', mssql.NVarChar, entry.alliance)
      .input('alliancePosition', mssql.Int, entry.alliancePosition || null)
      .input('eventName', mssql.NVarChar, entry.eventName)
      .input('eventCode', mssql.NVarChar, entry.eventCode)
      .input('userId', mssql.NVarChar, entry.userId || null)
      .input('gameSpecificData', mssql.NVarChar, JSON.stringify(entry.gameSpecificData))
      .input('notes', mssql.NVarChar, entry.notes)
      .input('timestamp', mssql.DateTime2, entry.timestamp)
      .query(`
        INSERT INTO matchEntries (matchNumber, teamNumber, year, competitionType, alliance, alliancePosition, eventName, eventCode, userId, gameSpecificData, notes, timestamp)
        OUTPUT INSERTED.id
        VALUES (@matchNumber, @teamNumber, @year, @competitionType, @alliance, @alliancePosition, @eventName, @eventCode, @userId, @gameSpecificData, @notes, @timestamp)
      `);

    return result.recordset[0].id;
  }

  async getMatchEntries(teamNumber: number, year?: number, competitionType?: CompetitionType): Promise<MatchEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM matchEntries WHERE teamNumber = @teamNumber';
    let request = pool.request().input('teamNumber', mssql.Int, teamNumber);

    if (year !== undefined) {
      query += ' AND year = @year';
      request = request.input('year', mssql.Int, year);
    }

    if (competitionType !== undefined) {
      query += ' AND competitionType = @competitionType';
      request = request.input('competitionType', mssql.NVarChar, competitionType);
    }

    const result = await request.query(query);

    return result.recordset.map((row: MatchEntryRow) => {
      const matchRow = row as unknown as MatchEntryRow;
      return {
        id: matchRow.id,
        matchNumber: matchRow.matchNumber,
        teamNumber: matchRow.teamNumber,
        year: matchRow.year,
        competitionType: (matchRow.competitionType || 'FRC') as CompetitionType,
        alliance: matchRow.alliance as 'red' | 'blue',
        alliancePosition: matchRow.alliancePosition || undefined,
        eventName: matchRow.eventName || undefined,
        eventCode: matchRow.eventCode || undefined,
        userId: matchRow.userId || undefined,
        gameSpecificData: JSON.parse(matchRow.gameSpecificData),
        notes: matchRow.notes,
        timestamp: matchRow.timestamp,
      };
    });
  }

  async getAllMatchEntries(year?: number, eventCode?: string, competitionType?: CompetitionType): Promise<MatchEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM matchEntries';
    let request = pool.request();
    const conditions: string[] = [];

    if (year !== undefined) {
      conditions.push('year = @year');
      request = request.input('year', mssql.Int, year);
    }

    if (eventCode !== undefined) {
      conditions.push('eventCode = @eventCode');
      request = request.input('eventCode', mssql.NVarChar, eventCode);
    }

    if (competitionType !== undefined) {
      conditions.push('competitionType = @competitionType');
      request = request.input('competitionType', mssql.NVarChar, competitionType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await request.query(query);

    return result.recordset.map((row: MatchEntryRow) => {
      const matchRow = row as unknown as MatchEntryRow;
      return {
        id: matchRow.id,
        matchNumber: matchRow.matchNumber,
        teamNumber: matchRow.teamNumber,
        year: matchRow.year,
        competitionType: (matchRow.competitionType || 'FRC') as CompetitionType,
        alliance: matchRow.alliance as 'red' | 'blue',
        alliancePosition: matchRow.alliancePosition || undefined,
        eventName: matchRow.eventName || undefined,
        eventCode: matchRow.eventCode || undefined,
        userId: matchRow.userId || undefined,
        gameSpecificData: JSON.parse(matchRow.gameSpecificData),
        notes: matchRow.notes,
        timestamp: matchRow.timestamp,
      };
    });
  }

  async updateMatchEntry(id: number, updates: Partial<MatchEntry>): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const setParts: string[] = [];
    const request = pool.request().input('id', mssql.Int, id);

    if (updates.matchNumber !== undefined) {
      setParts.push('matchNumber = @matchNumber');
      request.input('matchNumber', mssql.Int, updates.matchNumber);
    }
    if (updates.teamNumber !== undefined) {
      setParts.push('teamNumber = @teamNumber');
      request.input('teamNumber', mssql.Int, updates.teamNumber);
    }
    if (updates.year !== undefined) {
      setParts.push('year = @year');
      request.input('year', mssql.Int, updates.year);
    }
    if (updates.alliance !== undefined) {
      setParts.push('alliance = @alliance');
      request.input('alliance', mssql.NVarChar, updates.alliance);
    }
    if (updates.alliancePosition !== undefined) {
      setParts.push('alliancePosition = @alliancePosition');
      request.input('alliancePosition', mssql.Int, updates.alliancePosition);
    }
    if (updates.eventName !== undefined) {
      setParts.push('eventName = @eventName');
      request.input('eventName', mssql.NVarChar, updates.eventName);
    }
    if (updates.eventCode !== undefined) {
      setParts.push('eventCode = @eventCode');
      request.input('eventCode', mssql.NVarChar, updates.eventCode);
    }
    if (updates.gameSpecificData !== undefined) {
      setParts.push('gameSpecificData = @gameSpecificData');
      request.input('gameSpecificData', mssql.NVarChar, JSON.stringify(updates.gameSpecificData));
    }
    if (updates.notes !== undefined) {
      setParts.push('notes = @notes');
      request.input('notes', mssql.NVarChar, updates.notes);
    }
    if (updates.timestamp !== undefined) {
      setParts.push('timestamp = @timestamp');
      request.input('timestamp', mssql.DateTime2, updates.timestamp);
    }

    if (setParts.length > 0) {
      const query = `UPDATE matchEntries SET ${setParts.join(', ')} WHERE id = @id`;
      await request.query(query);
    }
  }

  async deleteMatchEntry(id: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('id', mssql.Int, id)
      .query('DELETE FROM matchEntries WHERE id = @id');
  }

  async checkMatchScoutExists(teamNumber: number, matchNumber: number, eventCode: string): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const mssql = await import('mssql');
      const result = await pool.request()
        .input('teamNumber', mssql.Int, teamNumber)
        .input('matchNumber', mssql.Int, matchNumber)
        .input('eventCode', mssql.NVarChar, eventCode)
        .query(`
          SELECT COUNT(*) as count 
          FROM matchEntries 
          WHERE teamNumber = @teamNumber 
            AND matchNumber = @matchNumber 
            AND eventCode = @eventCode
        `);
      
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Error checking match scout existence:', error);
      throw error;
    }
  }

  // Custom events
  async addCustomEvent(event: Omit<CustomEvent, 'id'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('eventCode', mssql.NVarChar, event.eventCode)
      .input('name', mssql.NVarChar, event.name)
      .input('date', mssql.Date, event.date)
      .input('endDate', mssql.Date, event.endDate || null)
      .input('matchCount', mssql.Int, event.matchCount)
      .input('location', mssql.NVarChar, event.location || null)
      .input('region', mssql.NVarChar, event.region || null)
      .input('year', mssql.Int, event.year)
      .input('competitionType', mssql.NVarChar, event.competitionType)
      .query(`
        INSERT INTO customEvents (eventCode, name, date, endDate, matchCount, location, region, year, competitionType)
        OUTPUT INSERTED.id
        VALUES (@eventCode, @name, @date, @endDate, @matchCount, @location, @region, @year, @competitionType)
      `);

    return result.recordset[0].id;
  }

  async getCustomEvent(eventCode: string, competitionType?: CompetitionType): Promise<CustomEvent | undefined> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM customEvents WHERE eventCode = @eventCode';
    let request = pool.request()
      .input('eventCode', mssql.NVarChar, eventCode);
    
    if (competitionType) {
      query += ' AND competitionType = @competitionType';
      request = request.input('competitionType', mssql.NVarChar, competitionType);
    }
    
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return undefined;
    }

    const row: CustomEventRow = result.recordset[0];
    return {
      id: row.id,
      eventCode: row.eventCode,
      name: row.name,
      date: row.date,
      endDate: row.endDate || undefined,
      matchCount: row.matchCount,
      location: row.location || undefined,
      region: row.region || undefined,
      year: row.year,
      competitionType: (row.competitionType || 'FRC') as CompetitionType
    };
  }

  async getAllCustomEvents(year?: number, competitionType?: CompetitionType): Promise<CustomEvent[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM customEvents';
    const request = pool.request();
    const conditions: string[] = [];

    if (year !== undefined) {
      conditions.push('year = @year');
      request.input('year', mssql.Int, year);
    }

    if (competitionType !== undefined) {
      conditions.push('competitionType = @competitionType');
      request.input('competitionType', mssql.NVarChar, competitionType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    const result = await request.query(query);

    return result.recordset.map((row: CustomEventRow) => ({
      id: row.id,
      eventCode: row.eventCode,
      name: row.name,
      date: row.date,
      endDate: row.endDate || undefined,
      matchCount: row.matchCount,
      location: row.location || undefined,
      region: row.region || undefined,
      year: row.year,
      competitionType: (row.competitionType || 'FRC') as CompetitionType
    }));
  }

  async updateCustomEvent(eventCode: string, updates: Partial<CustomEvent>): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const request = pool.request()
      .input('eventCode', mssql.NVarChar, eventCode);

    const setParts: string[] = [];
    const validFields = ['name', 'date', 'endDate', 'matchCount', 'location', 'region', 'year'];

    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        const paramName = `@${key}`;
        setParts.push(`${key} = ${paramName}`);
        request.input(key, key === 'date' || key === 'endDate' ? mssql.Date : 
                     key === 'matchCount' || key === 'year' ? mssql.Int : mssql.NVarChar, value);
      }
    }

    if (setParts.length === 0) {
      return; // Nothing to update
    }

    const query = `UPDATE customEvents SET ${setParts.join(', ')} WHERE eventCode = @eventCode`;
    await request.query(query);
  }

  async deleteCustomEvent(eventCode: string): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('eventCode', mssql.NVarChar, eventCode)
      .query('DELETE FROM customEvents WHERE eventCode = @eventCode');
  }

  // Scouting block methods
  async addScoutingBlock(block: Omit<import('./types').ScoutingBlock, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('eventCode', mssql.NVarChar, block.eventCode)
      .input('year', mssql.Int, block.year)
      .input('blockNumber', mssql.Int, block.blockNumber)
      .input('startMatch', mssql.Int, block.startMatch)
      .input('endMatch', mssql.Int, block.endMatch)
      .query(`
        INSERT INTO scoutingBlocks (eventCode, year, blockNumber, startMatch, endMatch)
        OUTPUT INSERTED.id
        VALUES (@eventCode, @year, @blockNumber, @startMatch, @endMatch)
      `);

    return result.recordset[0].id;
  }

  async getScoutingBlock(id: number): Promise<import('./types').ScoutingBlock | undefined> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM scoutingBlocks WHERE id = @id');

    return result.recordset[0];
  }

  async getScoutingBlocks(eventCode: string, year: number): Promise<import('./types').ScoutingBlock[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('eventCode', mssql.NVarChar, eventCode)
      .input('year', mssql.Int, year)
      .query('SELECT * FROM scoutingBlocks WHERE eventCode = @eventCode AND year = @year ORDER BY blockNumber');

    return result.recordset;
  }

  async updateScoutingBlock(id: number, updates: Partial<import('./types').ScoutingBlock>): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const request = pool.request();

    const setParts: string[] = [];
    if (updates.blockNumber !== undefined) {
      request.input('blockNumber', mssql.Int, updates.blockNumber);
      setParts.push('blockNumber = @blockNumber');
    }
    if (updates.startMatch !== undefined) {
      request.input('startMatch', mssql.Int, updates.startMatch);
      setParts.push('startMatch = @startMatch');
    }
    if (updates.endMatch !== undefined) {
      request.input('endMatch', mssql.Int, updates.endMatch);
      setParts.push('endMatch = @endMatch');
    }

    if (setParts.length === 0) return;

    setParts.push('updated_at = GETDATE()');
    request.input('id', mssql.Int, id);

    const query = `UPDATE scoutingBlocks SET ${setParts.join(', ')} WHERE id = @id`;
    await request.query(query);
  }

  async deleteScoutingBlock(id: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('id', mssql.Int, id)
      .query('DELETE FROM scoutingBlocks WHERE id = @id');
  }

  async deleteScoutingBlocksByEvent(eventCode: string, year: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('eventCode', mssql.NVarChar, eventCode)
      .input('year', mssql.Int, year)
      .query('DELETE FROM scoutingBlocks WHERE eventCode = @eventCode AND year = @year');
  }

  // Block assignment methods
  async addBlockAssignment(assignment: Omit<import('./types').BlockAssignment, 'id' | 'created_at'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('blockId', mssql.Int, assignment.blockId)
      .input('userId', mssql.NVarChar, assignment.userId)
      .input('alliance', mssql.NVarChar, assignment.alliance)
      .input('position', mssql.Int, assignment.position)
      .query(`
        INSERT INTO blockAssignments (blockId, userId, alliance, position)
        OUTPUT INSERTED.id
        VALUES (@blockId, @userId, @alliance, @position)
      `);

    return result.recordset[0].id;
  }

  async getBlockAssignment(id: number): Promise<import('./types').BlockAssignment | undefined> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM blockAssignments WHERE id = @id');

    return result.recordset[0];
  }

  async getBlockAssignments(blockId: number): Promise<import('./types').BlockAssignment[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('blockId', mssql.Int, blockId)
      .query('SELECT * FROM blockAssignments WHERE blockId = @blockId ORDER BY alliance, position');

    return result.recordset;
  }

  async getBlockAssignmentsByEvent(eventCode: string, year: number): Promise<import('./types').BlockAssignment[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('eventCode', mssql.NVarChar, eventCode)
      .input('year', mssql.Int, year)
      .query(`
        SELECT ba.* FROM blockAssignments ba
        INNER JOIN scoutingBlocks sb ON ba.blockId = sb.id
        WHERE sb.eventCode = @eventCode AND sb.year = @year
        ORDER BY sb.blockNumber, ba.alliance, ba.position
      `);

    return result.recordset;
  }

  async getBlockAssignmentsByUser(userId: string): Promise<import('./types').BlockAssignment[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('userId', mssql.NVarChar, userId)
      .query('SELECT * FROM blockAssignments WHERE userId = @userId');

    return result.recordset;
  }

  async updateBlockAssignment(id: number, updates: Partial<import('./types').BlockAssignment>): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const request = pool.request();

    const setParts: string[] = [];
    if (updates.userId !== undefined) {
      request.input('userId', mssql.NVarChar, updates.userId);
      setParts.push('userId = @userId');
    }
    if (updates.alliance !== undefined) {
      request.input('alliance', mssql.NVarChar, updates.alliance);
      setParts.push('alliance = @alliance');
    }
    if (updates.position !== undefined) {
      request.input('position', mssql.Int, updates.position);
      setParts.push('position = @position');
    }

    if (setParts.length === 0) return;

    request.input('id', mssql.Int, id);

    const query = `UPDATE blockAssignments SET ${setParts.join(', ')} WHERE id = @id`;
    await request.query(query);
  }

  async deleteBlockAssignment(id: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('id', mssql.Int, id)
      .query('DELETE FROM blockAssignments WHERE id = @id');
  }

  async deleteBlockAssignmentsByBlock(blockId: number): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    await pool.request()
      .input('blockId', mssql.Int, blockId)
      .query('DELETE FROM blockAssignments WHERE blockId = @blockId');
  }

  // Combined query for blocks with assignments
  async getScoutingBlocksWithAssignments(eventCode: string, year: number): Promise<import('./types').ScoutingBlockWithAssignments[]> {
    const blocks = await this.getScoutingBlocks(eventCode, year);
    const assignments = await this.getBlockAssignmentsByEvent(eventCode, year);

    return blocks.map(block => {
      const blockAssignments = assignments.filter(a => a.blockId === block.id);
      const redScouts: (string | null)[] = [null, null, null];
      const blueScouts: (string | null)[] = [null, null, null];

      blockAssignments.forEach(assignment => {
        if (assignment.alliance === 'red') {
          redScouts[assignment.position] = assignment.userId;
        } else {
          blueScouts[assignment.position] = assignment.userId;
        }
      });

      return {
        ...block,
        redScouts,
        blueScouts
      };
    });
  }

  // User preferred partners methods
  async updateUserPreferredPartners(userId: string, preferredPartners: string[]): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    await pool.request()
      .input('userId', mssql.NVarChar, userId)
      .input('preferredPartners', mssql.NVarChar, JSON.stringify(preferredPartners))
      .query('UPDATE users SET preferredPartners = @preferredPartners, updated_at = GETDATE() WHERE id = @userId');
  }

  async getUserPreferredPartners(userId: string): Promise<string[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    
    const result = await pool.request()
      .input('userId', mssql.NVarChar, userId)
      .query('SELECT preferredPartners FROM users WHERE id = @userId');

    if (result.recordset.length === 0 || !result.recordset[0].preferredPartners) {
      return [];
    }

    try {
      return JSON.parse(result.recordset[0].preferredPartners);
    } catch {
      return [];
    }
  }

  // Export/Import methods
  async exportData(year?: number): Promise<{pitEntries: PitEntry[], matchEntries: MatchEntry[]}> {
    const pitEntries = await this.getAllPitEntries(year);
    const matchEntries = await this.getAllMatchEntries(year);
    return { pitEntries, matchEntries };
  }

  async importData(data: {pitEntries: PitEntry[], matchEntries: MatchEntry[]}): Promise<void> {
    const pool = await this.getPool();
    const mssql = await import('mssql');

    // Clear existing data for the years being imported
    const years = new Set<number>();
    data.pitEntries.forEach(entry => years.add(entry.year));
    data.matchEntries.forEach(entry => years.add(entry.year));

    for (const year of years) {
      await pool.request()
        .input('year', mssql.Int, year)
        .query('DELETE FROM pitEntries WHERE year = @year');

      await pool.request()
        .input('year', mssql.Int, year)
        .query('DELETE FROM matchEntries WHERE year = @year');
    }

    // Import pit entries
    for (const entry of data.pitEntries) {
      await this.addPitEntry(entry);
    }

    // Import match entries
    for (const entry of data.matchEntries) {
      await this.addMatchEntry(entry);
    }
  }

  async resetDatabase(): Promise<void> {
    const pool = await this.getPool();
    
    // Clear all data from tables
    await pool.request().query('DELETE FROM pitEntries');
    await pool.request().query('DELETE FROM matchEntries');
    // await pool.request().query('DELETE FROM users');
    
    // Reset identity columns
    await pool.request().query('DBCC CHECKIDENT (pitEntries, RESEED, 0)');
    await pool.request().query('DBCC CHECKIDENT (matchEntries, RESEED, 0)');
  }

  // Optional sync methods (not implemented for Azure SQL)
  async syncToCloud?(): Promise<void> {
    // Not applicable for Azure SQL as it's already cloud-based
  }

  async syncFromCloud?(): Promise<void> {
    // Not applicable for Azure SQL as it's already cloud-based
  }
}
