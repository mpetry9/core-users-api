# Retrieve Last 3 Database Users - Quick Start Guide

## Overview
This script connects to the PostgreSQL database and retrieves the last 3 users who signed up, displaying only their name and sign-up date/time.

## Prerequisites
- DATABASE_URL environment variable must be set
- Node.js and npm installed (already done)
- Dependencies installed (already done via `npm install`)

## Usage

### Option 1: Set Environment Variable Inline
```bash
DATABASE_URL="your_connection_string_here" npx ts-node get-recent-users.ts
```

### Option 2: Export Environment Variable
```bash
export DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
npx ts-node get-recent-users.ts
```

### Option 3: Create .env File
```bash
echo "DATABASE_URL=your_connection_string_here" > .env
npx ts-node get-recent-users.ts
```

## Script Features
✅ Connects to PostgreSQL using DATABASE_URL environment variable  
✅ Retrieves ONLY the last 3 users (ordered by created_at DESC)  
✅ Returns ONLY name and created_at fields  
✅ Includes 25-second connection timeout  
✅ Displays formatted output with both ISO and local time formats  
✅ Properly closes database connection  
✅ Read-only operation (no data modification)

## SQL Query Executed
```sql
SELECT name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 3
```

## Expected Output Example
```
🔌 Connecting to database...
✅ Database connected successfully

📊 Fetching last 3 users who signed up...

Found 3 user(s):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Name: Alice Johnson
   Sign-up Date/Time: 2026-03-21T14:32:18.523Z
   (Local: 3/21/2026, 2:32:18 PM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Name: Bob Smith
   Sign-up Date/Time: 2026-03-21T10:15:42.891Z
   (Local: 3/21/2026, 10:15:42 AM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Name: Carol Williams
   Sign-up Date/Time: 2026-03-20T17:07:34.014Z
   (Local: 3/20/2026, 5:07:34 PM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Query completed in 145ms

🔌 Database connection closed
```

## Error Handling
- ❌ If DATABASE_URL is not set: Script exits with error message
- ❌ If database connection fails: Displays connection error
- ❌ If query fails: Displays query error
- ⚠️ If query takes > 25s: Displays timeout warning
- ℹ️ If no users found: Displays "No users found" message

## Database Schema Reference
Table: `users`
- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `email` - VARCHAR(255) UNIQUE NOT NULL
- `status` - VARCHAR(50) DEFAULT 'active'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (indexed)
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## Files
- `get-recent-users.ts` - Main script file
- This README - Usage instructions

## Notes
- This is a READ-ONLY operation - no data will be modified
- The script automatically closes the database connection when done
- Connection includes SSL configuration for Neon PostgreSQL
- Timeout is set to 25 seconds to avoid long-running queries
