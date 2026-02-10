---
name: risk-assessment
description: Deep risk analysis of a specific DeFi opportunity or protocol. Triggers when user asks about risk, safety, whether to trust a protocol, audit status, or "is this safe".
---

# Risk Assessment Skill

## Workflow Checklist

Copy and track progress:
```
Risk Assessment Progress:
- [ ] Step 1: Identify target opportunity
- [ ] Step 2: Gather protocol data
- [ ] Step 3: Analyze incentive sustainability
- [ ] Step 4: Evaluate risk factors
- [ ] Step 5: Generate risk score
- [ ] Step 6: Present risk report
```

## Step 1: Identify Target Opportunity

Determine which opportunity the user wants assessed:
- If they mention a specific protocol name → search by name
- If they provide an opportunity ID → fetch directly
- If vague → ask for clarification or show top results to pick from

**Query:** `"details for [OPPORTUNITY_NAME/ID]"` via `defi_search`

## Step 2: Gather Protocol Data

Fetch full opportunity details:
- **Query:** Use `get_opportunity_by_id` for complete data
- **Extract:** TVL, APR, deposit tokens, incentives, chain, type, min deposit

## Step 3: Analyze Incentive Sustainability

For each incentive on the opportunity:

### 3.1 Reward Type Classification
- **Native Yield** (lending interest, vault strategy): Most sustainable
- **Token Rewards** (protocol token emissions): Check FDV estimate and allocation %
- **Points** (speculative): Lowest certainty — flag as speculative
- **Vesting** (locked rewards): Note lock-up period

### 3.2 APR Breakdown
- What % of total APR comes from sustainable sources?
- What % comes from temporary incentives?
- Are incentive programs time-limited?

## Step 4: Evaluate Risk Factors

Use `risk_scorer` tool with the opportunity data, then expand on each factor:

### 4.1 Smart Contract Risk
- TVL as proxy for battle-testing (higher TVL = more scrutiny)
- Vault vs lending (vaults = more complex = more risk)
- Number of incentive layers (more complexity = more risk)

### 4.2 Liquidity Risk
- TVL relative to potential deposit size
- Single-chain vs multi-chain availability

### 4.3 Yield Sustainability Risk
- High APR (>50%) = likely unsustainable
- Points-only APR = speculative
- Token emissions = dependent on token price

### 4.4 Chain Risk
- Established chains (Ethereum, Arbitrum) = lower risk
- Newer chains = higher risk but potentially higher rewards

## Step 5: Generate Risk Score

Call `risk_scorer` with extracted data to get quantitative score:
- **Score 1-3**: Conservative — suitable for risk-averse capital
- **Score 4-6**: Moderate — balanced risk/reward
- **Score 7-10**: Aggressive — high risk, for experienced DeFi users only

## Step 6: Output Format

Present a structured risk report:

1. **Opportunity Summary**: Name, chain, token, APR, TVL
2. **Risk Score**: X/10 with tier (Conservative/Moderate/Aggressive)
3. **Risk Factors Table**:

| Factor | Assessment | Impact |
|--------|-----------|--------|
| TVL | $XXM | Positive/Negative |
| APR Sustainability | X% native, Y% incentives | ... |
| Smart Contract | Vault/Lending complexity | ... |
| Chain | Established/Newer | ... |

4. **APR Breakdown**: Sustainable vs temporary sources
5. **Key Risks**: Top 2-3 specific risks for this opportunity
6. **Disclaimer**:

> This is a heuristic risk assessment based on available on-chain data. It does not account for smart contract audit results, team reputation, governance risks, or macroeconomic factors. This is not financial advice. Always do your own research.
