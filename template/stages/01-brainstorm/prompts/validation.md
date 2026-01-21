# Output Validation Prompt - Brainstorming

## Validation Targets

| Output | Required Conditions | Validation Method |
|--------|---------------------|-------------------|
| `ideas.md` | At least 10 ideas | Count verification |
| `requirements_analysis.md` | Includes functional/non-functional sections | Structure verification |
| `HANDOFF.md` | Completion checklist | Item verification |

## Validation Command

```bash
/validate --stage 01-brainstorm
```

## Quality Criteria

### ideas.md
- [ ] At least 10 ideas exist
- [ ] Pros and cons analysis for each idea
- [ ] Priority or category classification
- [ ] Initial feasibility assessment

### requirements_analysis.md
- [ ] Functional requirements section
- [ ] Non-functional requirements section
- [ ] Constraints identified
- [ ] MVP scope proposal

### HANDOFF.md
- [ ] Completed work checklist
- [ ] Key decisions
- [ ] Next stage preparation items

## Automated Validation Script

```bash
# Check idea count in ideas.md
grep -c "^## " outputs/ideas.md

# Check sections in requirements_analysis.md
grep -E "^## (Functional|Non-Functional)" outputs/requirements_analysis.md
```

## Actions on Failure

1. Identify insufficient items
2. Generate additional ideas or supplement analysis
3. Re-run validation
