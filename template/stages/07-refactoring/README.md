# Stage 07: Refactoring

Code quality improvement and optimization

## Overview

This stage improves code quality, removes duplication, optimizes performance, and applies design patterns to the implemented code.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Codex | Code analysis and optimization |
| Secondary | ClaudeCode | Code review |

**Collaboration Mode**: Parallel execution

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../06-implementation/HANDOFF.md

# Create checkpoint before refactoring
/checkpoint
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 07-refactoring

# Method 2: Direct script execution
../../scripts/run-stage.sh 07-refactoring
```

### 3. Manual Workflow

```bash
# Step 1: Code analysis with Codex
/codex "Analyze code for improvements"

# Step 2: Identify refactoring targets

# Step 3: Execute refactoring in small units

# Step 4: Run regression tests after each change
npm run test

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
07-refactoring/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── code_analysis.md    # Analysis prompt
│   ├── refactoring.md      # Refactoring prompt
│   └── optimization.md     # Optimization prompt
├── templates/
├── inputs/             # Input files
├── outputs/
│   ├── refactored_code/
│   └── refactoring_report.md
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Git Commit Rules

> **CRITICAL**: Git commit required after every refactoring task

```bash
# Per-task commit
git add <relevant-files>
git commit -m "refactor(refactor): <task description>"
git status  # Verify clean state
```

## Test-First Flow

> **Required**: Run tests after refactoring to prevent regressions

```bash
npm run test      # Regression tests
npm run lint      # Static analysis
npm run typecheck # Type checking
```

## Completion Criteria

- [ ] Code quality analysis complete
- [ ] Duplicate code removed
- [ ] Performance optimization applied
- [ ] Regression tests executed (Test-First)
- [ ] lint/typecheck passed
- [ ] Refactoring report written
- [ ] Checkpoint created
- [ ] HANDOFF.md generated

## Outputs

| File | Description |
|------|-------------|
| `outputs/refactored_code/` | Refactored code |
| `outputs/refactoring_report.md` | Refactoring report |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 08-qa**: Quality assurance and code review

## Tips

1. **Small changes**: Refactor in small, testable units
2. **Test after each change**: Prevent regressions
3. **Checkpoint first**: Always create checkpoint before major changes
4. **Don't change behavior**: Refactoring should preserve functionality
