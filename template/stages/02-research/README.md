# Stage 02: Research

Technical research and market analysis

## Overview

This stage performs in-depth technical research and market analysis based on the brainstorming results, evaluating feasibility and comparing technology options.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Claude | In-depth analysis, document synthesis |

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../01-brainstorm/HANDOFF.md
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 02-research

# Method 2: Direct script execution
../../scripts/run-stage.sh 02-research
```

### 3. Manual Workflow

```bash
# Step 1: Technical stack research
# Use MCP servers: firecrawl, exa, context7

# Step 2: Market/competitor analysis

# Step 3: Feasibility assessment

# Step 4: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
02-research/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── tech_stack.md   # Tech stack research prompt
│   ├── market_analysis.md  # Market analysis prompt
│   └── feasibility.md  # Feasibility assessment prompt
├── templates/
├── inputs/             # Input files
├── outputs/            # Output files
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Completion Criteria

- [ ] Complete technology stack comparison analysis
- [ ] In-depth analysis of 3+ competitors
- [ ] Write feasibility report
- [ ] Generate HANDOFF.md

## Outputs

| File | Description |
|------|-------------|
| `outputs/tech_research.md` | Technical research results |
| `outputs/market_analysis.md` | Market analysis |
| `outputs/feasibility_report.md` | Feasibility report |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 03-planning**: System architecture and technology stack decisions

## Tips

1. **Evidence-based**: Support all claims with sources
2. **Multiple perspectives**: Research from various angles
3. **Use MCP servers**: Leverage firecrawl for web scraping, exa for AI search, context7 for documentation
4. **Compare trade-offs**: Document pros/cons for each option
