export const TURTLE_ACTIONS_DESCRIPTION = `Prepares DeFi transactions via Turtle protocol Actions API.

**When to use:**
- User wants to deposit into a yield opportunity
- User wants to withdraw (cancel deposit) from a position
- User wants to claim rewards from a deposit

**When NOT to use:**
- User is just browsing or comparing opportunities (use defi_search)
- User hasn't specified a wallet address or opportunity

**IMPORTANT:**
- This is a WRITE tool — always confirm the action, opportunity, amount, and token with the user before calling
- Returns unsigned transactions — the user must sign them externally with their wallet
- Requires TURTLE_DISTRIBUTOR_ID to be configured
- Amount must be in smallest unit (wei). For USDC (6 decimals): 1 USDC = "1000000"
- Use mode="swap" when the user's token differs from the deposit token`;
