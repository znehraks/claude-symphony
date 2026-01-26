# Test Report
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: Jest/Vitest, Playwright, Istanbul Coverage -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `test_report.md`.

---

## Metadata

| Field | Value |
|-------|-------|
| report_id | TEST-2024-001 |
| build | v1.2.3 (commit: abc1234) |
| runner | Vitest 1.2.0 + Playwright 1.41 |
| ci_job | [GitHub Actions #1234](https://github.com/org/repo/actions/runs/1234) |
| total_duration | 4m 32s |
| generated_at | YYYY-MM-DDTHH:MM:SSZ |

---

## Executive Summary

### Test Pyramid Distribution

```
         ┌───────────┐
         │   E2E     │ ← 15 tests (5%)
         │   (12)    │
         ├───────────┤
         │Integration│ ← 45 tests (15%)
         │   (45)    │
         ├───────────┤
         │           │
         │   Unit    │ ← 240 tests (80%)
         │  (240)    │
         │           │
         └───────────┘
         Total: 297 tests
```

### Overall Results

| Category | Total | Passed | Failed | Skipped | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Unit | 240 | 238 | 2 | 0 | 99.2% |
| Integration | 45 | 44 | 1 | 0 | 97.8% |
| E2E | 12 | 11 | 1 | 0 | 91.7% |
| **Total** | **297** | **293** | **4** | **0** | **98.7%** |

**Status:** ⚠️ NEEDS ATTENTION (4 failures)

---

## Code Coverage (Istanbul)

### Summary

| Metric | Covered | Total | Percentage | Target | Status |
|--------|---------|-------|------------|--------|--------|
| Statements | 2,450 | 2,890 | **84.78%** | 80% | ✓ |
| Branches | 890 | 1,180 | **75.42%** | 75% | ✓ |
| Functions | 456 | 520 | **87.69%** | 80% | ✓ |
| Lines | 2,380 | 2,800 | **85.00%** | 80% | ✓ |

### Coverage by Module

| Module | Stmts | Branch | Func | Lines | Δ from main |
|--------|-------|--------|------|-------|-------------|
| `src/components/` | 92% | 85% | 95% | 91% | +2% ↑ |
| `src/hooks/` | 88% | 78% | 90% | 87% | +5% ↑ |
| `src/services/` | 76% | 68% | 82% | 75% | -1% ↓ |
| `src/utils/` | 95% | 90% | 98% | 94% | = |
| `src/lib/` | 82% | 74% | 85% | 81% | +3% ↑ |

### Uncovered Files (< 60% Coverage)

| File | Coverage | Reason | Action |
|------|----------|--------|--------|
| `src/services/legacy-export.ts` | 45% | Legacy code, deprecation planned | Refactor in Sprint 5 |
| `src/utils/experimental.ts` | 52% | Feature flag disabled | Add tests when enabled |

---

## Unit Test Details

### Test Suites by Category

| Suite | Tests | Duration | Status |
|-------|-------|----------|--------|
| `components/**/*.test.tsx` | 85 | 12.3s | ✓ Pass |
| `hooks/**/*.test.ts` | 42 | 5.8s | ✓ Pass |
| `services/**/*.test.ts` | 38 | 8.2s | ⚠️ 2 failed |
| `utils/**/*.test.ts` | 55 | 3.1s | ✓ Pass |
| `lib/**/*.test.ts` | 20 | 2.4s | ✓ Pass |

### Sample Test Output

```
 ✓ src/hooks/useAuth.test.ts (15 tests) 1.2s
   ✓ useAuth > should return null user when not authenticated
   ✓ useAuth > should return user after successful login
   ✓ useAuth > should handle login errors gracefully
   ✓ useAuth > should clear user on logout
   ✓ useAuth > should refresh token when expired
   ... (10 more)

 ✓ src/components/Button.test.tsx (12 tests) 0.8s
   ✓ Button > renders with default props
   ✓ Button > handles click events
   ✓ Button > shows loading state
   ✓ Button > is disabled when loading
   ... (8 more)
```

---

## Integration Test Details

### API Integration Tests

| Endpoint | Method | Tests | Status |
|----------|--------|-------|--------|
| `/api/auth/login` | POST | 5 | ✓ Pass |
| `/api/auth/logout` | POST | 3 | ✓ Pass |
| `/api/users/:id` | GET | 4 | ✓ Pass |
| `/api/users/:id` | PATCH | 4 | ✓ Pass |
| `/api/prs/analyze` | POST | 8 | ⚠️ 1 failed |
| `/api/settings` | GET/PUT | 6 | ✓ Pass |

### Database Integration Tests

| Test Suite | Tests | Duration | Status |
|------------|-------|----------|--------|
| User CRUD operations | 8 | 3.2s | ✓ Pass |
| Session management | 6 | 2.8s | ✓ Pass |
| Data migrations | 4 | 1.5s | ✓ Pass |

---

## E2E Test Details (Playwright)

### Configuration

```typescript
// playwright.config.ts
export default {
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  retries: 2,
  reporter: [['html'], ['json'], ['junit']],
};
```

### User Flow Results

| Flow | Steps | Duration | Retries | Status | Artifacts |
|------|-------|----------|---------|--------|-----------|
| Login Flow | 5 | 3.2s | 0 | ✓ Pass | - |
| Registration Flow | 8 | 5.1s | 0 | ✓ Pass | - |
| PR Analysis | 10 | 8.5s | 1 | ✓ Pass | - |
| Profile Update | 6 | 2.8s | 0 | ✓ Pass | - |
| Settings Change | 5 | 2.1s | 0 | ✓ Pass | - |
| Checkout Flow | 12 | - | 2 | ✗ Failed | [traces](./traces/) |

### E2E Test Code Sample

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="login-email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="login-password-input"]', 'wrongpass');
    await page.click('[data-testid="login-submit-button"]');

    await expect(page.locator('[data-testid="login-error-alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Failed Tests Analysis

### FAIL-001: Unit Test - Service Timeout

```
FAIL src/services/api-client.test.ts
  ✗ should retry on network failure (5023ms)

  Timeout - Async callback was not invoked within 5000ms timeout.

  at src/services/api-client.test.ts:45:5
```

**Root Cause:** Mock timer conflicting with async retry logic
**Fix:** Use `vi.useFakeTimers({ shouldAdvanceTime: true })`
**PR:** #567 (in review)
**Impact:** Low - test infrastructure only

---

### FAIL-002: Integration Test - PR Analysis API

```
FAIL tests/integration/pr-analysis.test.ts
  ✗ should analyze large PR with 100+ files

  Error: Request timeout after 30000ms

  Expected: Analysis result within 30s
  Actual: Timeout
```

**Root Cause:** Large PR processing exceeds test timeout
**Fix:** Increase timeout for heavy operations, add progress tracking
**PR:** #568 (in progress)
**Impact:** Medium - affects large PR workflows

---

### FAIL-003: E2E Test - Checkout Flow

```
FAIL tests/e2e/checkout.spec.ts
  ✗ should complete payment flow

  Error: locator.click: Timeout 30000ms exceeded.
  waiting for locator('[data-testid="pay-button"]')

  Screenshot: test-results/checkout-fail.png
  Video: test-results/checkout-fail.webm
```

**Root Cause:** Stripe payment iframe loading delay (external dependency)
**Fix:** Add explicit wait for iframe + retry logic
**PR:** #569 (investigating)
**Impact:** High - blocks checkout flow verification

---

### FAIL-004: Unit Test - Auth Hook

```
FAIL src/hooks/useAuth.test.ts
  ✗ should refresh token when expired (timeout)

  Error: Token refresh not completed within expected time
```

**Root Cause:** Race condition between token check and refresh
**Fix:** Add proper synchronization
**PR:** #570 (in review)
**Impact:** Low - edge case in token refresh

---

## Test Quality Metrics

### Flaky Test Report (Last 7 Days)

| Test | Flake Rate | Last Flake | Cause | Action |
|------|------------|------------|-------|--------|
| `checkout.spec.ts` | 15% | Today | External iframe | #569 fix |
| `api-client.test.ts` | 8% | Yesterday | Timer mock | #567 fix |

**Flaky Test SLA:** < 5% flake rate
**Current Status:** Above threshold - remediation in progress

### Test Debt Inventory

| Category | Count | Priority | Notes |
|----------|-------|----------|-------|
| Missing Tests | 12 | P2 | New components from Sprint 4 |
| Outdated Mocks | 5 | P3 | API contract changes |
| Skipped Tests | 0 | - | None |
| Slow Tests (>5s) | 3 | P3 | Consider parallelization |

---

## Performance Benchmarks

### Test Suite Performance

| Metric | Baseline | Current | Change | Status |
|--------|----------|---------|--------|--------|
| Total Runtime | 5m 00s | 4m 32s | -9.3% | ✓ Improved |
| Unit Tests | 35s | 32s | -8.6% | ✓ |
| Integration | 2m 10s | 1m 55s | -11.5% | ✓ |
| E2E | 2m 15s | 2m 05s | -7.4% | ✓ |

### Build Performance

| Metric | Baseline | Current | Change | Status |
|--------|----------|---------|--------|--------|
| Cold Build | 45s | 42s | -7% | ✓ |
| Hot Reload | 1.2s | 0.8s | -33% | ✓ |
| Type Check | 8s | 7s | -12.5% | ✓ |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
            test-results/
```

### Test Results in PR

```
✅ All checks passed

  ✓ Lint (23s)
  ✓ Type Check (7s)
  ✓ Unit Tests (32s) - 240/240 passed
  ✓ Integration Tests (1m 55s) - 45/45 passed
  ✓ E2E Tests (2m 05s) - 12/12 passed
  ✓ Coverage (85.00% > 80% threshold)
```

---

## Test Artifacts

| Type | Location | Retention |
|------|----------|-----------|
| Coverage HTML | `./coverage/lcov-report/` | 30 days |
| Playwright Report | `./playwright-report/` | 7 days |
| Screenshots | `./test-results/screenshots/` | 7 days |
| Videos | `./test-results/videos/` | 7 days |
| Traces | `./test-results/traces/` | 7 days |
| JUnit XML | `./test-results/junit.xml` | 90 days |
| JSON Report | `./test-results/results.json` | 90 days |

---

## Recommendations

### Immediate Actions
1. Fix flaky tests before merge (PRs #567, #568, #569, #570)
2. Increase timeout for E2E payment flow
3. Add missing tests for new components

### Short-term Improvements
1. Parallelize slow integration tests
2. Add visual regression testing
3. Implement test impact analysis

### Long-term Strategy
1. Migrate to component testing (Playwright CT)
2. Add contract testing for APIs
3. Implement mutation testing

---

## Parallel AI Synthesis Notes

### Model Contributions

| Model | Focus | Contribution |
|-------|-------|--------------|
| Codex | Test generation | Generated 45 new unit tests |
| ClaudeCode | Test review | Identified 3 missing edge cases |

### Consensus
- Coverage targets appropriate
- E2E flow selection correct
- Test pyramid ratio balanced

### Divergence
- Codex suggested more E2E tests; ClaudeCode preferred unit tests
- **Resolution:** Maintain pyramid ratio, add E2E only for critical paths
