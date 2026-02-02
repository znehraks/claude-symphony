# /progress

Check the overall pipeline status at a glance.

## Usage
```
/progress
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

 01 ✅ brainstorm     completed  [Claude debate:full]
 02 ✅ research       completed  [Claude debate:standard]
 03 ✅ planning       completed  [Claude debate:full]
 04 🔄 ui-ux         in progress [Claude debate:standard]
 05 ⏳ task-mgmt     pending     [Claude debate:light]
 06 ⏳ implementation pending     [Claude debate:full]
 07 ⏳ refactoring   pending     [Claude debate:full]
 08 ⏳ qa            pending     [Claude debate:full]
 09 ⏳ testing       pending     [Claude debate:standard]
 10 ⏳ deployment    pending     [Claude debate:light]

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
