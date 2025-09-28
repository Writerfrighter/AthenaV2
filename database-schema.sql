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

