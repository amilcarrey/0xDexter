import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';
import type { RunnableConfig } from '@langchain/core/runnables';
import { AIMessage, ToolCall } from '@langchain/core/messages';
import { z } from 'zod';
import { callLlm } from '../../model/llm.js';
import { formatToolResult } from '../types.js';
import { getCurrentDate } from '../../agent/prompts.js';

import { getOpportunities, getOpportunityById } from './opportunities.js';

function formatSubToolName(name: string): string {
  return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DEFI_TOOLS: StructuredToolInterface[] = [
  getOpportunities,
  getOpportunityById,
];

const DEFI_TOOL_MAP = new Map(DEFI_TOOLS.map(t => [t.name, t]));

function buildRouterPrompt(): string {
  return `You are a DeFi data routing assistant.
Current date: ${getCurrentDate()}

Given a user's natural language query about DeFi yield opportunities, call the appropriate tool(s).

## Guidelines
1. For yield/APR/TVL queries → get_opportunities with appropriate filters
2. For specific opportunity details → get_opportunity_by_id
3. For comparisons → call get_opportunities with different filters
4. For "best" or "top" yields → get_opportunities with sort_by and limit
5. For chain-specific queries → get_opportunities with chain_ids (use chain IDs: Ethereum=1, Polygon=137, Arbitrum=42161, Optimism=10, Base=8453, Avalanche=43114, BSC=56)
6. For token-specific queries → get_opportunities with token filter (symbol like "USDC") or deposit_token (address-chainId format)
7. For TVL filtering → use tvl_greater_than for server-side filtering

Call the appropriate tool(s) now.`;
}

const DefiSearchInputSchema = z.object({
  query: z.string().describe('Natural language query about DeFi yield opportunities'),
});

export function createDefiSearch(model: string): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'defi_search',
    description: `Intelligent agentic search for DeFi yield opportunities. Takes a natural language query and automatically routes to appropriate DeFi data tools. Use for:
- DeFi yield opportunities (vaults, lending pools)
- APR/APY comparisons across protocols and chains
- TVL analysis and ranking
- Token-specific yield opportunities
- Chain-specific opportunity discovery`,
    schema: DefiSearchInputSchema,
    func: async (input, _runManager, config?: RunnableConfig) => {
      const onProgress = config?.metadata?.onProgress as ((msg: string) => void) | undefined;

      onProgress?.('Searching DeFi opportunities...');
      const { response } = await callLlm(input.query, {
        model,
        systemPrompt: buildRouterPrompt(),
        tools: DEFI_TOOLS,
      });
      const aiMessage = response as AIMessage;

      const toolCalls = aiMessage.tool_calls as ToolCall[];
      if (!toolCalls || toolCalls.length === 0) {
        return formatToolResult({ error: 'No tools selected for query' }, []);
      }

      const toolNames = toolCalls.map(tc => formatSubToolName(tc.name));
      onProgress?.(`Fetching from ${toolNames.join(', ')}...`);
      const results = await Promise.all(
        toolCalls.map(async (tc) => {
          try {
            const tool = DEFI_TOOL_MAP.get(tc.name);
            if (!tool) {
              throw new Error(`Tool '${tc.name}' not found`);
            }
            const rawResult = await tool.invoke(tc.args);
            const result = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
            const parsed = JSON.parse(result);
            return {
              tool: tc.name,
              args: tc.args,
              data: parsed.data,
              sourceUrls: parsed.sourceUrls || [],
              error: null,
            };
          } catch (error) {
            return {
              tool: tc.name,
              args: tc.args,
              data: null,
              sourceUrls: [],
              error: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );

      const successfulResults = results.filter((r) => r.error === null);
      const failedResults = results.filter((r) => r.error !== null);
      const allUrls = results.flatMap((r) => r.sourceUrls);

      const combinedData: Record<string, unknown> = {};

      for (const result of successfulResults) {
        const id = (result.args as Record<string, unknown>).opportunity_id as string | undefined;
        const key = id ? `${result.tool}_${id}` : result.tool;
        combinedData[key] = result.data;
      }

      if (failedResults.length > 0) {
        combinedData._errors = failedResults.map((r) => ({
          tool: r.tool,
          args: r.args,
          error: r.error,
        }));
      }

      return formatToolResult(combinedData, allUrls);
    },
  });
}
