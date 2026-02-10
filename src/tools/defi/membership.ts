import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callTurtleApi } from './api.js';
import { formatToolResult } from '../types.js';

const CheckMembershipInputSchema = z.object({
  address: z.string().describe('Wallet address to check membership for'),
  wallet_ecosystem: z.enum(['evm', 'solana', 'ton']).optional().describe('Wallet ecosystem (default: "evm")'),
});

export const checkMembership = new DynamicStructuredTool({
  name: 'check_membership',
  description: 'Checks if a wallet address is registered as a Turtle protocol member. Returns whether the wallet is associated with a user account.',
  schema: CheckMembershipInputSchema,
  func: async (input) => {
    const params: Record<string, string | number | undefined> = {
      address: input.address,
    };
    if (input.wallet_ecosystem) params.walletEcosystem = input.wallet_ecosystem;

    const { data, url } = await callTurtleApi('/membership/', params);

    return formatToolResult(data, [url]);
  },
});
