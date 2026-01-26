# /status

Check the overall pipeline status at a glance.

## Usage
```
/status
```

## Actions

1. **Read progress.json**
   - Check current stage
   - Check completion status for each stage

2. **Display Visual Status**
   - Progress bar
   - Status icon for each stage
   - Checkpoint count
   - Token usage (context)

## Execution Script

```bash
scripts/show-status.sh
```

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Pipeline Status: my-app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress: [████████░░░░░░░░░░░░] 40% (4/10)

 01 ✅ brainstorm     completed  [Gemini+Claude]
 02 ✅ research       completed  [Claude+MCP]
 03 ✅ planning       completed  [Gemini]
 04 🔄 ui-ux         in progress [Gemini]
 05 ⏳ task-mgmt     pending     [ClaudeCode]
 06 ⏳ implementation pending     [ClaudeCode]
 07 ⏳ refactoring   pending     [Codex]
 08 ⏳ qa            pending     [ClaudeCode]
 09 ⏳ testing       pending     [Codex]
 10 ⏳ deployment    pending     [ClaudeCode]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checkpoints: 2 | Last handoff: 03-planning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Status Icons

| Icon | Meaning |
|------|---------|
| ✅ | Completed |
| 🔄 | In Progress |
| ⏳ | Pending |
| ❌ | Failed |
| ⏸️ | Paused |

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--brief` | Output brief single-line status only |

## Use Cases

- Check current status when starting new session
- Verify progress before starting work
- Share current status with team members
