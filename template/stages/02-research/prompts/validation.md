# Output Validation Prompt - Research

## Validation Targets

| Output | Required Conditions | Validation Method |
|--------|---------------------|-------------------|
| `tech_research.md` | Tech stack comparison table | Structure verification |
| `market_analysis.md` | 3+ competitor analysis | Count verification |
| `feasibility_report.md` | Risk section included | Structure verification |
| `HANDOFF.md` | Key decisions | Item verification |

## Validation Command

```bash
/validate --stage 02-research
```

## Quality Criteria

### tech_research.md
- [ ] Tech stack comparison table included
- [ ] Pros and cons analysis for each technology
- [ ] Learning curve evaluation
- [ ] Community/ecosystem evaluation

### market_analysis.md
- [ ] 3+ competitor analysis
- [ ] Market size and trends
- [ ] Entry barrier analysis
- [ ] Differentiation points

### feasibility_report.md
- [ ] Technical feasibility
- [ ] Time/resource requirements
- [ ] Risk assessment and mitigation
- [ ] Go/No-Go recommendation

### HANDOFF.md
- [ ] Completed research checklist
- [ ] Key findings
- [ ] Recommended tech stack

## Automated Validation Script

```bash
# Check competitor analysis count
grep -c "^### " outputs/market_analysis.md

# Check risk section
grep -E "^## Risk|Risk" outputs/feasibility_report.md
```
