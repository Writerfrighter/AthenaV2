-- User accounts table (username-only authentication)
CREATE TABLE users (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255),
    username NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'scout', -- 'admin', 'scout', 'coach'
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Team permissions (for multi-team support)
CREATE TABLE team_permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(255) NOT NULL,
    team_number INT NOT NULL,
    permission NVARCHAR(50) NOT NULL, -- 'read', 'write', 'admin'
    granted_by NVARCHAR(255),
    granted_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
