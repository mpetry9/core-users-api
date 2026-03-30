# Database Scripts

This directory contains utility scripts for managing the database and fetching cryptocurrency data.

## Seed Users Script

The `seed-users.ts` script allows you to easily populate your database with users.

### How to Use

1. **Edit the user data** in `scripts/seed-users.ts`:

```typescript
const users = [
  {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123", // Will be hashed automatically
    status: "active",
  },
  // Add more users here...
];
```

2. **Run the seed script**:

```bash
npm run seed
```

### Features

✅ **Automatic Password Hashing** - Passwords are automatically hashed with bcrypt  
✅ **Duplicate Detection** - Won't create users that already exist  
✅ **Error Handling** - Shows clear success/error messages for each user  
✅ **Summary Report** - Displays total user count after seeding

### Example Output

```
🌱 Starting user seeding...

✅ Created user: John Doe (john@example.com) - ID: 1
✅ Created user: Jane Smith (jane@example.com) - ID: 2
⚠️  User already exists: bob@example.com (ID: 3)

✨ Seeding complete! Total users in database: 3
```

### Tips

- **Add multiple users at once** by adding more objects to the `users` array
- **Run multiple times** - It's safe! Existing users won't be duplicated
- **Test credentials** - Use the seeded users to test login functionality
- **Custom status** - Set status to 'active', 'inactive', or any custom value

### After Seeding

You can login with any seeded user:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

## Get Bitcoin Price Script

The `get-bitcoin-price.ts` script demonstrates how to integrate with the CoinStats MCP server to fetch Bitcoin price data.

### How to Use

Run the script using one of these methods:

```bash
# Method 1: Using npx (recommended)
npx ts-node -T scripts/get-bitcoin-price.ts

# Method 2: Using npm script (if configured)
npm run bitcoin-price
```

### Features

✅ **Bitcoin Price Demonstration** - Shows integration pattern with CoinStats MCP server  
✅ **Comprehensive Information** - Displays price, market cap, volume, and rank  
✅ **Price Change Tracking** - Shows 1h, 24h, and 7d price changes  
✅ **Formatted Output** - Clean, easy-to-read display format  
✅ **Integration Example** - Demonstrates expected API response structure

### Example Output

```
🔍 Fetching Bitcoin price from CoinStats MCP Server...

ℹ️  Note: Currently using demonstration data

📊 Bitcoin (BTC) Price Information:
=====================================
Price:           $67,500.25
Market Cap:      $1325.00B
24h Volume:      $28.50B
Rank:            #1
-------------------------------------
Price Changes:
  1 Hour:        +0.45%
  24 Hours:      +2.30%
  7 Days:        +5.80%
=====================================

✅ Demo completed successfully!

💡 Implementation Notes:
   - This script demonstrates the expected data structure
   - Currently uses sample data for demonstration
   - To use real data, the CoinStats MCP server must be configured
   - The MCP server provides access to live cryptocurrency data
   - See comments in the code for integration details
```

### CoinStats MCP Server Integration

This script **demonstrates** how to integrate with the **CoinStats Model Context Protocol (MCP)** server. Currently, it uses sample data to show the expected structure and output format. The MCP server provides several tools for fetching live cryptocurrency data:

1. **coinstats-mcp-get-coin-by-id** - Get detailed information about a specific coin
2. **coinstats-mcp-get-coins** - Get comprehensive data about multiple cryptocurrencies
3. **coinstats-mcp-get-coin-chart-by-id** - Get historical price chart data

#### How It Works (When Connected to Real MCP Server)

- The script would connect to the CoinStats API through the MCP server
- Bitcoin is identified by the coin ID `"bitcoin"`
- The API returns real-time price, market cap, volume, and price change data
- Data is formatted and displayed in a user-friendly format

#### Configuration

**Current Status**: This script currently uses sample data for demonstration purposes. To integrate with real-time CoinStats data:

1. Configure the CoinStats MCP server connection
2. Update the script to call actual MCP server tools (see comments in `get-bitcoin-price.ts`)
3. The script shows the exact data structure expected from the API

See the comments in `get-bitcoin-price.ts` for detailed integration instructions.

### Use Cases

- **Integration Example** - Reference implementation for CoinStats MCP integration
- **Data Structure Demo** - Shows expected API response format
- **Quick Testing** - Verify script execution without API dependencies
- **Documentation** - Demonstrates how to display cryptocurrency data
