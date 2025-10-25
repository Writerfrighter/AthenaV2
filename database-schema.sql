-- Athena Scouting Database Schema
-- This schema defines all tables for the Athena FRC scouting application

-- User accounts table (username-only authentication)
CREATE TABLE users (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255),
    username NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'scout', -- 'admin', 'scout', 'coach'
    push_subscriptions NVARCHAR(MAX), -- JSON array of push subscription endpoints
    preferredPartners NVARCHAR(MAX), -- JSON array of user IDs for scheduling preferences
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Pit scouting entries table
CREATE TABLE pitEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    teamNumber INT NOT NULL,
    year INT NOT NULL,
    competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
    driveTrain NVARCHAR(50) NOT NULL, -- 'Swerve', 'Mecanum', 'Tank', 'Other'
    weight DECIMAL(10,2) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    eventName NVARCHAR(255),
    eventCode NVARCHAR(50),
    gameSpecificData NVARCHAR(MAX), -- JSON object with game-specific pit scouting data
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Match scouting entries table
CREATE TABLE matchEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    matchNumber INT NOT NULL,
    teamNumber INT NOT NULL,
    year INT NOT NULL,
    competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
    alliance NVARCHAR(10) NOT NULL, -- 'red' or 'blue'
    alliancePosition INT, -- 1, 2, or 3 for alliance position (Red 1, Red 2, Red 3, etc.)
    eventName NVARCHAR(255),
    eventCode NVARCHAR(50),
    gameSpecificData NVARCHAR(MAX), -- JSON object with game-specific match data
    notes NVARCHAR(MAX),
    timestamp DATETIME2 NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Custom events table for events not available on The Blue Alliance
CREATE TABLE customEvents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    eventCode NVARCHAR(50) UNIQUE NOT NULL, -- Unique identifier (e.g., '2025-custom-001')
    name NVARCHAR(255) NOT NULL, -- Display name
    date DATE NOT NULL, -- Event start date
    endDate DATE, -- Optional end date for multi-day events
    matchCount INT NOT NULL DEFAULT 0, -- Number of matches in the event
    location NVARCHAR(255), -- Optional location/city
    region NVARCHAR(100), -- Optional region/state
    year INT NOT NULL, -- FRC year
    competitionType NVARCHAR(10) DEFAULT 'FRC' NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Scouting blocks for organizing match assignments
CREATE TABLE scoutingBlocks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    eventCode NVARCHAR(50) NOT NULL,
    year INT NOT NULL,
    blockNumber INT NOT NULL, -- Block 1, Block 2, etc.
    startMatch INT NOT NULL, -- First match number in this block
    endMatch INT NOT NULL, -- Last match number in this block
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT uq_event_block UNIQUE (eventCode, year, blockNumber),
    CONSTRAINT chk_match_range CHECK (endMatch >= startMatch)
);

-- Scout assignments to blocks (not individual matches)
CREATE TABLE blockAssignments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    blockId INT NOT NULL,
    userId NVARCHAR(255) NOT NULL,
    alliance NVARCHAR(10) NOT NULL, -- 'red' or 'blue'
    position INT NOT NULL, -- 0, 1, or 2 (position in alliance)
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (blockId) REFERENCES scoutingBlocks(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_block_position UNIQUE (blockId, alliance, position),
    CONSTRAINT chk_alliance CHECK (alliance IN ('red', 'blue')),
    CONSTRAINT chk_position CHECK (position BETWEEN 0 AND 2)
);

-- Create indexes for performance
CREATE INDEX idx_scouting_blocks_event ON scoutingBlocks(eventCode, year);
CREATE INDEX idx_block_assignments_user ON blockAssignments(userId);
CREATE INDEX idx_block_assignments_block ON blockAssignments(blockId);
CREATE INDEX idx_pit_entries_competition ON pitEntries(competitionType, year);
CREATE INDEX idx_match_entries_competition ON matchEntries(competitionType, year);
CREATE INDEX idx_custom_events_competition ON customEvents(competitionType, year);


