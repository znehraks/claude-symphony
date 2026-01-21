# /context

Check and manage context state.

## Usage
```
/context                 # Check current state
/context --save [desc]   # Save snapshot
/context --compress      # Execute compression
/context --restore       # Restore saved state
/context --clean         # Clean old snapshots
```

## Actions

### State Check (`/context`)
- Display estimated token usage
- State relative to thresholds
- List of saved snapshots

### Save Snapshot (`--save`)
- Save current state as state.md
- Can add description
- Save to state/context/ directory

### Execute Compression (`--compress`)
- Activate context-compression skill
- Clean unnecessary context
- Keep only essential information

### Restore (`--restore`)
- Restore from saved snapshot
- Use after /clear

## Execution Script

```bash
scripts/context-manager.sh "$ARGUMENTS"
```

## Output Examples

### State Check

```
/context

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Context Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Token usage: ~45,230 / 80,000
Status: ████████████░░░░░░░░ 56% [Normal]

Thresholds:
• Warning (50k): Still have room
• Limit (80k): ~35,000 tokens remaining

Current stage: 04-ui-ux
Conversation messages: 28

[Saved Snapshots]
• state-20240120-1030.md (03-planning completion)
• state-20240120-1430.md (04-ui-ux start)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Warning State

```
/context

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Context Status - Warning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Token usage: ~52,000 / 80,000
Status: ████████████████░░░░ 65% [Warning]

⚠️ Warning threshold (50k) exceeded!

Recommended actions:
1. Compress with /context --compress
2. /context --save then /clear

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Save Snapshot

```
/context --save "UI design completed"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Context Snapshot Saved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: state/context/state-20240120-1530.md
Description: UI design completed
Stage: 04-ui-ux
Tokens: ~45,000

[Saved Content]
✓ Current stage information
✓ Progress status
✓ Key decisions (5)
✓ Reference file list

Recovery: /context --restore state-20240120-1530.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Options

| Option | Description |
|--------|-------------|
| (none) | Check current state |
| `--save [desc]` | Save snapshot |
| `--compress` | Context compression |
| `--restore [file]` | Restore snapshot |
| `--list` | Snapshot list |
| `--clean` | Clean old snapshots |
| `--json` | JSON format output |

## Configuration Reference

settings.json context settings:

```json
{
  "context": {
    "warning_threshold": 50000,
    "limit_threshold": 80000,
    "auto_save": true
  }
}
```

## Related Skills

- `context-compression` - Auto compression skill

## Related Commands

- `/status` - Pipeline status
- `/checkpoint` - Create checkpoint
- `/restore` - Restore checkpoint

## Tips

- Recommended: `/context --save` before long tasks
- Run `/context --compress` at 50k warning
- Recover with `/context --restore` after /clear
