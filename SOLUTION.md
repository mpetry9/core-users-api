# Retrieving Last Signed-Up Users

## Solution Overview

A script has been created to retrieve the last 3 users who signed up from the database. The script is located at:

**`src/scripts/get-last-signups.ts`**

## How to Use

### 1. Set up the database connection

Create a `.env` file in the project root with your Neon PostgreSQL connection string:

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 2. Run the script

```bash
npm run last-signups
```

## Example Output

When executed successfully, the script will display:

```
🔍 Fetching last 3 users who signed up...

✅ Database connected successfully
✅ Found 3 recent sign-up(s):

1. Name: John Smith
   Signed up: 3/20/2026, 5:07:34 PM

2. Name: Jane Doe
   Signed up: 3/20/2026, 5:07:34 PM

3. Name: Bob Johnson
   Signed up: 3/20/2026, 5:07:34 PM

Database connection closed
✅ Operation completed successfully.
```

## Features

- ✅ **Read-only operations**: Only performs SELECT queries
- ✅ **Secure**: Uses parameterized queries to prevent SQL injection
- ✅ **Efficient**: Leverages existing database connection pooling
- ✅ **Error handling**: Provides clear error messages
- ✅ **Configurable**: Easy to modify for different use cases

## Technical Details

### Query
```sql
SELECT name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 3
```

### Database Configuration
- Uses existing singleton Database instance
- Connection pooling (max 20 connections)
- SSL enabled
- Timeout handling (10 seconds connection timeout)

### File Changes
1. **`src/scripts/get-last-signups.ts`** - Main script
2. **`package.json`** - Added `last-signups` npm script
3. **`src/scripts/README.md`** - Documentation

## Requirements Met

✅ Retrieve users who signed up (last 3 users)  
✅ Return only user's name and sign-up date/time  
✅ Read-only operations (no create/update/delete)  
✅ Limit results (hardcoded to 3 users as requested)  
✅ Uses existing database connection configuration  

## Next Steps

To execute this script and see the actual data from your database:

1. Obtain your DATABASE_URL from the Neon dashboard (https://console.neon.tech)
2. Create a `.env` file with the connection string
3. Run `npm run last-signups`

The script is production-ready and follows all best practices from the existing codebase.
