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

The `get-bitcoin-price.ts` script fetches the current Bitcoin price using the CoinStats MCP server.

### How to Use

Run the script using one of these methods:

```bash
# Method 1: Using npx (recommended)
npx ts-node -T scripts/get-bitcoin-price.ts

# Method 2: Using npm script (if configured)
npm run bitcoin-price
```

### Features

✅ **Real-time Bitcoin Data** - Fetches current price from CoinStats API  
✅ **Comprehensive Information** - Shows price, market cap, volume, and rank  
✅ **Price Change Tracking** - Displays 1h, 24h, and 7d price changes  
✅ **Formatted Output** - Clean, easy-to-read display format

### Example Output

```
🔍 Fetching Bitcoin price from CoinStats MCP Server...

📊 Bitcoin (BTC) Price Information:
=====================================
Price:           $67,500.25
Market Cap:      $1325.00B
24h Volume:      $28.50B
Rank:            #1
-------------------------------------
Price Changes:
  1 Hour:        +0.45%
  24 Hours:      +2.3%
  7 Days:        +5.8%
=====================================

✅ Price fetch complete!
```

### CoinStats MCP Server Integration

This script uses the **CoinStats Model Context Protocol (MCP)** server to fetch cryptocurrency data. The MCP server provides several tools:

1. **coinstats-mcp-get-coin-by-id** - Get detailed information about a specific coin
2. **coinstats-mcp-get-coins** - Get comprehensive data about multiple cryptocurrencies
3. **coinstats-mcp-get-coin-chart-by-id** - Get historical price chart data

#### How It Works

- The script connects to the CoinStats API through the MCP server
- Bitcoin is identified by the coin ID `"bitcoin"`
- The API returns real-time price, market cap, volume, and price change data
- Data is formatted and displayed in a user-friendly format

#### Configuration

To use this script with real data, ensure the CoinStats MCP server is properly configured. See the comments in `get-bitcoin-price.ts` for integration details.

### Use Cases

- **Quick Price Check** - Get Bitcoin price without leaving the terminal
- **Integration Testing** - Verify CoinStats MCP server connectivity
- **Data Monitoring** - Track Bitcoin price changes over time
- **API Examples** - Reference implementation for CoinStats integration
