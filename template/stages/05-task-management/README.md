# Stage 05: Task Management

Task breakdown and sprint planning

## Overview

This stage breaks down all work into actionable tasks, creates sprint plans, and optionally syncs with Notion for task tracking.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | ClaudeCode | Structured task breakdown |

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../04-ui-ux/HANDOFF.md
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 05-task-management

# Method 2: Direct script execution
../../scripts/run-stage.sh 05-task-management
```

### 3. Manual Workflow

```bash
# Step 1: Task breakdown
# Feature -> Epic -> Story -> Task

# Step 2: Priority decision (MoSCoW)

# Step 3: Sprint planning

# Step 4: Optional: Sync to Notion
/sync notion

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
05-task-management/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── task_breakdown.md   # Task breakdown prompt
│   └── sprint_planning.md  # Sprint planning prompt
├── templates/
│   ├── task_schema.yaml    # Notion task schema
│   └── notion_integration.md  # Notion guide
├── inputs/             # Input files
├── outputs/            # Output files
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Notion Integration

> **Important**: Tasks must be created sequentially, one at a time.

```yaml
# config.yaml settings
notion_integration:
  enabled: true
  task_creation:
    mode: "sequential"
    batch_size: 1
```

## Completion Criteria

- [ ] Complete task list creation
- [ ] Generate dependency graph
- [ ] Plan 3+ sprints
- [ ] Define milestone deliverables
- [ ] Generate HANDOFF.md

## Outputs

| File | Description |
|------|-------------|
| `outputs/tasks.md` | Task list |
| `outputs/sprint_plan.md` | Sprint plan |
| `outputs/milestones.md` | Milestone definitions |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 06-implementation**: Core feature implementation

## Tips

1. **Small units**: Break tasks into actionable, estimable units
2. **Clear criteria**: Each task should have clear completion criteria
3. **Dependencies**: Explicitly map task dependencies
4. **Notion sync**: Use sequential creation to avoid API errors
