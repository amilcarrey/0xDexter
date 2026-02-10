---
name: opportunity-dive
description: Deep dive analysis of a specific DeFi opportunity. Triggers when user asks for detailed info about a vault or lending pool, wants to understand an opportunity, or says "tell me more about".
---

# Opportunity Deep Dive Skill

## Workflow Checklist

Copy and track progress:
```
Opportunity Deep Dive Progress:
- [ ] Step 1: Fetch opportunity details
- [ ] Step 2: Analyze yield structure
- [ ] Step 3: Calculate projected earnings
- [ ] Step 4: Assess risk profile
- [ ] Step 5: Present comprehensive analysis
```

## Step 1: Fetch Opportunity Details

Get full opportunity data:
- **Query:** `"details for [OPPORTUNITY]"` via `defi_search`
- If user provided an ID → use `get_opportunity_by_id`
- If user provided a name → search and match

**Extract:** All fields including incentives breakdown, deposit tokens, receipt token, chain info

## Step 2: Analyze Yield Structure

Break down the APR into components:

### 2.1 APR Sources
For each incentive, categorize:
- **Base/Native Yield**: Core protocol earnings (lending interest, vault strategy)
- **Token Incentives**: Protocol token emissions (note FDV if available)
- **Points Programs**: Speculative rewards (note estimated price if available)
- **Supplemental Yield**: Bonus programs, guaranteed returns

### 2.2 Yield Sustainability
- Flag if >50% of APR comes from temporary incentives
- Note if points incentives have an estimated price
- Identify which incentives are "active" vs "paused" vs "ended"

## Step 3: Calculate Projected Earnings

Use `yield_calculator` for multiple scenarios:

### 3.1 Conservative Scenario
- Use minimum APR if available, otherwise 50% of estimated APR
- Duration: 30, 90, 365 days
- No compounding

### 3.2 Current Rate Scenario
- Use current estimated APR
- Duration: 30, 90, 365 days
- Daily compounding

**Note:** Always disclaim that rates are variable

## Step 4: Assess Risk Profile

Use `risk_scorer` with the opportunity data:
- Pass TVL, estimated APR, type
- Include incentive count and points flag
- Include min deposit if relevant

## Step 5: Output Format

Present a comprehensive analysis:

1. **Overview**: Name, protocol, chain, type, featured status

2. **Deposit Details**:
   - Accepted tokens (symbols and chains)
   - Receipt token (what you get back)
   - Minimum deposit

3. **Yield Breakdown Table**:

| Source | Type | APR | Status |
|--------|------|-----|--------|
| Native Yield | Tokens | X% | Active |
| Protocol Rewards | Tokens | Y% | Active |
| Points Program | Points | Z% | Active |

4. **Total Estimated APR**: X% (with effective APY if compounding)

5. **Earnings Projection** (for user's amount or $10K default):

| Period | Simple | Compounded |
|--------|--------|------------|
| 30 days | $X | $Y |
| 90 days | $X | $Y |
| 1 year | $X | $Y |

6. **Risk Score**: X/10 with key factors

7. **Disclaimer**:
> Rates are variable and projections are estimates only. Incentive programs may end without notice. DeFi carries smart contract risk and other risks. Not financial advice.
