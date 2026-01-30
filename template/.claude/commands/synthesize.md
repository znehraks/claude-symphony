# /synthesize

Consolidate parallel AI outputs into a unified deliverable using the output-synthesis-agent.

## Usage
```
/synthesize [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed analysis (consensus ratios, quality scores) |
| `--dry-run` | Preview synthesis without writing output |
| `--force` | Re-synthesize even if final output exists |
| `--stage <id>` | Synthesize specific stage outputs |

## How It Works

1. **Spawn output-synthesis-agent** - Agent runs in isolated context
2. **Collect Outputs** - Gather all model outputs (Gemini, Claude, Codex)
3. **Analyze** - Calculate consensus ratios and identify unique contributions
4. **Synthesize** - Create unified output with best-of-all insights
5. **Validate** - Check quality score (threshold 0.8)

## Applicable Stages

| Stage | Models | Final Output |
|-------|--------|--------------|
| 01-brainstorm | Gemini + ClaudeCode | ideas.md |
| 03-planning | Gemini + ClaudeCode | architecture.md |
| 04-ui-ux | Gemini + ClaudeCode | wireframes.md |
| 07-refactoring | Codex + ClaudeCode | refactoring_report.md |
| 09-testing | Codex + ClaudeCode | tests/ |

## Example

```
/synthesize

Collecting outputs:
- output_gemini.md (12 ideas)
- output_claude.md (10 ideas)

Analysis:
- Consensus: 8 ideas (66.7%)
- Unique: 4 ideas from Gemini, 2 ideas from Claude

Quality score: 0.92 ✅

Final output: stages/01-brainstorm/outputs/ideas.md
```

## Quality Threshold

- Default: 0.8 (80%)
- If below threshold: Triggers review prompt

## Agent Model Selection

When spawning **output-synthesis-agent**:
1. Read `.claude/agents/output-synthesis-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Fallback

If agent fails, falls back to best_of_n scoring method.
