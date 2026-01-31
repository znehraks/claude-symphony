# Stage 09: Testing — Edge Cases & Performance

## Objective
Fill remaining test gaps with edge-case tests and add performance/load testing. By this stage, core unit tests, integration tests, and E2E tests should already exist from Stages 06 and 08. This stage focuses on **hardening**.

## Inputs
- `stages/08-qa/HANDOFF.md` — QA context
- `stages/08-qa/outputs/qa_report.md` — issues found
- `stages/08-qa/outputs/bug_list.md` — bugs to verify
- Source code in project root
- `references/09-testing/` — test examples, coverage requirements

## Tasks

1. **Audit existing test coverage** — identify gaps in:
   - Boundary conditions (empty arrays, null values, max lengths)
   - Error paths (network failures, malformed data, timeouts)
   - Race conditions and concurrent operations
   - Edge cases specific to the domain

2. **Write edge-case tests** — for all identified gaps:
   - Unit tests for boundary conditions
   - Integration tests for error paths
   - Regression tests for bugs found in Stage 08

3. **Performance testing** (if applicable):
   - API response time benchmarks
   - Database query performance
   - Bundle size analysis (frontend)
   - Memory leak detection
   - Load testing for critical endpoints

4. **Verify bug fixes** — write regression tests for every bug fixed in Stage 08

5. **Run complete test suite** — execute ALL tests and capture results:
   - `npm test` — unit + integration
   - `npm run test:e2e` — end-to-end
   - `npm run test:coverage` — coverage report

6. **Fix any remaining failures** — all tests must pass before stage completion

## Required Outputs

### Test files (in project source)
- Additional test files for edge cases
- Performance test files (if applicable)
- Test configuration updates

### `stages/09-testing/outputs/test_report.md` (required)
- Full test execution results (pass/fail counts by category)
- Failed test details and analysis
- Flaky test identification and resolution
- Test execution time
- **Regression tests added** for Stage 08 bugs

### `stages/09-testing/outputs/coverage_report.md` (required)
- Line coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Uncovered critical paths identified
- Coverage comparison across stages (06 → 07 → 08 → 09)

### `stages/09-testing/outputs/performance_report.md` (optional but recommended)
- API response time benchmarks
- Bundle size analysis
- Memory usage patterns
- Identified performance bottlenecks
- Optimization recommendations

## Quality Criteria
- All tests pass (zero failures)
- Test coverage >= 60% for core modules (target: 80%)
- Critical user flows have E2E coverage
- No flaky tests in the suite
- Every Stage 08 bug has a regression test
- Performance baselines established (if applicable)

## HANDOFF
Generate `stages/09-testing/HANDOFF.md` summarizing:
- Final test coverage achieved
- Critical paths tested
- Known test gaps (with justification)
- Performance baseline results
- Deployment readiness assessment
