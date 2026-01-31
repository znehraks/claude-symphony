# Stage 08: QA

## Objective
Perform quality assurance: code review, security audit, accessibility check, and bug identification.

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

## Required Outputs

Save all files to `stages/08-qa/outputs/`:

### `qa_report.md` (required)
- Security findings (severity: critical/high/medium/low)
- Accessibility issues found
- Error handling gaps
- Code quality concerns
- Overall quality assessment (pass/fail with score)

### `bug_list.md` (optional but recommended)
- Bug ID, description, severity, steps to reproduce
- Suggested fix for each bug
- Priority order for fixes

## Quality Criteria
- No critical security vulnerabilities remain unfixed
- All user-facing error states have proper handling
- Core user flows work without crashes
- Accessibility basics are met (keyboard nav, screen reader, contrast)

## HANDOFF
Generate `stages/08-qa/HANDOFF.md` summarizing:
- Critical issues found and fixed
- Remaining issues (prioritized)
- Areas that need test coverage
- QA pass/fail status
