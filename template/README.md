# Claude Symphony Project

This is a Claude Symphony project — a 10-stage software development workflow with quality gates and checkpoints.

## Quick Start

1. **Start your project** by reviewing the project brief:
   ```
   Read: stages/01-brainstorm/inputs/project_brief.md
   ```

2. **Check current status**:
   ```
   /progress
   ```

3. **Begin the workflow**:
   ```
   /brainstorm
   ```

## Pipeline Stages

| Stage | Command | Description |
|-------|---------|-------------|
| 01 | `/brainstorm` | Idea generation and requirements exploration |
| 02 | `/research` | Technical research and market analysis |
| 03 | `/planning` | System architecture and tech decisions |
| 04 | `/ui-ux` | UI/UX design and wireframes |
| 05 | `/tasks` | Task breakdown and sprint planning |
| 06 | `/implement` | Core feature implementation |
| 07 | `/refactor` | Code quality and optimization |
| 08 | `/qa` | Quality assurance and testing |
| 09 | `/test` | E2E testing and coverage |
| 10 | `/deploy` | CI/CD and deployment |

## Key Commands

- `/progress` - Check pipeline progress
- `/next` - Move to next stage
- `/handoff` - Generate stage transition document
- `/checkpoint` - Save current state
- `/context` - Check context usage

## Context Management

claude-symphony automatically manages Claude's context window to ensure continuous workflow.

### Automatic Thresholds

| Remaining | Status | Action |
|-----------|--------|--------|
| 60% | ⚡ Warning | Display warning in statusline |
| 50% | ⚠️ Action | Auto-snapshot + recommend `/compact` |
| 40% | 🔴 Critical | Generate HANDOFF.md + `/clear` required |

### How It Works

The statusline hook monitors context usage every 300ms. When thresholds are reached:

1. **Auto-snapshot** is saved to `state/context/`
2. **HANDOFF.md** is generated with recovery instructions
3. **Memory Relay** (if active) starts a new session automatically

### Context Commands

```bash
# Check context status
/context

# Save snapshot manually
/context --save

# List all snapshots
/context --list

```

## Documentation

See the `docs/` directory for detailed guides:
- [Getting Started](docs/getting-started.md)
- [Commands Reference](docs/commands.md)
- [Configuration Guide](docs/configuration.md)

## Stage Outputs

Each stage generates outputs in `stages/XX-stage/outputs/`. These outputs feed into subsequent stages automatically.

## Key Files

| File | Description |
|------|-------------|
| `state/progress.json` | Pipeline progress and current state |
| `state/context/` | Auto-saved context snapshots |
| `state/handoffs/` | HANDOFF archive |
| `HANDOFF.md` | Latest session handoff document |
| `CLAUDE.md` | AI instructions and configuration |

## Need Help?

- Run `/stages` to see all available stages
- Run `/progress` for current pipeline state
- Run `/context` to check context usage
- Check `CLAUDE.md` for detailed AI instructions
