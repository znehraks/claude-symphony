# Stage 09: Testing

## Objective
Write comprehensive tests and achieve adequate test coverage.

## Inputs
- `stages/08-qa/HANDOFF.md` — QA context
- `stages/08-qa/outputs/qa_report.md` — issues found
- `stages/08-qa/outputs/bug_list.md` — bugs to verify
- Source code in project root
- `references/09-testing/` — test examples, coverage requirements

## Tasks

1. **Test infrastructure setup** — configure test framework (Vitest/Jest), add test scripts
2. **Unit tests** — test individual functions, utilities, and business logic
3. **Integration tests** — test API endpoints, database operations, service interactions
4. **Component tests** — test UI components with their props and states
5. **E2E tests** — test critical user flows end-to-end (if Playwright/Cypress configured)
6. **Run all tests** — execute test suite and capture results

## Required Outputs

### Test files (in project source)
- Test files alongside or in `__tests__/` directories
- Test configuration files (vitest.config.ts, playwright.config.ts)

### `stages/09-testing/outputs/test_report.md` (required)
- Test execution results (pass/fail counts)
- Failed test details and analysis
- Flaky test identification
- Test execution time

### `stages/09-testing/outputs/coverage_report.md` (required)
- Line coverage percentage
- Branch coverage percentage
- Uncovered critical paths identified
- Recommendations for additional coverage

## Quality Criteria
- All tests pass
- Test coverage is at least 60% for core modules
- Critical user flows have E2E coverage
- No flaky tests in the suite

## HANDOFF
Generate `stages/09-testing/HANDOFF.md` summarizing:
- Test coverage achieved
- Critical paths tested
- Known test gaps
- Deployment readiness assessment
