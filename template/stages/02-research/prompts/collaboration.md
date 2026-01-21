# AI Collaboration Prompt - Research

## Collaboration Mode: Parallel + Sequential

This stage uses **parallel research** followed by **sequential integration**.

### Participating Models
- **Claude**: In-depth analysis, technical document synthesis
- **Gemini**: Market trends, competitor analysis

### Collaboration Prompt

```
# Parallel Research
/collaborate --mode parallel --models claude,gemini --task "technology and market research"

# Sequential Integration (Claude reviews Gemini results)
/collaborate --mode sequential --chain "gemini:market_research -> claude:synthesis"
```

### Task Distribution

| AI | Responsibility | Output |
|----|----------------|--------|
| Gemini | Market analysis, competitor research | market_analysis.md |
| Claude | Tech stack analysis, feasibility | tech_research.md, feasibility_report.md |

### MCP Server Usage

- **firecrawl**: Web crawling (Gemini usage)
- **exa**: AI search (Claude usage)
- **context7**: Document search (Claude usage)

### Output Format

```markdown
## AI Collaboration Results

### Gemini Research (Market)
- Competitor analysis
- Market trends
...

### Claude Research (Technology)
- Tech stack comparison
- Feasibility assessment
...

### Integrated Insights
- [Key findings]
```
