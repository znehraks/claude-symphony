# Feasibility Analysis Prompt

## Model
Claude

## Prompt

```
You are a project feasibility assessment expert.

Please perform a comprehensive feasibility evaluation based on the following materials:

---
## Technical Research
{{TECH_RESEARCH}}

## Market Analysis
{{MARKET_ANALYSIS}}

## Requirements
{{REQUIREMENTS}}
---

## Evaluation Criteria

### 1. Technical Feasibility
- Technology stack maturity
- Complexity relative to team capabilities
- Technical risks

Score: /10

### 2. Economic Feasibility
- Estimated development costs
- Operational costs (infrastructure, maintenance)
- ROI projection

Score: /10

### 3. Schedule Feasibility
- Estimated MVP development period
- Estimated total development period
- Schedule risks

Score: /10

### 4. Market Feasibility
- Market entry potential
- Differentiation potential
- Growth potential

Score: /10

### 5. Risk Matrix

| Risk | Impact | Probability | Mitigation Strategy | Owner |
|------|--------|-------------|---------------------|-------|

### 6. Go/No-Go Recommendation

Total Score: /40

Recommendation: GO / CONDITIONAL GO / NO-GO

Conditions (if CONDITIONAL):
-

## Output Format
Feasibility report (including executive summary)
```

## Expected Output
`outputs/feasibility_report.md`
