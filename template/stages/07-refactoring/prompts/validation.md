# Output Validation Prompt - Refactoring

## Validation Targets

| Output | Required Condition | Validation Method |
|--------|-------------------|-------------------|
| `refactored_code/` | Behavior maintained | Tests pass |
| `refactored_code/` | Quality improved | Metric comparison |
| `refactoring_report.md` | Change history | Structure verification |
| `HANDOFF.md` | Checkpoint reference | Item verification |

## Validation Command

```bash
/validate --stage 07-refactoring
```

## Quality Criteria

### refactored_code/
- [ ] All existing tests pass
- [ ] No lint errors
- [ ] No type errors
- [ ] Complexity reduced (target: 20%↓)
- [ ] Duplicate code reduced (target: 50%↓)

### refactoring_report.md
- [ ] List of refactored functions/classes
- [ ] Before/after comparison
- [ ] Performance improvement measurements
- [ ] Remaining technical debt

### HANDOFF.md
- [ ] Completed refactoring list
- [ ] Checkpoint reference
- [ ] Areas needing QA

## Auto Validation Script

```bash
# Verify tests pass
npm run test

# Lint check
npm run lint

# Bundle size comparison
npm run build && du -sh dist/

# Complexity measurement (optional)
npx complexity-report src/**/*.ts
```

## Quality Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Average complexity | - | - | - |
| Duplicate code | - | - | - |
| Bundle size | - | - | - |

## Regression Tests

```bash
# Run full tests
npm run test

# Run E2E tests (if available)
npm run test:e2e
```

## Actions on Failure

1. Test failure → Rollback to checkpoint and retry
2. Performance degradation → Review changes and optimize
3. Type errors → Fix types and re-verify
