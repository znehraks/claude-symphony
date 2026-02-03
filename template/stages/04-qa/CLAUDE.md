# Stage 04: QA & E2E Testing

## Objective
Ensure application quality through security audit, accessibility review, and comprehensive E2E testing.

**SuperClaude Command**: `/sc:test --type e2e`

**Recommended MCP**: playwright

## Inputs
- `stages/03-implementation/HANDOFF.md` — context from implementation
- `stages/03-implementation/outputs/test_summary.md` — existing test coverage
- Source code in project root
- `e2e-test-sheet.md` — E2E scenarios from implementation
- `stages/01-planning/outputs/conventions.md` — quality standards
- `references/04-qa/` — QA checklists, testing standards

## Tasks

### 1. Security Audit
Review codebase for OWASP Top 10 vulnerabilities:

| Vulnerability | Check |
|---------------|-------|
| Injection | SQL, NoSQL, Command injection |
| Broken Auth | Session management, password policies |
| XSS | Input sanitization, output encoding |
| IDOR | Access control checks |
| Security Misconfig | Headers, error handling, secrets |
| Sensitive Data | Encryption, secure transmission |
| CSRF | Token validation |

Document findings with severity ratings.

### 2. Accessibility Review
Verify WCAG 2.1 AA compliance:

- Keyboard navigation (all interactive elements)
- Screen reader support (ARIA labels, roles)
- Color contrast (4.5:1 minimum for text)
- Focus indicators (visible focus states)
- Alt text (all images, icons)
- Form labels (all inputs labeled)
- Error messages (accessible announcements)

### 3. E2E Test Execution
Using Playwright (recommended) or Cypress:

#### Run Existing E2E Tests
```bash
npm run test:e2e
```

#### Add Missing Scenarios
Review `e2e-test-sheet.md` and add tests for:
- Critical user flows (signup, login, core features)
- Edge cases (empty states, error states)
- Cross-browser compatibility
- Mobile responsiveness

Minimum 5 E2E scenarios required.

### 4. Full Test Suite Execution
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

All tests must pass.

### 5. Bug Fixing
- Document all bugs found
- Fix critical and high severity bugs
- Re-run tests after each fix
- Document remaining known issues

### 6. Performance Baseline (Optional)
- Page load times
- API response times
- Bundle size analysis

## MCP Integration (Recommended)

### Using Playwright MCP (if available)
```
mcp__playwright__browser_navigate({ "url": "http://localhost:3000" })
mcp__playwright__browser_click({ "selector": "button[type=submit]" })
mcp__playwright__browser_take_screenshot()
```

**Note**: MCP usage is recommended but not required.

## Required Outputs

Save all files to `stages/04-qa/outputs/`:

### `e2e_report.md` (required)
E2E test results with minimum 5 scenarios:

```markdown
## E2E Test Results

### Scenario 1: User Registration
- Status: PASS
- Steps: Navigate to /signup, fill form, submit
- Expected: Redirect to dashboard
- Actual: Redirect to dashboard

### Scenario 2: Login Flow
- Status: PASS
- Steps: Navigate to /login, enter credentials, submit
- Expected: Dashboard with user data
- Actual: Dashboard with user data

## Summary
- Total Scenarios: 8
- Passed: 7
- Failed: 1
- Flaky: 0
```

### `qa_report.md` (required)
Comprehensive QA report including:

```markdown
## Security Findings
### High Severity
- [None found / List issues]

### Medium Severity
- [List issues]

### Low Severity
- [List issues]

## OWASP Compliance
| Category | Status | Notes |
|----------|--------|-------|
| Injection | PASS | Input validation implemented |
| XSS | PASS | Output encoding in place |
...

## Accessibility
### WCAG 2.1 AA Compliance
- [x] Keyboard navigation
- [x] Screen reader support
- [x] Color contrast
...

## Recommendations
- [List improvement suggestions]
```

### `test_report.md` (optional)
- Full test suite results
- Coverage metrics

### `bug_list.md` (optional)
- Bugs found with severity
- Resolution status

## Quality Criteria
- All E2E scenarios pass
- No critical security vulnerabilities
- Accessibility requirements met
- Full test suite passes
- Coverage targets met (if defined)

## Quality Checks (Automated)
- `e2e_scenarios`: minimum 5 scenarios (critical)
- `e2e_test`: npm run test:e2e passes (critical)
- `security_audit`: Security Findings section exists (non-critical)

## HANDOFF
Generate `stages/04-qa/HANDOFF.md` summarizing:
- Test results summary
- Security audit findings
- Accessibility compliance status
- Remaining known issues
- What deployment stage needs to know
