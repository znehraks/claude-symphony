# AI Collaboration Prompt - Testing & E2E

## Collaboration Mode: Test Generation Chain

This stage uses **test generation chain** to write comprehensive tests.

### Participating Models
- **Codex**: Test code generation
- **ClaudeCode**: E2E tests, Playwright integration

### Collaboration Prompt

```
# Test generation chain
/collaborate --mode sequential --chain "codex:unit_tests -> codex:integration_tests -> claude:e2e_tests"
```

### Test Layers

| Layer | Responsible AI | Tools |
|-------|---------------|-------|
| Unit Tests | Codex | Vitest/Jest |
| Integration Tests | Codex | Testing Library |
| E2E Tests | Claude | Playwright |

### Codex Usage

```bash
# Unit test generation
/codex "Write unit tests for the following function:
[function code]
Test framework: Vitest
Coverage target: 80%"

# E2E test generation
/codex "Write Playwright tests for the following user flows:
1. Login
2. Core features
3. Error scenarios"
```

### MCP Server: Playwright

```javascript
// E2E test example
test('Login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Output Format

```markdown
## AI Collaboration Results

### Codex Unit Tests
- [File]: [Test case count]
...

### Codex Integration Tests
- [Scenario]: [Coverage]
...

### Claude E2E Tests
- [Flow]: [Test cases]
...

### Coverage Summary
- Statements: X%
- Branches: X%
- Functions: X%
- Lines: X%
```
