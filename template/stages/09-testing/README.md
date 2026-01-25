# Stage 09: Testing & E2E

Test code writing and E2E testing

## Overview

This stage writes comprehensive tests including unit tests, integration tests, and end-to-end tests using Playwright.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Codex | Test code generation |
| Secondary | ClaudeCode | Test validation |

**Collaboration Mode**: Parallel execution

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../08-qa/HANDOFF.md

# Setup test environment
npm install -D vitest @testing-library/react
npm install -D @playwright/test
npx playwright install
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 09-testing

# Method 2: Direct script execution
../../scripts/run-stage.sh 09-testing
```

### 3. Manual Workflow

```bash
# Step 1: Unit tests with Codex
/codex "Write unit tests for..."

# Step 2: Integration tests

# Step 3: E2E tests with Playwright

# Step 4: Coverage analysis

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
09-testing/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── unit_tests.md   # Unit test prompt
│   ├── integration_tests.md  # Integration test prompt
│   └── e2e_tests.md    # E2E test prompt
├── templates/
├── inputs/             # Input files
├── outputs/
│   ├── tests/          # Test code
│   ├── test_report.md
│   └── coverage_report.md
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Git Commit Rules

> **CRITICAL**: Git commit required after each test implementation

```bash
# Per-task commit
git add <relevant-files>
git commit -m "test(test): <test description>"
git status  # Verify clean state
```

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

## Completion Criteria

- [ ] Unit tests written (coverage 80%+)
- [ ] Integration tests written
- [ ] E2E tests written (core flows)
- [ ] All tests passing
- [ ] Coverage report generated
- [ ] HANDOFF.md generated

## Outputs

| File | Description |
|------|-------------|
| `outputs/tests/` | Test code |
| `outputs/test_report.md` | Test results report |
| `outputs/coverage_report.md` | Coverage report |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 10-deployment**: CI/CD and deployment

## Tips

1. **Coverage focus**: Aim for meaningful coverage, not just numbers
2. **Avoid flaky tests**: Tests should be deterministic
3. **No hardcoded values**: Use fixtures and factories
4. **E2E for critical flows**: Focus on user journeys
