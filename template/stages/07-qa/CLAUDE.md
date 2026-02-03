# Stage 07: QA & Full Testing

## Objective
Security audit, accessibility review, bug fixing, full E2E test sheet execution,
complete test suite execution — repeat until ALL tests pass.

## Inputs
- `stages/06-implementation/HANDOFF.md` — implementation context
- `stages/06-implementation/outputs/refactoring_report.md` — what was refactored
- `stages/03-planning/outputs/conventions.md` — conventions to verify against
- Source code in project root
- `e2e-test-sheet.md` — E2E test scenarios from Stage 06
- `references/07-qa/` — QA checklists, testing standards

## Tasks

1. **Security review** — check for OWASP Top 10 vulnerabilities (XSS, injection, auth issues)
2. **Accessibility audit** — verify WCAG 2.1 AA compliance (semantic HTML, ARIA, contrast)
3. **Error handling review** — ensure proper error boundaries, fallbacks, user-facing messages
4. **Edge case analysis** — identify untested edge cases and boundary conditions
5. **Bug identification & fix** — trace user flows, document bugs, fix all critical/high severity
6. **Performance testing** (if applicable) — API response time, bundle size, memory usage
7. **E2E test sheet full execution** — run ALL scenarios in `e2e-test-sheet.md`
8. **Write regression tests** — for every bug found and fixed in this stage
9. **Write edge-case tests** — for boundary conditions, error paths, race conditions
10. **Full test suite execution** — unit + integration + E2E + coverage report
11. **Fix-and-rerun cycle** — repeat until ALL tests pass (no exceptions)

## Core Rule: ALL Tests Must Pass

```
Test execution -> Failures found -> Fix -> Re-run -> ... -> ALL PASS
```

This cycle continues until every test passes. "Move on and fix later" is NOT allowed.
The stage CANNOT be marked complete while any test is failing.

## Required Outputs

Save all files to `stages/07-qa/outputs/`:

### `qa_report.md` (required)
- Security findings (severity: critical/high/medium/low)
- Accessibility issues found
- Error handling gaps
- Code quality concerns
- New E2E tests added (list with descriptions)
- Full test suite results (pass/fail counts)
- Overall quality assessment (pass/fail with score)

### `bug_list.md` (required)
- Bug ID, description, severity, steps to reproduce
- Fix status (fixed / deferred with justification)
- Regression test written (yes/no)

### `test_report.md` (required)
- Full test execution results (pass/fail counts by category: unit, integration, E2E)
- Failed test details and resolution
- Flaky test identification and resolution
- Test execution time

### `coverage_report.md` (required)
- Line coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Uncovered critical paths
- Coverage comparison across stages (06 -> 07)

### `performance_report.md` (optional but recommended)
- API response time benchmarks
- Bundle size analysis
- Memory usage patterns
- Optimization recommendations

## Quality Criteria
- No critical security vulnerabilities remain unfixed
- All user-facing error states have proper handling
- Core user flows work without crashes
- Accessibility basics met (keyboard nav, screen reader, contrast)
- **ALL tests pass** — unit, integration, AND E2E (zero failures)
- Convention compliance audit: verify code, UI, and documentation follow conventions.md
- Verify conventions-changelog.md exists if any deviations detected
- Ensure all amendments follow the Amendment Protocol
- **E2E test sheet fully executed** — every scenario shows PASS
- Test coverage >= 60% for core modules (target: 80%)
- Every bug found has a regression test

### Best Practice Audit
- Verify implementation follows adopted conventions from conventions.md
- For React/Next.js: check against Vercel React Best Practices (critical + high priority rules)
- For web UI: check against Web Interface Guidelines anti-patterns list
- Document violations in qa_report.md with rule references

### QA-Triggered Loop-Backs (Emergency Only)
If QA discovers a flaw that cannot be fixed within the QA or implementation stage:

**Criteria** (ALL must be true):
- Bug stems from architectural or design flaw (not a simple code bug)
- Fixing in-place would create more problems than it solves
- The flaw affects the integrity of the entire system

If criteria are met:
1. Document in `qa_report.md` > Critical Flaw Report section
2. `/checkpoint "Pre-loopback from 07 — [flaw]"`
3. `/goto <target-stage> -r "CRITICAL: [description]"`

Simple bugs, test failures, and coverage gaps are NEVER loop-back triggers — fix them in the current stage.

## CRITICAL: Process Enforcement

The QA fix-and-rerun cycle is NON-NEGOTIABLE:

Test → Fail → Fix → Re-test → ... → ALL PASS

**VIOLATIONS (will cause stage FAILURE):**
- Marking stage complete while any test fails
- Skipping E2E test sheet execution
- Deferring critical/high severity bugs
- Not writing regression tests for fixed bugs
- Skipping convention compliance audit

The stage CANNOT be completed until every test passes and every critical bug is fixed.

## HANDOFF
Generate `stages/07-qa/HANDOFF.md` summarizing:
- Critical issues found and fixed
- Remaining issues (prioritized)
- Final test results: total tests, pass rate, coverage percentage
- E2E test sheet status (all PASS)
- Performance baseline results (if applicable)
- Deployment readiness assessment
