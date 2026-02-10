import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callTurtleApi } from './api.js';
import { formatToolResult } from '../types.js';
import { getTurtleDistributorId } from '../../utils/env.js';

const TurtleActionsInputSchema = z.object({
  action: z.enum(['deposit', 'cancel-deposit', 'claim-deposit']).describe(
    'Action type: "deposit" to enter a position, "cancel-deposit" to withdraw, "claim-deposit" to claim rewards'
  ),
  opportunity_id: z.string().describe('The UUID of the target opportunity'),
  user_address: z.string().describe('User wallet address (0x...)'),
  token_in: z.string().describe('Input token contract address'),
  amount: z.string().describe('Amount in smallest unit (wei). E.g. "1000000" for 1 USDC'),
  slippage_bps: z.number().optional().describe('Slippage tolerance in basis points (default: 50 = 0.5%)'),
  mode: z.enum(['direct', 'swap']).optional().describe('Deposit mode: "direct" for native token, "swap" to route through DEX (default: "direct")'),
});

export const turtleActions = new DynamicStructuredTool({
  name: 'turtle_actions',
  description: 'Prepares DeFi transactions via Turtle protocol Actions API. Supports deposit (enter a yield position), cancel-deposit (withdraw), and claim-deposit (claim rewards). Returns unsigned transactions for the user to sign externally. This is a WRITE tool — always confirm details with the user before calling.',
  schema: TurtleActionsInputSchema,
  func: async (input) => {
    const distributorId = getTurtleDistributorId();
    if (!distributorId) {
      return formatToolResult(
        { error: 'TURTLE_DISTRIBUTOR_ID environment variable is not configured. Cannot prepare transactions.' },
        []
      );
    }

    const params: Record<string, string | number | undefined> = {
      userAddress: input.user_address,
      tokenIn: input.token_in,
      amount: input.amount,
      distributorId,
      slippageBps: input.slippage_bps,
      mode: input.mode,
    };

    const endpoint = `/actions/${input.action}/${input.opportunity_id}`;

    const { data, url } = await callTurtleApi(endpoint, params, { method: 'POST' });

    return formatToolResult(data, [url]);
  },
});
