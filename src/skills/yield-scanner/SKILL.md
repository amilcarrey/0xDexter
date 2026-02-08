---
name: yield-scanner
description: Scans and compares DeFi yield opportunities across protocols and chains. Triggers when user asks to find best yields, compare APR/APY, discover opportunities, scan for high-yield vaults, or wants a comprehensive yield overview.
---

# Yield Scanner Skill

## Workflow Checklist

Copy and track progress:
```
Yield Scan Progress:
- [ ] Step 1: Gather opportunity data
- [ ] Step 2: Filter and categorize
- [ ] Step 3: Risk assessment
- [ ] Step 4: Compare and rank
- [ ] Step 5: Present results with context
```

## Step 1: Gather Opportunity Data

Call the `defi_search` tool to get current opportunities:

### 1.1 All Available Opportunities
**Query:** `"all DeFi yield opportunities"`

**Extract:** Full list of opportunities with APR, TVL, chain, tokens, type

### 1.2 Specific Filters (if user specified)
**Query based on user criteria:**
- By chain: `"yield opportunities on [CHAIN]"`
- By token: `"yield opportunities for [TOKEN]"`
- By type: `"[vault/lending] opportunities"`
- By APR: `"opportunities with APR above [X]%"`

## Step 2: Filter and Categorize

Organize opportunities into categories:

### 2.1 By Risk Tier
- **Conservative** (TVL > $10M, APR < 10%, established protocols)
- **Moderate** (TVL $1M-$10M, APR 10-30%)
- **Aggressive** (TVL < $1M or APR > 30%)

### 2.2 By Type
- **Vaults**: Automated yield strategies
- **Lending**: Direct lending/borrowing pools

### 2.3 By Chain
Group opportunities by blockchain network

## Step 3: Risk Assessment

For each opportunity, assess:
- **Smart Contract Risk**: Is the protocol well-established? TVL as proxy
- **APR Sustainability**: Are incentives temporary? Check incentive details
- **Liquidity Risk**: Is TVL sufficient for the deposit size?
- **Chain Risk**: Network reliability and fees

Flag any opportunities with:
- APR > 50% (high risk indicator)
- TVL < $100K (low liquidity)
- All APR from incentives (may be temporary)

## Step 4: Compare and Rank

Create comparison based on user's priority:
- **Yield-optimized**: Sort by APR (note risk tradeoffs)
- **Safety-optimized**: Sort by TVL (note yield tradeoffs)
- **Balanced**: Weighted score of APR and TVL

## Step 5: Output Format

Present a structured summary:

1. **Summary**: Total opportunities found, APR range, total TVL scanned
2. **Top Opportunities Table**: Ranked by user's criteria

| Protocol | Chain | Token | APR | TVL | Type | Risk |
|----------|-------|-------|-----|-----|------|------|

3. **Risk Tiers**: Grouped by conservative/moderate/aggressive
4. **Incentive Alert**: Flag any temporary incentives
5. **Disclaimer**: Standard DeFi risk notice

**Standard Disclaimer:**
> Yield rates are variable and subject to change. Past performance does not guarantee future returns. DeFi protocols carry smart contract risk, liquidity risk, and other risks. This is informational data, not financial advice. Always do your own research before depositing funds.
