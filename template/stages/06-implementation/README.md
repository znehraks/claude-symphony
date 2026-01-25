# Stage 06: Implementation

Core feature implementation

## Overview

This stage implements the actual source code following the architecture and task plans. It operates in sprint-based iterative mode.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | ClaudeCode | Code generation |

**Mode**: Plan + Sandbox (safe code execution)

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../05-task-management/HANDOFF.md

# Check implementation rules
cat ../03-planning/outputs/implementation.yaml
```

### 2. Set Implementation Order

```bash
# Choose approach before starting
/config order frontend  # UI first
/config order backend   # API first
/config order parallel  # Both simultaneously
```

### 3. Run Stage

```bash
# Method 1: Slash command
/run-stage 06-implementation

# Method 2: Sprint-based workflow
/sprint tasks    # View current sprint tasks
/sprint          # Check sprint status
/next            # Move to next sprint
```

## Directory Structure

```
06-implementation/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── scaffolding.md  # Project setup prompt
│   ├── component_impl.md  # Component implementation
│   └── api_impl.md     # API implementation
├── templates/
├── inputs/             # Input files
├── outputs/
│   ├── source_code/    # Generated source code
│   └── implementation_log.md
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Git Commit Rules

> **CRITICAL**: Git commit required after every task completion

```bash
# Per-task commit
git add <relevant-files>
git commit -m "feat(impl): <task description>"
git status  # Verify clean state
```

## Sprint Workflow

```bash
/sprint         # Check current sprint status
/sprint tasks   # List sprint tasks
/next           # Complete sprint -> Next sprint (or Stage 07)
```

## Completion Criteria

- [ ] Project scaffolding complete
- [ ] Common components implemented
- [ ] Core features implemented
- [ ] API endpoints implemented
- [ ] Smoke tests executed (Test-First)
- [ ] lint/typecheck passed
- [ ] Checkpoint created
- [ ] HANDOFF.md generated

## Outputs

| File | Description |
|------|-------------|
| `outputs/source_code/` | Implemented source code |
| `outputs/implementation_log.md` | Implementation log |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 07-refactoring**: Code quality improvement and optimization

## Tips

1. **Follow implementation.yaml**: Adhere to coding standards defined in Stage 03
2. **Commit frequently**: One commit per task, meaningful messages
3. **Test-First**: Run smoke tests after implementation
4. **Checkpoint**: Create checkpoints at sprint boundaries
