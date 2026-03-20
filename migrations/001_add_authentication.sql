-- Migration: Add Authentication Support
-- Description: Adds password_hash column to users table and creates api_keys table
-- Date: 2026-03-20

-- ============================================
-- 1. Add password_hash column to users table
-- ============================================
-- Adding password_hash as nullable to support existing users
-- In production, you may want to enforce password creation for existing users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;

-- Create index on email for faster lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. Create api_keys table
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Foreign key constraint
  CONSTRAINT fk_api_keys_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  
  -- Unique constraint on key_hash to prevent duplicates
  CONSTRAINT unique_key_hash UNIQUE (key_hash)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for authentication';
COMMENT ON TABLE api_keys IS 'Stores hashed API keys for programmatic access';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key (plaintext shown only once at creation)';
COMMENT ON COLUMN api_keys.name IS 'User-friendly name to identify the API key (e.g., "Production Server", "Testing")';
COMMENT ON COLUMN api_keys.last_used_at IS 'Timestamp of last successful authentication with this key';
COMMENT ON COLUMN api_keys.expires_at IS 'Optional expiration date for the API key';
COMMENT ON COLUMN api_keys.is_active IS 'Soft delete flag - allows revoking keys without deletion';
