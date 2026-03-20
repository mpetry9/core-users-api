-- Rollback Migration: Remove Authentication Support
-- Description: Removes password_hash column and api_keys table
-- Date: 2026-03-20

-- ============================================
-- 1. Drop api_keys table
-- ============================================
DROP TABLE IF EXISTS api_keys CASCADE;

-- ============================================
-- 2. Remove password_hash column from users table
-- ============================================
ALTER TABLE users 
DROP COLUMN IF EXISTS password_hash;

-- ============================================
-- 3. Drop indexes
-- ============================================
DROP INDEX IF EXISTS idx_users_email;
