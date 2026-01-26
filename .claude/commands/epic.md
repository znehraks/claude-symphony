# /epic - Epic Cycle Management

Manage epic cycles for iterative development workflow.

## Usage

```
/epic                           # Show current epic status
/epic new [scope]               # Start new epic cycle
/epic set-count <n>             # Set total cycle count
/epic set-scope <start> <end>   # Set custom scope
/epic history                   # View epic history
/epic enable                    # Enable epic cycles
/epic disable                   # Disable epic cycles
```

## Subcommands

### `/epic` (no args)
Display current epic cycle status.

**Action:**
```bash
./scripts/epic-cycle.sh status
```

### `/epic new [scope]`
Start a new epic cycle. Archives the current cycle (if any) and resets stages within scope.

**Scopes:**
| Scope | Range | Use Case |
|-------|-------|----------|
| `ideation` | 01-brainstorm → 03-planning | Exploring product directions |
| `design` | 01-brainstorm → 05-task-management | Full pre-implementation cycle (default) |
| `full` | 01-brainstorm → 10-deployment | Complete project iteration |
| `implementation` | 06-implementation → 09-testing | Feature/bug fix cycles |

**Example:**
```bash
./scripts/epic-cycle.sh new design
```

### `/epic set-count <n>`
Set the total number of planned epic cycles.

**Example:**
```bash
./scripts/epic-cycle.sh set-count 3
```

### `/epic set-scope <start> <end>`
Set a custom scope for epic cycles.

**Valid stages:** 01-brainstorm, 02-research, 03-planning, 04-ui-ux, 05-task-management, 06-implementation, 07-refactoring, 08-qa, 09-testing, 10-deployment

**Example:**
```bash
./scripts/epic-cycle.sh set-scope 01-brainstorm 04-ui-ux
```

### `/epic history`
View the history of completed epic cycles and their archive locations.

**Action:**
```bash
./scripts/epic-cycle.sh history
```

### `/epic enable` / `/epic disable`
Enable or disable epic cycle mode.

**Action:**
```bash
./scripts/epic-cycle.sh enable
./scripts/epic-cycle.sh disable
```

## How Epic Cycles Work

### Hierarchy
```
Epic (high-level iteration)
  └── Sprint (implementation iteration)
       └── Task (individual work item)
```

### Cycle Flow
1. **Start Epic**: Initialize cycle with defined scope
2. **Execute Stages**: Work through stages in scope
3. **Complete Scope End**: When reaching end stage, option to:
   - Start new epic cycle
   - Continue to next stage (if not at pipeline end)
4. **Archive**: Previous cycle data is archived for reference

### Context Preservation
Between epic cycles, the following is preserved:
- Previous ideas and approaches
- Rejected approaches (and why)
- Technical learnings
- Key decisions made

### Integration with Sprint Mode
- Epic cycles operate **above** sprint mode
- Sprints reset when starting a new epic
- Loop-back operates **within** current epic only

## Configuration

See `config/epic_cycles.yaml` for detailed settings:
- Preset scopes
- Context preservation rules
- Archive settings
- Transition rules

## Progress Tracking

Epic cycle state is tracked in `state/progress.json`:
```json
{
  "epic_cycle": {
    "enabled": true,
    "current_cycle": 1,
    "total_cycles": 2,
    "scope": {
      "start_stage": "01-brainstorm",
      "end_stage": "05-task-management"
    }
  }
}
```

## Best Practices

1. **Plan cycles in advance** - Set total cycles at project start
2. **Use appropriate scope** - Match scope to iteration goal
3. **Review archives** - Learn from previous cycle outcomes
4. **Don't over-iterate** - 2-3 cycles is usually sufficient
