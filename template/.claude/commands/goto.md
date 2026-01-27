# /goto - Stage Navigation (Loop-back)

Jump to a specific stage in the pipeline.

## Usage

```
/goto <stage-id>     # Move to specific stage
/goto --list         # Show available stages
/goto --history      # Show loop-back history
```

## Options

| Option | Description |
|--------|-------------|
| `--list` | Display all available stages with status |
| `--history` | Show history of previous loop-backs |
| `--reason <text>` | Record reason for stage transition |

## Examples

### Basic Navigation

```bash
# Go to planning stage
/goto 03-planning

# Return to brainstorming for new ideas
/goto 01-brainstorm

# Jump to QA for bug fixes
/goto 08-qa
```

### With Reason (Recommended)

```bash
# Document why you're transitioning
/goto 03-planning --reason "architecture redesign needed"
/goto 08-qa --reason "critical bug discovered in authentication"
```

### View Options

```bash
# List all stages
/goto --list

# Check previous transitions
/goto --history
```

## Stage List

| Stage ID | Name |
|----------|------|
| `01-brainstorm` | Brainstorming |
| `02-research` | Research |
| `03-planning` | Planning |
| `04-ui-ux` | UI/UX Planning |
| `05-task-management` | Task Management |
| `06-implementation` | Implementation |
| `07-refactoring` | Refactoring |
| `08-qa` | QA |
| `09-testing` | Testing & E2E |
| `10-deployment` | CI/CD & Deployment |

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stage Loop-back
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  From: 06-implementation (Implementation)
  To:   03-planning (Planning)

[HANDOFF Updated]
✓ Loop-back recorded in stages/06-implementation/HANDOFF.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Stage Execution: 03-planning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Execution Script

```bash
claude-symphony goto <stage-id> [options]
```

## Notes

- Loop-back history is stored in `state/loopback_history.json`
- Current stage's HANDOFF.md is updated with transition record
- Use `/goto --list` to see current stage status before navigating

## Related Commands

- `/next` - Proceed to next sequential stage
- `/status` - Check current pipeline status
- `/stages` - View all stages with status
- `/handoff` - Generate HANDOFF.md before transitioning
