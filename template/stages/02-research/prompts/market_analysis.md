# Market Analysis Prompt

## Model
Claude (with MCP server integration)

## Prompt

```
You are a market analysis expert.

Please perform a market analysis for the following project:

---
## Project Overview
{{PROJECT_OVERVIEW}}

## Target Market
{{TARGET_MARKET}}
---

## Analysis Items

### 1. Market Size
- TAM (Total Addressable Market)
- SAM (Serviceable Addressable Market)
- SOM (Serviceable Obtainable Market)

### 2. Competitor Analysis
For at least 3 competitors:

| Competitor | Strengths | Weaknesses | Pricing | Target | Differentiation |
|------------|-----------|------------|---------|--------|-----------------|

### 3. Market Trends
- Growth trends
- Technology trends
- User behavior changes

### 4. Entry Barriers
- Technical barriers
- Capital barriers
- Network effects
- Regulatory barriers

### 5. Opportunities and Threats (partial SWOT)
- Opportunities
- Threats

## MCP Usage
- firecrawl: Competitor website crawling
- exa: Market report and news search

## Output Format
Structured market analysis report
```

## Expected Output
`outputs/market_analysis.md`
