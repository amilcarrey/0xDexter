export const DEFI_SEARCH_DESCRIPTION = `
Intelligent meta-tool for DeFi yield opportunity research. Takes a natural language query and automatically routes to appropriate DeFi data sources including yield opportunities, APR comparisons, TVL analysis, and protocol filtering.

## When to Use
- DeFi yield opportunities (vaults, lending pools)
- APR/APY comparisons across protocols and chains
- TVL analysis and ranking
- Token-specific yield opportunities
- Chain-specific opportunity discovery
- Protocol comparisons (Aave, Compound, etc.)

## When NOT to Use
- Transaction execution (use turtle_route instead)
- Wallet membership management
- General web searches (use web_search)
- Traditional finance data (use financial_search)

## Usage Notes
- Call ONCE with the complete natural language query
- Handles filtering, sorting, and comparison internally
- Returns structured JSON data with source URLs
`.trim();
