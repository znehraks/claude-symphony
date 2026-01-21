# Output Validation Prompt - Implementation

## Validation Targets

| Output | Required Condition | Validation Method |
|--------|-------------------|-------------------|
| `source_code/` | Lint pass | `npm run lint` |
| `source_code/` | Type check pass | `npm run typecheck` |
| `implementation_log.md` | Change records | Structure verification |
| `HANDOFF.md` | Checkpoint reference | Item verification |

## Validation Command

```bash
/validate --stage 06-implementation
```

## Quality Criteria

### source_code/
- [ ] No ESLint errors
- [ ] No TypeScript type errors
- [ ] Folder structure compliance (implementation.yaml)
- [ ] Naming convention compliance
- [ ] Code formatting applied

### implementation_log.md
- [ ] List of implemented tasks
- [ ] List of modified files
- [ ] Known issues/technical debt

### HANDOFF.md
- [ ] Completed features checklist
- [ ] Checkpoint reference
- [ ] Items needing refactoring

## Auto Validation Script

```bash
# Lint check
npm run lint

# Type check
npm run typecheck

# Build verification
npm run build

# Basic tests
npm run test -- --passWithNoTests
```

## Code Quality Metrics

| Metric | Criteria | Command |
|--------|----------|---------|
| Lint errors | 0 | `npm run lint` |
| Type errors | 0 | `npm run typecheck` |
| Build success | Yes | `npm run build` |

## Actions on Failure

1. Lint errors → `npm run lint --fix`
2. Type errors → Fix types
3. Build failure → Analyze error log and fix
