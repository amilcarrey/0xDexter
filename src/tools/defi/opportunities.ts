import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callTurtleApi } from './api.js';
import { formatToolResult } from '../types.js';

interface TurtleChain {
  id: string;
  name: string;
  slug: string;
  chainId: string;
  logoUrl: string;
  ecosystem: string;
  status: string;
  explorerUrl: string;
}

interface TurtleToken {
  id: string;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoUrl: string;
  isNative: boolean;
  chain: TurtleChain;
}

interface TurtleIncentive {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rewardType: 'points' | 'tokens' | 'yield' | 'vesting';
  rewardTypeName: string;
  apr: number;
  minApr: number | null;
  maxApr: number | null;
  status: 'active' | 'paused' | 'ended';
  fdvEstimate: number | null;
  tokenSupplyAllocation: number | null;
  estPriceUsd: number | null;
  indexed: boolean;
}

interface TurtleOpportunity {
  id: string;
  name: string;
  description: string;
  type: 'lending' | 'vault';
  tvl: number;
  estimatedApr: number;
  featured: boolean;
  minDepositAmountUsd: number;
  depositTokens: TurtleToken[];
  baseTokens: TurtleToken;
  receiptToken: TurtleToken;
  incentives: TurtleIncentive[];
}

const GetOpportunitiesInputSchema = z.object({
  chain_ids: z.string().optional().describe('Comma-separated chain IDs to filter by (e.g., "1,137" for Ethereum and Polygon)'),
  deposit_token: z.string().optional().describe('Filter by deposit token in "address-chainId" format'),
  tvl_greater_than: z.number().optional().describe('Minimum TVL threshold in USD'),
  token: z.string().optional().describe('Filter by deposit token symbol client-side (e.g., "USDC", "ETH")'),
  type: z.enum(['lending', 'vault']).optional().describe('Filter by opportunity type'),
  min_apr: z.number().optional().describe('Minimum estimated APR as percentage (e.g., 5 for 5%)'),
  sort_by: z.enum(['tvl', 'apr']).optional().describe('Sort results by TVL or APR (descending)'),
  limit: z.number().optional().describe('Maximum number of results to return'),
});

export const getOpportunities = new DynamicStructuredTool({
  name: 'get_opportunities',
  description: 'Fetches DeFi yield opportunities from Turtle protocol. Supports server-side filtering by chain IDs, deposit token, and TVL threshold, plus client-side filtering by token symbol, type, and minimum APR. Results can be sorted by TVL or APR.',
  schema: GetOpportunitiesInputSchema,
  func: async (input) => {
    // Build server-side query params
    const params: Record<string, string | number | undefined> = {};
    if (input.chain_ids) params.chainIds = input.chain_ids;
    if (input.deposit_token) params.depositToken = input.deposit_token;
    if (input.tvl_greater_than !== undefined) params.tvlGreaterThan = input.tvl_greater_than;

    const { data, url } = await callTurtleApi('/opportunities/', params);
    let opportunities = (data.opportunities || []) as TurtleOpportunity[];
    const total = data.total as number | undefined;

    // Client-side filters for params the API doesn't support
    if (input.token) {
      const token = input.token.toUpperCase();
      opportunities = opportunities.filter((o) =>
        o.depositTokens.some((t) => t.symbol.toUpperCase() === token)
      );
    }

    if (input.type) {
      opportunities = opportunities.filter((o) => o.type === input.type);
    }

    if (input.min_apr !== undefined) {
      opportunities = opportunities.filter((o) => o.estimatedApr >= input.min_apr!);
    }

    if (input.sort_by === 'tvl') {
      opportunities.sort((a, b) => b.tvl - a.tvl);
    } else if (input.sort_by === 'apr') {
      opportunities.sort((a, b) => b.estimatedApr - a.estimatedApr);
    }

    if (input.limit) {
      opportunities = opportunities.slice(0, input.limit);
    }

    return formatToolResult({ opportunities, total }, [url]);
  },
});

const GetOpportunityByIdInputSchema = z.object({
  opportunity_id: z.string().describe('The unique identifier of the opportunity'),
});

export const getOpportunityById = new DynamicStructuredTool({
  name: 'get_opportunity_by_id',
  description: 'Fetches a single DeFi yield opportunity by its ID from Turtle protocol, including full details on deposit tokens, incentives, and APR breakdown.',
  schema: GetOpportunityByIdInputSchema,
  func: async (input) => {
    const { data, url } = await callTurtleApi(`/opportunities/${input.opportunity_id}`);
    return formatToolResult(data.opportunity || data, [url]);
  },
});
