-- Initialize database for Docker environment
-- This file will be executed when PostgreSQL container starts

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ENGINEER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert a default admin user
INSERT INTO users (username, role) 
VALUES ('admin', 'MANAGER')
ON CONFLICT (username) DO NOTHING;