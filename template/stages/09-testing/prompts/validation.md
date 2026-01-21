# Output Validation Prompt - Testing & E2E

## Validation Targets

| Output | Required Condition | Validation Method |
|--------|-------------------|-------------------|
| `tests/` | Coverage 80%+ | `npm run test:coverage` |
| `test_report.md` | 100% pass | Results verification |
| `coverage_report.md` | Metrics included | Structure verification |
| `HANDOFF.md` | Deployment ready state | Item verification |

## Validation Command

```bash
/validate --stage 09-testing
```

## Quality Criteria

### tests/
- [ ] Unit tests exist
- [ ] Integration tests exist
- [ ] E2E tests exist (core flows)
- [ ] All tests passing

### Coverage Targets
- [ ] Statements: 80%+
- [ ] Branches: 75%+
- [ ] Functions: 80%+
- [ ] Lines: 80%+

### test_report.md
- [ ] Test case list
- [ ] Pass/fail status
- [ ] Failed test analysis (if any)

### coverage_report.md
- [ ] Coverage summary
- [ ] Per-file coverage
- [ ] Uncovered areas identified

### HANDOFF.md
- [ ] Tests passing confirmation
- [ ] Coverage achievement confirmation
- [ ] Deployment ready checklist

## Auto Validation Script

```bash
# Run unit/integration tests
npm run test

# Measure coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Verify coverage threshold
npm run test:coverage -- --coverageThreshold='{"global":{"statements":80,"branches":75,"functions":80,"lines":80}}'
```

## Coverage Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Statements | 80% | - | - |
| Branches | 75% | - | - |
| Functions | 80% | - | - |
| Lines | 80% | - | - |

## E2E Test Checklist

- [ ] Authentication flow test
- [ ] Core feature flow test
- [ ] Error scenario test
- [ ] Responsive test (optional)

## Actions on Failure

1. Test failure → Fix bug and re-run
2. Coverage not met → Add more tests
3. E2E failure → Fix UI/logic
