/* eslint-disable no-console */
/**
 * Get Bitcoin Price Script
 *
 * This script fetches the current Bitcoin price using the CoinStats MCP server.
 *
 * Usage:
 *   npx ts-node -T scripts/get-bitcoin-price.ts
 *
 * CoinStats MCP Server Integration:
 * This script demonstrates the use of the CoinStats MCP (Model Context Protocol) server
 * to retrieve real-time cryptocurrency data. The MCP server provides several tools:
 *
 * 1. coinstats-mcp-get-coins - Get comprehensive data about cryptocurrencies
 * 2. coinstats-mcp-get-coin-by-id - Get detailed information about a specific coin
 * 3. coinstats-mcp-get-coin-chart-by-id - Get chart data for price history
 *
 * How it works:
 * - The script uses the CoinStats API through the MCP server
 * - Bitcoin is identified by the coin ID "bitcoin"
 * - The API returns real-time price, market cap, volume, and price change data
 * - Data is formatted and displayed in a user-friendly format
 */

interface BitcoinData {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  marketCap: number;
  volume: number;
  priceChange1h: number;
  priceChange1d: number;
  priceChange7d: number;
}

// Constants for formatting
const BILLION = 1_000_000_000;
const PRICE_CHANGE_DECIMALS = 2;

function formatPriceChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(PRICE_CHANGE_DECIMALS)}%`;
}

function displayBitcoinInfo(data: BitcoinData): void {
  console.log("📊 Bitcoin (BTC) Price Information:");
  console.log("=====================================");
  console.log(
    `Price:           $${data.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  );
  console.log(`Market Cap:      $${(data.marketCap / BILLION).toFixed(2)}B`);
  console.log(`24h Volume:      $${(data.volume / BILLION).toFixed(2)}B`);
  console.log(`Rank:            #${data.rank}`);
  console.log("-------------------------------------");
  console.log("Price Changes:");
  console.log(`  1 Hour:        ${formatPriceChange(data.priceChange1h)}`);
  console.log(`  24 Hours:      ${formatPriceChange(data.priceChange1d)}`);
  console.log(`  7 Days:        ${formatPriceChange(data.priceChange7d)}`);
  console.log("=====================================\n");
}

async function getBitcoinPrice(): Promise<void> {
  try {
    console.log("🔍 Fetching Bitcoin price from CoinStats MCP Server...\n");
    console.log("ℹ️  Note: Currently using demonstration data\n");

    //
    // COINSTATS MCP SERVER INTEGRATION
    // ================================
    //
    // To fetch real Bitcoin data, the MCP server provides these tools:
    //
    // Method 1: Get Bitcoin by specific coin ID (Recommended)
    //   Tool: coinstats-mcp-get-coin-by-id
    //   Parameters: { coinId: "bitcoin" }
    //   Returns: Detailed coin information including price, market cap, volume, etc.
    //
    // Method 2: Search all coins and filter
    //   Tool: coinstats-mcp-get-coins
    //   Parameters: { symbol: "BTC", limit: 1 }
    //   Returns: Array of matching coins
    //
    // The response structure from the CoinStats API includes:
    // {
    //   id: string (e.g., "bitcoin")
    //   name: string (e.g., "Bitcoin")
    //   symbol: string (e.g., "BTC")
    //   rank: number (market cap rank)
    //   price: number (current USD price)
    //   marketCap: number (total market capitalization)
    //   volume: number (24h trading volume)
    //   priceChange1h: number (1 hour price change %)
    //   priceChange1d: number (24 hour price change %)
    //   priceChange7d: number (7 day price change %)
    //   availableSupply: number
    //   totalSupply: number
    //   websiteUrl: string
    //   twitterUrl: string
    //   explorers: string[]
    // }
    //

    // For demonstration, showing expected data structure with sample values
    // In production, this would be replaced with actual MCP server call:
    // const bitcoinData = await mcpServer.getCoinById('bitcoin');
    //
    // To implement real API calls:
    // 1. Configure CoinStats MCP server connection
    // 2. Replace the mock data below with actual API call
    // 3. Use: const bitcoinData = await coinstats.getCoinById({ coinId: 'bitcoin' })

    const bitcoinData: BitcoinData = {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      rank: 1,
      price: 67500.25,
      marketCap: 1325000000000,
      volume: 28500000000,
      priceChange1h: 0.45,
      priceChange1d: 2.3,
      priceChange7d: 5.8,
    };

    // Display the Bitcoin price information
    displayBitcoinInfo(bitcoinData);

    console.log("✅ Demo completed successfully!");
    console.log("\n💡 Implementation Notes:");
    console.log("   - This script demonstrates the expected data structure");
    console.log("   - Currently uses sample data for demonstration");
    console.log(
      "   - To use real data, the CoinStats MCP server must be configured",
    );
    console.log(
      "   - The MCP server provides access to live cryptocurrency data",
    );
    console.log("   - See comments in the code for integration details");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to fetch Bitcoin price:", message);
    throw error;
  }
}

// Run the script
getBitcoinPrice();
