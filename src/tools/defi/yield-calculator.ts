import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';

const YieldCalculatorInputSchema = z.object({
  principal_usd: z.number().describe('Investment amount in USD'),
  apr: z.number().describe('Annual percentage rate as a percentage (e.g. 5.2 for 5.2%)'),
  duration_days: z.number().describe('Investment duration in days'),
  compounding: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().describe('Compounding frequency (default: "none" for simple interest)'),
});

export const yieldCalculator = new DynamicStructuredTool({
  name: 'yield_calculator',
  description: 'Calculates projected yield earnings given a principal amount, APR, and duration. Supports simple interest and compounding (daily, weekly, monthly). All projections are estimates — actual returns depend on rate variability.',
  schema: YieldCalculatorInputSchema,
  func: async (input) => {
    const { principal_usd, apr, duration_days, compounding = 'none' } = input;
    const rate = apr / 100;
    const years = duration_days / 365;

    let finalAmount: number;
    let yieldEarned: number;
    let effectiveApr: number;

    if (compounding === 'none') {
      yieldEarned = principal_usd * rate * years;
      finalAmount = principal_usd + yieldEarned;
      effectiveApr = apr;
    } else {
      const periodsPerYear = compounding === 'daily' ? 365 : compounding === 'weekly' ? 52 : 12;
      const totalPeriods = periodsPerYear * years;
      const ratePerPeriod = rate / periodsPerYear;
      finalAmount = principal_usd * Math.pow(1 + ratePerPeriod, totalPeriods);
      yieldEarned = finalAmount - principal_usd;
      effectiveApr = (Math.pow(1 + ratePerPeriod, periodsPerYear) - 1) * 100;
    }

    return formatToolResult({
      principal_usd,
      apr,
      effective_apy: Math.round(effectiveApr * 100) / 100,
      duration_days,
      compounding,
      projected_yield_usd: Math.round(yieldEarned * 100) / 100,
      projected_final_usd: Math.round(finalAmount * 100) / 100,
      disclaimer: 'Projection only. DeFi rates are variable and past performance does not guarantee future returns.',
    }, []);
  },
});
