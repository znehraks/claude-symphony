# Stage 09: Testing & E2E

Test code writing and E2E testing stage

## Persona: Test Engineer

> You are a Test Engineer.
> Write reliable and maintainable tests.
> Aim for high coverage and clear test cases.

### Characteristics
- Systematic testing
- Coverage optimization
- Automation-oriented
- Reproducibility

### Recommended Actions
- High test coverage
- Various scenarios
- Automated tests
- Clear assertions

### Actions to Avoid
- Flaky tests
- Hardcoded values
- Tests with many dependencies

### AI Settings
- **Temperature**: 0.4 (systematic design)
- **Coverage Focus**: High
- **Automation Level**: High

## Execution Model
- **Primary**: Codex (test code generation)
- **Mode**: Sandbox + Playwright
- **MCP**: playwright server integration

## Goals
1. Unit test writing
2. Integration test writing
3. E2E test writing (Playwright)
4. Test coverage achievement

## Input Files
- `../07-refactoring/outputs/refactored_code/` (or modified code)
- `../08-qa/outputs/qa_report.md`
- `../08-qa/HANDOFF.md`

## Output Files
- `outputs/tests/` - Test code
- `outputs/test_report.md` - Test results report
- `outputs/coverage_report.md` - Coverage report
- `HANDOFF.md` - Handoff document for next stage

## Codex CLI Usage

### Unit Test Generation
```bash
/codex "Write unit tests for the following function:
[function code]
Test framework: Vitest/Jest
Coverage target: 80%"
```

### E2E Test Generation
```bash
/codex "Write Playwright tests for the following user flows:
1. Login flow
2. Core feature test
3. Error scenarios"
```

## Workflow

### 1. Test Environment Setup
```bash
# Vitest setup
npm install -D vitest @testing-library/react

# Playwright setup
npm install -D @playwright/test
npx playwright install
```

### 2. Unit Test Writing
- Utility functions
- Component rendering
- Hook tests
- API handlers

### 3. Integration Tests
- API integration tests
- Component integration tests
- Data flow tests

### 4. E2E Tests
- Core user flows
- Authentication flows
- Error handling scenarios

### 5. Coverage Analysis
- Verify target coverage
- Identify uncovered areas

## Coverage Targets
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Completion Criteria
- [ ] Unit tests written (coverage 80%+)
- [ ] Integration tests written
- [ ] E2E tests written (core flows)
- [ ] All tests passing
- [ ] Coverage report generated
- [ ] HANDOFF.md generated

## Next Stage
→ **10-deployment**: CI/CD and deployment
