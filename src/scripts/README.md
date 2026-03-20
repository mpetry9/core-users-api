# Database Scripts

This directory contains utility scripts for database operations.

## get-last-signups.ts

Retrieves the most recent users who signed up to the platform.

### Usage

```bash
npm run last-signups
```

### Prerequisites

1. **Database Connection**: You must have a valid `DATABASE_URL` environment variable set.
   
   Create a `.env` file in the project root with:
   ```env
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```

2. **Dependencies**: Install all dependencies first:
   ```bash
   npm install
   ```

### Output

The script will display:
- User name
- Sign-up date and time

Example output:
```
🔍 Fetching last 3 users who signed up...

✅ Database connected successfully
✅ Found 3 recent sign-up(s):

1. Name: John Doe
   Signed up: 3/20/2026, 2:30:15 PM

2. Name: Jane Smith
   Signed up: 3/19/2026, 10:15:42 AM

3. Name: Bob Johnson
   Signed up: 3/18/2026, 4:22:08 PM

Database connection closed
✅ Operation completed successfully.
```

### Features

- **Read-only**: This script only performs SELECT queries and does not modify any data
- **Configurable**: Currently hardcoded to retrieve the last 3 users (can be modified in the code)
- **Safe**: Uses parameterized queries to prevent SQL injection
- **Connection pooling**: Leverages the existing database connection pool configuration
- **Graceful error handling**: Provides clear error messages if the database connection fails

### Customization

To retrieve a different number of users, modify the limit parameter in the `getLastSignups()` function call in the script.
