# Stage 08: QA

## Objective
Perform quality assurance: security audit, accessibility check, bug identification, and **expand E2E test coverage** for additional user scenarios.

## Inputs
- `stages/07-refactoring/HANDOFF.md` — refactoring context
- `stages/07-refactoring/outputs/refactoring_report.md` — what was refactored
- Source code in project root
- `references/08-qa/` — QA checklists, testing standards

## Tasks

1. **Security review** — check for OWASP Top 10 vulnerabilities (XSS, injection, auth issues)
2. **Accessibility audit** — verify WCAG 2.1 AA compliance (semantic HTML, ARIA, contrast)
3. **Error handling review** — ensure proper error boundaries, fallbacks, user-facing messages
4. **Edge case analysis** — identify untested edge cases and boundary conditions
5. **Bug identification** — manually trace user flows and document bugs found
6. **Fix critical bugs** — resolve all critical and high-severity bugs found
7. **E2E test expansion** — write additional E2E tests for:
   - Secondary user flows (settings, profile, less common features)
   - Error scenarios (network failure, invalid input, auth expiry)
   - Accessibility flows (keyboard navigation, screen reader paths)
   - Cross-browser/responsive edge cases
8. **Run full test suite** — all existing + new tests must pass

## Required Outputs

Save all files to `stages/08-qa/outputs/`:

### `qa_report.md` (required)
- Security findings (severity: critical/high/medium/low)
- Accessibility issues found
- Error handling gaps
- Code quality concerns
- **New E2E tests added** (list with descriptions)
- **Full test suite results** (pass/fail counts)
- Overall quality assessment (pass/fail with score)

### `bug_list.md` (required)
- Bug ID, description, severity, steps to reproduce
- Fix status (fixed / deferred with justification)
- Priority order for remaining fixes

## Quality Criteria
- No critical security vulnerabilities remain unfixed
- All user-facing error states have proper handling
- Core user flows work without crashes
- Accessibility basics are met (keyboard nav, screen reader, contrast)
- **All tests pass** (existing + newly added)
- **E2E coverage expanded** beyond Stage 06 baseline

## HANDOFF
Generate `stages/08-qa/HANDOFF.md` summarizing:
- Critical issues found and fixed
- Remaining issues (prioritized)
- **New E2E tests added and their results**
- Areas that need additional test coverage
- QA pass/fail status
