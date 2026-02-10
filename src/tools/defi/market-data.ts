import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';
import { logger } from '../../utils/logger.js';

// Simple in-memory cache for market data
const marketCache = new Map<string, { data: unknown; expiresAt: number }>();

function getCachedMarket<T>(key: string): T | null {
  const entry = marketCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    marketCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCachedMarket<T>(key: string, data: T, ttlMs: number): void {
  marketCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ============================================================================
// Crypto Prices (CoinGecko free API)
// ============================================================================

const CryptoPricesInputSchema = z.object({
  tokens: z.string().describe('Comma-separated CoinGecko token IDs (e.g., "ethereum,usd-coin,bitcoin"). Max 10 tokens.'),
  include_24h_change: z.boolean().optional().describe('Include 24h price change percentage (default: true)'),
});

export const cryptoPrices = new DynamicStructuredTool({
  name: 'crypto_prices',
  description: 'Fetches current crypto prices from CoinGecko. Use CoinGecko IDs: ethereum, bitcoin, usd-coin, tether, wrapped-bitcoin, dai, etc. Returns USD price and optionally 24h change.',
  schema: CryptoPricesInputSchema,
  func: async (input) => {
    const tokenIds = input.tokens.split(',').map(t => t.trim()).slice(0, 10).join(',');
    const cacheKey = `prices:${tokenIds}`;

    const cached = getCachedMarket<unknown>(cacheKey);
    if (cached) return formatToolResult(cached, []);

    const params = new URLSearchParams({
      ids: tokenIds,
      vs_currencies: 'usd',
      include_24hr_change: String(input.include_24h_change !== false),
      include_market_cap: 'true',
    });

    const url = `https://api.coingecko.com/api/v3/simple/price?${params}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`CoinGecko API error: ${message}`);
      throw new Error(`CoinGecko API request failed: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    setCachedMarket(cacheKey, data, 30_000); // 30s cache

    return formatToolResult(data, [url]);
  },
});

// ============================================================================
// DeFi Protocol Data (DeFiLlama free API)
// ============================================================================

const DefiProtocolDataInputSchema = z.object({
  protocol: z.string().describe('Protocol slug on DeFiLlama (e.g., "aave", "morpho", "euler", "lido")'),
});

export const defiProtocolData = new DynamicStructuredTool({
  name: 'defi_protocol_data',
  description: 'Fetches protocol-level DeFi data from DeFiLlama including TVL, chain breakdown, and category. Use protocol slugs like: aave, morpho, euler, lido, compound, maker, uniswap.',
  schema: DefiProtocolDataInputSchema,
  func: async (input) => {
    const slug = input.protocol.toLowerCase();
    const cacheKey = `protocol:${slug}`;

    const cached = getCachedMarket<unknown>(cacheKey);
    if (cached) return formatToolResult(cached, []);

    const url = `https://api.llama.fi/protocol/${slug}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`DeFiLlama API error: ${message}`);
      throw new Error(`DeFiLlama API request failed: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }

    const raw = await response.json();

    // Extract key fields to keep response size manageable
    // tvl field is a historical array — get the latest value
    const latestTvl = Array.isArray(raw.tvl) && raw.tvl.length > 0
      ? raw.tvl[raw.tvl.length - 1]?.totalLiquidityUSD
      : raw.tvl;

    const data = {
      name: raw.name,
      symbol: raw.symbol,
      category: raw.category,
      tvl: latestTvl,
      chainTvls: raw.currentChainTvls,
      chains: raw.chains,
      url: raw.url,
      twitter: raw.twitter,
      description: raw.description,
      audits: raw.audits,
      audit_links: raw.audit_links,
    };

    setCachedMarket(cacheKey, data, 300_000); // 5 min cache

    return formatToolResult(data, [url]);
  },
});

// ============================================================================
// Gas Tracker (multi-chain via public RPC or etherscan-like APIs)
// ============================================================================

const GAS_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
  // For other chains, we use a simpler approach
};

const GasTrackerInputSchema = z.object({
  chain: z.string().optional().describe('Chain name (default: "ethereum"). Supported: ethereum'),
});

export const gasTracker = new DynamicStructuredTool({
  name: 'gas_tracker',
  description: 'Gets current gas prices for Ethereum. Returns low/average/high gas prices in Gwei.',
  schema: GasTrackerInputSchema,
  func: async (input) => {
    const chain = (input.chain || 'ethereum').toLowerCase();
    const cacheKey = `gas:${chain}`;

    const cached = getCachedMarket<unknown>(cacheKey);
    if (cached) return formatToolResult(cached, []);

    const url = GAS_ENDPOINTS[chain];
    if (!url) {
      return formatToolResult({ error: `Gas tracking not supported for chain: ${chain}. Supported: ethereum` }, []);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Gas tracker API request failed: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`Gas tracker API error: ${response.status} ${response.statusText}`);
    }

    const raw = await response.json();
    const result = raw.result || raw;

    const data = {
      chain,
      low: result.SafeGasPrice || result.low,
      average: result.ProposeGasPrice || result.average,
      high: result.FastGasPrice || result.fast,
      unit: 'Gwei',
    };

    setCachedMarket(cacheKey, data, 15_000); // 15s cache

    return formatToolResult(data, [url]);
  },
});
