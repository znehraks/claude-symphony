# /handoff

Generate the HANDOFF.md document for the current stage using the handoff-generator-agent.

## Usage
```
/handoff [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--compact` | Generate compact HANDOFF (minimum essential info) |
| `--recovery` | Generate detailed recovery HANDOFF |
| `--epic-transition` | Generate HANDOFF for epic cycle transition |
| `--legacy` | Use legacy bash script (fallback) |

## How It Works

1. **Spawn handoff-generator-agent** - Agent runs in isolated context
2. **Extract Content** - Parse conversation history and extract key items
3. **Compress** - Apply compression strategy (target 4000 tokens)
4. **Generate HANDOFF.md** - Create document with selected template
5. **Save & Archive** - Save to stage directory and archive

## Agent-Based Generation

By default, this command uses the **handoff-generator-agent** which:
- Extracts decisions, file changes, issues from conversation history
- Prioritizes content (blocking issues > decisions > tasks)
- Compresses content to fit target token budget
- Applies conditional sections based on stage context
- Uses extended thinking for complex analysis

## Agent Model Selection

When spawning **handoff-generator-agent**:
1. Read `.claude/agents/handoff-generator-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Fallback

If agent fails, automatically falls back to legacy bash script.

## Example

```
/handoff

Current stage: 01-brainstorm

Completion criteria verification:
✓ Minimum 10 ideas generated
✓ 3+ user personas defined
✓ Requirements analysis document completed

Please enter key decisions:
> MVP limited to authentication, core feature A, core feature B

HANDOFF.md generation complete!
- Location: stages/01-brainstorm/HANDOFF.md
- Backup: state/handoffs/01-brainstorm-20240120-1030.md

Next step:
/run-stage 02-research
```

## When Completion Criteria Not Met

```
/handoff

Current stage: 01-brainstorm

Completion criteria verification:
✓ Minimum 10 ideas generated
✗ 3+ user personas defined (current: 2)
✓ Requirements analysis document completed

Please meet the completion criteria.
Or use --force option to force generation:
/handoff --force
```

## Options
- `--force`: Force generation even when completion criteria not met
- `--draft`: Generate as draft (cannot proceed to next stage)
