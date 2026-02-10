import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';

const RiskScorerInputSchema = z.object({
  tvl: z.number().describe('Total value locked in USD'),
  estimated_apr: z.number().describe('Estimated APR as a percentage'),
  type: z.enum(['vault', 'lending']).describe('Opportunity type'),
  incentive_count: z.number().optional().describe('Number of active incentives/reward programs'),
  has_points_incentive: z.boolean().optional().describe('Whether the opportunity has points-based (speculative) incentives'),
  min_deposit_usd: z.number().optional().describe('Minimum deposit amount in USD'),
});

interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
}

export const riskScorer = new DynamicStructuredTool({
  name: 'risk_scorer',
  description: 'Scores the risk level of a DeFi opportunity based on TVL, APR, type, and incentive structure. Returns a 1-10 risk score (1=lowest risk, 10=highest risk) with explanations. Uses heuristic analysis — not a substitute for professional financial advice.',
  schema: RiskScorerInputSchema,
  func: async (input) => {
    const factors: RiskFactor[] = [];
    let score = 5; // Start at medium

    // TVL scoring
    if (input.tvl >= 100_000_000) {
      score -= 2;
      factors.push({ factor: 'TVL', impact: 'positive', detail: `$${(input.tvl / 1e6).toFixed(0)}M TVL — large, well-established pool` });
    } else if (input.tvl >= 10_000_000) {
      score -= 1;
      factors.push({ factor: 'TVL', impact: 'positive', detail: `$${(input.tvl / 1e6).toFixed(1)}M TVL — moderate size` });
    } else if (input.tvl >= 1_000_000) {
      factors.push({ factor: 'TVL', impact: 'neutral', detail: `$${(input.tvl / 1e6).toFixed(1)}M TVL — smaller pool, moderate liquidity risk` });
    } else {
      score += 2;
      factors.push({ factor: 'TVL', impact: 'negative', detail: `$${(input.tvl / 1e3).toFixed(0)}K TVL — low liquidity, higher risk` });
    }

    // APR scoring
    if (input.estimated_apr > 50) {
      score += 2;
      factors.push({ factor: 'APR', impact: 'negative', detail: `${input.estimated_apr.toFixed(1)}% APR — very high yield often indicates higher risk or unsustainable incentives` });
    } else if (input.estimated_apr > 20) {
      score += 1;
      factors.push({ factor: 'APR', impact: 'negative', detail: `${input.estimated_apr.toFixed(1)}% APR — above-average yield, verify sustainability` });
    } else if (input.estimated_apr > 5) {
      factors.push({ factor: 'APR', impact: 'neutral', detail: `${input.estimated_apr.toFixed(1)}% APR — moderate yield range` });
    } else {
      score -= 1;
      factors.push({ factor: 'APR', impact: 'positive', detail: `${input.estimated_apr.toFixed(1)}% APR — conservative yield, typically more sustainable` });
    }

    // Type scoring
    if (input.type === 'lending') {
      score -= 1;
      factors.push({ factor: 'Type', impact: 'positive', detail: 'Lending — generally simpler mechanics, lower smart contract risk' });
    } else {
      factors.push({ factor: 'Type', impact: 'neutral', detail: 'Vault — may involve complex strategies, additional smart contract risk' });
    }

    // Incentive scoring
    if (input.has_points_incentive) {
      score += 1;
      factors.push({ factor: 'Incentives', impact: 'negative', detail: 'Points-based rewards — speculative value, may not convert to real returns' });
    }
    if (input.incentive_count !== undefined && input.incentive_count > 3) {
      score += 1;
      factors.push({ factor: 'Complexity', impact: 'negative', detail: `${input.incentive_count} incentive layers — complex reward structure` });
    }

    // Min deposit scoring
    if (input.min_deposit_usd !== undefined && input.min_deposit_usd > 10000) {
      factors.push({ factor: 'Access', impact: 'neutral', detail: `$${(input.min_deposit_usd / 1e3).toFixed(0)}K minimum deposit — restricted access` });
    }

    // Clamp score
    score = Math.max(1, Math.min(10, score));

    const tier = score <= 3 ? 'Conservative' : score <= 6 ? 'Moderate' : 'Aggressive';

    return formatToolResult({
      risk_score: score,
      risk_tier: tier,
      factors,
      disclaimer: 'Heuristic risk assessment only. Does not account for smart contract audits, team reputation, or market conditions. Not financial advice.',
    }, []);
  },
});
