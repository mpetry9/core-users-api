# Database Migrations

This directory contains SQL migration files for the database schema.

## Migration Files

### Initial Schema (`000_initial_schema.sql`)

**Purpose:** Creates the complete database schema for fresh installations (e.g., CI/CD pipelines, new environments).

This file creates both tables with the full schema:

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

All necessary indexes and constraints are included for optimal performance and data integrity.

### Authentication Migration (`001_add_authentication.sql`)

**Purpose:** Adds authentication support to an existing users table.

- Adds `password_hash` column to users table (if not exists)
- Creates api_keys table (if not exists)
- For incremental updates on existing databases

**Rollback:** Use `001_add_authentication_rollback.sql` to revert changes.

## Usage

### For Fresh Database (CI/CD, New Environments)

```bash
psql -d your_database -f migrations/000_initial_schema.sql
```

### For Existing Database (Adding Authentication)

```bash
psql -d your_database -f migrations/001_add_authentication.sql
```

## ✅ Production Note

The production database tables were created directly via Neon MCP Server with the proper schema.

## Notes

- Always backup your database before running migrations
- Test migrations in a development environment first
- The password_hash column is nullable to support existing users
- API keys are stored as SHA-256 hashes for security
