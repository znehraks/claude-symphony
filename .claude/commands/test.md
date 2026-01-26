# /test

Start the 09-testing stage directly.

## Usage
```
/test [test-type]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 09-testing |
| AI Model | Codex |
| Execution Mode | Sandbox + Playwright MCP |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 08-qa completion status
   - qa-report.md exists

2. **Execute Testing**
   - Integration tests
   - E2E tests (Playwright)
   - Regression tests

3. **Output Generation**
   - test-results.md - Test results
   - coverage-report.html - Coverage

## Execution

```bash
scripts/run-stage.sh 09-testing "$ARGUMENTS"
```

## Input Files

- `stages/06-implementation/outputs/src/`
- `stages/06-implementation/outputs/tests/`
- `stages/08-qa/outputs/qa-report.md`

## Output Files

- `stages/09-testing/outputs/test-results.md`
- `stages/09-testing/outputs/e2e-results/`
- `stages/09-testing/outputs/coverage/`

## Test Types

| Type | Tool | Description |
|------|------|-------------|
| Unit | Jest/Vitest | Unit tests |
| Integration | Testing Library | Integration tests |
| E2E | Playwright | End-to-end |
| Visual | Playwright | Screenshot comparison |

## Playwright MCP Usage

```bash
# Browser snapshot
mcp__playwright__browser_snapshot

# Screenshot
mcp__playwright__browser_take_screenshot

# Form testing
mcp__playwright__browser_fill_form
```

## Related Commands

- `/run-stage 09` - Start after prerequisite check
- `/next` - Next stage (10-deployment)
- `/qa` - Previous stage
- `/deploy` - Start deployment directly

## Coverage Targets

| Metric | Target |
|--------|--------|
| Line | ≥ 80% |
| Branch | ≥ 70% |
| Function | ≥ 80% |

## Tips

- E2E focuses on critical flows
- Auto-save screenshots on failure
- Run headless mode in CI
