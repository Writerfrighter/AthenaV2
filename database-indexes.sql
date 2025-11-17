-- Performance Optimization: Database Indexes
-- These indexes improve query performance for frequently accessed columns

-- Index for pitEntries table
-- Commonly queried by teamNumber, year, eventCode, and competitionType
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_pitEntries_teamNumber_year_competitionType' AND object_id = OBJECT_ID('pitEntries'))
CREATE NONCLUSTERED INDEX IX_pitEntries_teamNumber_year_competitionType 
ON pitEntries(teamNumber, year, competitionType);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_pitEntries_eventCode_year' AND object_id = OBJECT_ID('pitEntries'))
CREATE NONCLUSTERED INDEX IX_pitEntries_eventCode_year 
ON pitEntries(eventCode, year);

-- Index for matchEntries table
-- Commonly queried by teamNumber, year, eventCode, competitionType, and matchNumber
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_matchEntries_teamNumber_year_competitionType' AND object_id = OBJECT_ID('matchEntries'))
CREATE NONCLUSTERED INDEX IX_matchEntries_teamNumber_year_competitionType 
ON matchEntries(teamNumber, year, competitionType);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_matchEntries_eventCode_year' AND object_id = OBJECT_ID('matchEntries'))
CREATE NONCLUSTERED INDEX IX_matchEntries_eventCode_year 
ON matchEntries(eventCode, year);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_matchEntries_matchNumber' AND object_id = OBJECT_ID('matchEntries'))
CREATE NONCLUSTERED INDEX IX_matchEntries_matchNumber 
ON matchEntries(matchNumber);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_matchEntries_timestamp' AND object_id = OBJECT_ID('matchEntries'))
CREATE NONCLUSTERED INDEX IX_matchEntries_timestamp 
ON matchEntries(timestamp DESC);

-- Index for customEvents table
-- Commonly queried by eventCode, year, and competitionType
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_customEvents_eventCode_competitionType' AND object_id = OBJECT_ID('customEvents'))
CREATE NONCLUSTERED INDEX IX_customEvents_eventCode_competitionType 
ON customEvents(eventCode, competitionType);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_customEvents_year' AND object_id = OBJECT_ID('customEvents'))
CREATE NONCLUSTERED INDEX IX_customEvents_year 
ON customEvents(year);

-- Index for scoutingBlocks table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_scoutingBlocks_eventCode_year' AND object_id = OBJECT_ID('scoutingBlocks'))
CREATE NONCLUSTERED INDEX IX_scoutingBlocks_eventCode_year 
ON scoutingBlocks(eventCode, year);

-- Index for blockAssignments table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_blockAssignments_blockId' AND object_id = OBJECT_ID('blockAssignments'))
CREATE NONCLUSTERED INDEX IX_blockAssignments_blockId 
ON blockAssignments(blockId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_blockAssignments_userId' AND object_id = OBJECT_ID('blockAssignments'))
CREATE NONCLUSTERED INDEX IX_blockAssignments_userId 
ON blockAssignments(userId);

-- Index for users table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_username' AND object_id = OBJECT_ID('users'))
CREATE NONCLUSTERED INDEX IX_users_username 
ON users(username);
