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
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Pit scouting entries table
CREATE TABLE pitEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    teamNumber INT NOT NULL,
    year INT NOT NULL,
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
    alliance NVARCHAR(10) NOT NULL, -- 'red' or 'blue'
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
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);


