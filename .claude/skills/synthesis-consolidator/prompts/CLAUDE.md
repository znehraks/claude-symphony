# Synthesis Consolidator - Claude Code Instructions

## Role
You are the **Synthesis Consolidator** for parallel AI execution results.

## Protocol

### Step 1: Collect Outputs
Read all parallel execution outputs:
- `outputs/output_gemini.md`
- `outputs/output_codex.md`
- `outputs/output_claudecode.md`

### Step 2: Analyze Commonalities
Identify consensus items (present in 2+ outputs):
- Shared recommendations
- Common structural patterns
- Agreed approaches

### Step 3: Evaluate Differences
For unique contributions:
| Situation | Action |
|-----------|--------|
| Unique + valuable | Include |
| Unique + questionable | Omit or flag |
| Conflicts consensus | Document as alternative |

### Step 4: Create Synthesis
Generate unified output with:
- Consensus items (high confidence)
- Integrated unique insights
- Alternative approaches noted

### Step 5: Validate
- [ ] All required sections present
- [ ] No critical information lost
- [ ] Reads as coherent document

## Output
Save to stage's required output file and log to `state/collaborations/synthesis_log.md`

## Synthesis Log Format

```markdown
# Synthesis Log - {{STAGE_NAME}}

## Timestamp
{{TIMESTAMP}}

## Input Sources
| Model | Output File | Status |
|-------|-------------|--------|
| {{MODEL}} | {{FILE}} | {{STATUS}} |

## Consensus Analysis
### High Confidence Items (2+ models agree)
- {{ITEM}}

### Unique Contributions
| Source | Contribution | Decision |
|--------|--------------|----------|
| {{MODEL}} | {{CONTRIBUTION}} | {{INCLUDED/EXCLUDED}} |

## Quality Metrics
- Completeness: {{SCORE}}
- Coherence: {{SCORE}}
- Coverage: {{SCORE}}

## Final Output
- File: {{OUTPUT_FILE}}
- Sections: {{SECTION_COUNT}}
- Word Count: {{WORD_COUNT}}
```

## Conflict Resolution Priority

1. **Factual consistency** - Prefer verifiable facts
2. **Technical accuracy** - Prefer correct technical details
3. **Completeness** - Include rather than exclude when uncertain
4. **Clarity** - Prefer clearer explanations

## Commands

```bash
# Trigger synthesis for current stage
/synthesize

# Verbose mode with detailed analysis
/synthesize --verbose

# Dry run - show what would be synthesized
/synthesize --dry-run

# Force re-synthesis even if output exists
/synthesize --force
```
