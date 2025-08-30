import { DatabaseService } from './database-service';
import { PitEntry, MatchEntry, AzureSqlConfig, PitEntryRow, MatchEntryRow } from './types';

export class AzureSqlDatabaseService implements DatabaseService {
  private pool: import('mssql').ConnectionPool | null = null;
  private config: AzureSqlConfig;

  constructor(config: AzureSqlConfig) {
    this.config = config;
  }

  public async getPool(): Promise<import('mssql').ConnectionPool> {
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
    } else {
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

    this.pool = await mssql.connect(config);
    await this.initializeTables();
    return this.pool;
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
        driveTrain NVARCHAR(50) NOT NULL,
        weight DECIMAL(10,2) NOT NULL,
        length DECIMAL(10,2) NOT NULL,
        width DECIMAL(10,2) NOT NULL,
        eventName NVARCHAR(255),
        eventCode NVARCHAR(50),
        gameSpecificData NVARCHAR(MAX)
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
        alliance NVARCHAR(10) NOT NULL,
        eventName NVARCHAR(255),
        eventCode NVARCHAR(50),
        gameSpecificData NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        timestamp DATETIME2 NOT NULL
      )
    `);
  }

  // Pit scouting methods
  async addPitEntry(entry: Omit<PitEntry, 'id'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('teamNumber', mssql.Int, entry.teamNumber)
      .input('year', mssql.Int, entry.year)
      .input('driveTrain', mssql.NVarChar, entry.driveTrain)
      .input('weight', mssql.Decimal(10, 2), entry.weight)
      .input('length', mssql.Decimal(10, 2), entry.length)
      .input('width', mssql.Decimal(10, 2), entry.width)
      .input('eventName', mssql.NVarChar, entry.eventName)
      .input('eventCode', mssql.NVarChar, entry.eventCode)
      .input('gameSpecificData', mssql.NVarChar, JSON.stringify(entry.gameSpecificData))
      .query(`
        INSERT INTO pitEntries (teamNumber, year, driveTrain, weight, length, width, eventName, eventCode, gameSpecificData)
        OUTPUT INSERTED.id
        VALUES (@teamNumber, @year, @driveTrain, @weight, @length, @width, @eventName, @eventCode, @gameSpecificData)
      `);

    return result.recordset[0].id;
  }

  async getPitEntry(teamNumber: number, year: number): Promise<PitEntry | undefined> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('teamNumber', mssql.Int, teamNumber)
      .input('year', mssql.Int, year)
      .query('SELECT * FROM pitEntries WHERE teamNumber = @teamNumber AND year = @year');

    if (result.recordset.length === 0) {
      return undefined;
    }

    const row = result.recordset[0] as PitEntryRow;
    return {
      id: row.id,
      teamNumber: row.teamNumber,
      year: row.year,
      driveTrain: row.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
      weight: row.weight,
      length: row.length,
      width: row.width,
      eventName: row.eventName || undefined,
      eventCode: row.eventCode || undefined,
      gameSpecificData: JSON.parse(row.gameSpecificData),
    };
  }

  async getAllPitEntries(year?: number): Promise<PitEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM pitEntries';
    let request = pool.request();

    if (year !== undefined) {
      query += ' WHERE year = @year';
      request = request.input('year', mssql.Int, year);
    }

    const result = await request.query(query);

    return result.recordset.map((row: PitEntryRow) => {
      const pitRow = row as unknown as PitEntryRow;
      return {
        id: pitRow.id,
        teamNumber: pitRow.teamNumber,
        year: pitRow.year,
        driveTrain: pitRow.driveTrain as "Swerve" | "Mecanum" | "Tank" | "Other",
        weight: pitRow.weight,
        length: pitRow.length,
        width: pitRow.width,
        eventName: pitRow.eventName || undefined,
        eventCode: pitRow.eventCode || undefined,
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

  // Match scouting methods
  async addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    const result = await pool.request()
      .input('matchNumber', mssql.Int, entry.matchNumber)
      .input('teamNumber', mssql.Int, entry.teamNumber)
      .input('year', mssql.Int, entry.year)
      .input('alliance', mssql.NVarChar, entry.alliance)
      .input('eventName', mssql.NVarChar, entry.eventName)
      .input('eventCode', mssql.NVarChar, entry.eventCode)
      .input('gameSpecificData', mssql.NVarChar, JSON.stringify(entry.gameSpecificData))
      .input('notes', mssql.NVarChar, entry.notes)
      .input('timestamp', mssql.DateTime2, entry.timestamp)
      .query(`
        INSERT INTO matchEntries (matchNumber, teamNumber, year, alliance, eventName, eventCode, gameSpecificData, notes, timestamp)
        OUTPUT INSERTED.id
        VALUES (@matchNumber, @teamNumber, @year, @alliance, @eventName, @eventCode, @gameSpecificData, @notes, @timestamp)
      `);

    return result.recordset[0].id;
  }

  async getMatchEntries(teamNumber: number, year?: number): Promise<MatchEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM matchEntries WHERE teamNumber = @teamNumber';
    let request = pool.request().input('teamNumber', mssql.Int, teamNumber);

    if (year !== undefined) {
      query += ' AND year = @year';
      request = request.input('year', mssql.Int, year);
    }

    const result = await request.query(query);

    return result.recordset.map((row: MatchEntryRow) => {
      const matchRow = row as unknown as MatchEntryRow;
      return {
        id: matchRow.id,
        matchNumber: matchRow.matchNumber,
        teamNumber: matchRow.teamNumber,
        year: matchRow.year,
        alliance: matchRow.alliance as 'red' | 'blue',
        eventName: matchRow.eventName || undefined,
        eventCode: matchRow.eventCode || undefined,
        gameSpecificData: JSON.parse(matchRow.gameSpecificData),
        notes: matchRow.notes,
        timestamp: matchRow.timestamp,
      };
    });
  }

  async getAllMatchEntries(year?: number): Promise<MatchEntry[]> {
    const pool = await this.getPool();
    const mssql = await import('mssql');
    let query = 'SELECT * FROM matchEntries';
    let request = pool.request();

    if (year !== undefined) {
      query += ' WHERE year = @year';
      request = request.input('year', mssql.Int, year);
    }

    const result = await request.query(query);

    return result.recordset.map((row: MatchEntryRow) => {
      const matchRow = row as unknown as MatchEntryRow;
      return {
        id: matchRow.id,
        matchNumber: matchRow.matchNumber,
        teamNumber: matchRow.teamNumber,
        year: matchRow.year,
        alliance: matchRow.alliance as 'red' | 'blue',
        eventName: matchRow.eventName || undefined,
        eventCode: matchRow.eventCode || undefined,
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

  // Optional sync methods (not implemented for Azure SQL)
  async syncToCloud?(): Promise<void> {
    // Not applicable for Azure SQL as it's already cloud-based
  }

  async syncFromCloud?(): Promise<void> {
    // Not applicable for Azure SQL as it's already cloud-based
  }
}
