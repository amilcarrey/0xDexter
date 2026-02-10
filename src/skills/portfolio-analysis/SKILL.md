---
name: portfolio-analysis
description: Analyzes a user's DeFi portfolio across Turtle protocol. Triggers when user asks about their deposits, portfolio performance, "how are my positions doing", or wants to review their DeFi activity.
---

# Portfolio Analysis Skill

## Workflow Checklist

Copy and track progress:
```
Portfolio Analysis Progress:
- [ ] Step 1: Identify wallet and check membership
- [ ] Step 2: Fetch deposit history
- [ ] Step 3: Map deposits to current opportunities
- [ ] Step 4: Calculate portfolio metrics
- [ ] Step 5: Present portfolio report
```

## Step 1: Identify Wallet and Check Membership

### 1.1 Get Wallet Address
- User should provide their wallet address
- If not provided, ask for it

### 1.2 Check Membership
**Query:** `"is wallet [ADDRESS] a Turtle member?"` via `defi_search`

If not a member, inform user they need to register first.

## Step 2: Fetch Deposit History

**Query:** `"deposit history for wallet [ADDRESS]"` via `defi_search`

**Extract per deposit:**
- Transaction hash and timestamp
- Deposited token (symbol, amount, USD value)
- Target contract/vault
- Chain

## Step 3: Map Deposits to Current Opportunities

For each deposit, try to match with current opportunities:
- **Query:** `"all opportunities"` via `defi_search`
- Match deposits to opportunities by target address or token

**Extract per position:**
- Current APR of the opportunity
- Current TVL
- Opportunity status (active/paused)

## Step 4: Calculate Portfolio Metrics

### 4.1 Portfolio Summary
- Total deposited value (USD at time of deposit)
- Number of active positions
- Chains used

### 4.2 Per-Position Analysis
For each active position:
- Use `yield_calculator` to estimate earnings since deposit
- Use `risk_scorer` to get current risk level

### 4.3 Diversification
- By chain (% allocation per chain)
- By token (% allocation per token)
- By type (vault vs lending)
- By risk tier (conservative/moderate/aggressive)

## Step 5: Output Format

Present a portfolio report:

1. **Wallet Summary**: Address, membership status, total positions

2. **Positions Table**:

| Opportunity | Chain | Token | Deposited | Current APR | Risk |
|------------|-------|-------|-----------|-------------|------|

3. **Portfolio Metrics**:
   - Total value deposited
   - Estimated earnings to date
   - Average portfolio APR
   - Average risk score

4. **Diversification Breakdown**:
   - By chain, token, type, and risk tier

5. **Recommendations** (data-driven, not financial advice):
   - Flag positions with deteriorating APR
   - Flag high-risk concentrations
   - Note any paused or ended incentive programs

6. **Disclaimer**:
> Portfolio analysis is based on available on-chain data and current rates. Actual earnings depend on rate fluctuations, compounding behavior, and protocol-specific mechanics. This is informational only, not financial advice.
