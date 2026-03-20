# Database Migrations

This directory contains SQL migration files for the database schema.

## ✅ Tables Already Created!

The database tables have been created directly via Neon MCP Server with the proper schema:

**Users table:**

- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NULL)
- `status` (VARCHAR(50) DEFAULT 'active')
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**API Keys table:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER NOT NULL, FK to users)
- `key_hash` (VARCHAR(255) UNIQUE NOT NULL)
- `name` (VARCHAR(100) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `last_used_at` (TIMESTAMP NULL)
- `expires_at` (TIMESTAMP NULL)
- `is_active` (BOOLEAN DEFAULT true)

All necessary indexes have been created for optimal performance.

## Migration Files (For Reference)

The migration files are kept for reference and future schema changes:

- `001_add_authentication.sql` - Adds password_hash column to users table and creates api_keys table
- `001_add_authentication_rollback.sql` - Rolls back the authentication changes

## Notes

- Always backup your database before running migrations
- Test migrations in a development environment first
- The password_hash column is nullable to support existing users
- API keys are stored as SHA-256 hashes for security
