#!/bin/bash

echo "🔧 Setting up test database..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Start it with: brew services start postgresql"
    exit 1
fi

# Drop existing test database if it exists (to start fresh)
echo "Dropping existing test database if it exists..."
dropdb --if-exists core_users_test 2>/dev/null

# Create test database
echo "Creating test database..."
if createdb core_users_test; then
    echo -e "${GREEN}✅ Database 'core_users_test' created${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

# Apply migrations
echo "Applying migrations..."
if psql -d core_users_test -f migrations/001_add_authentication.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to apply migrations${NC}"
    exit 1
fi

# Verify tables
echo "Verifying tables..."
TABLE_COUNT=$(psql -d core_users_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✅ Database setup complete!${NC}"
    echo ""
    echo "Tables created:"
    psql -d core_users_test -c "\dt"
else
    echo -e "${RED}❌ Expected 2 tables, found $TABLE_COUNT${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Test database is ready!${NC}"
echo "Run tests with: npm test"