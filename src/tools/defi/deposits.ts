import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callTurtleApi } from './api.js';
import { formatToolResult } from '../types.js';
import { getTurtleDistributorId } from '../../utils/env.js';

const GetDepositsInputSchema = z.object({
  depositor: z.string().optional().describe('Filter by depositor wallet address (0x...)'),
  limit: z.number().optional().describe('Maximum number of deposits to return (default: 100, max: 2000)'),
  offset: z.number().optional().describe('Number of deposits to skip for pagination'),
});

export const getDeposits = new DynamicStructuredTool({
  name: 'get_deposits',
  description: 'Fetches deposit history from Turtle protocol for the configured distributor. Can filter by depositor wallet address and paginate results. Returns transaction hashes, amounts, tokens, and timestamps.',
  schema: GetDepositsInputSchema,
  func: async (input) => {
    const distributorId = getTurtleDistributorId();
    if (!distributorId) {
      return formatToolResult(
        { error: 'TURTLE_DISTRIBUTOR_ID environment variable is not configured. Cannot query deposits.' },
        []
      );
    }

    const params: Record<string, string | number | undefined> = {};
    if (input.depositor) params.depositor = input.depositor;
    if (input.limit !== undefined) params.limit = input.limit;
    if (input.offset !== undefined) params.offset = input.offset;

    const { data, url } = await callTurtleApi(`/deposit/${distributorId}`, params);

    return formatToolResult(data, [url]);
  },
});
