# Stage 06: Implementation (TDD-First)

## PRIMARY OUTPUT: Source Code in Project Root

This stage's primary deliverable is **actual source code files created in the project root**.
Markdown documents (implementation_log.md, test_summary.md) are secondary deliverables.

### Sequential Workflow
This stage uses a sequential workflow (NOT debate):
1. **Coder**: Project scaffolding + source code writing (Write tool to create real files)
2. **Reviewer**: Code review + feedback
3. **Coder (Fix)**: Apply feedback to actual files
4. **Tester**: Write tests + run build/tests (Bash tool)
5. On failure: Coder fixes (up to 3 cycles)

### Validation Criteria (FAIL if not met)
- Source code files in project root: **minimum 5**
- Project manifest exists (package.json, *.csproj, pyproject.toml, Cargo.toml, go.mod)
- Build command succeeds
- Test command succeeds

**CRITICAL**: If `stages/06/outputs/` contains only markdown and the project root has no source code, this stage is FAILED.

## Objective
Implement the application source code using **Test-Driven Development (TDD)**. Every feature must have tests written BEFORE implementation code. No feature is considered done until its tests pass.

## Core Principle: Write-Test-Verify Loop

```
For EACH feature/component:
  1. Write tests first (unit + integration)
  2. Write implementation code
  3. Run tests → must pass before moving to next feature
  4. If tests fail → fix implementation, re-run (do NOT skip)
```

**This is not optional.** Do not batch-write all code first and test later. Each feature goes through the full Write-Test-Verify cycle before starting the next one.

## Inputs
- `stages/05-task-management/HANDOFF.md` — task plan context
- `stages/05-task-management/outputs/tasks.md` — task list
- `stages/05-task-management/outputs/implementation_order.md` — implementation sequence
- `stages/03-planning/outputs/architecture.md` — architecture design
- `stages/03-planning/outputs/tech_stack.md` — tech stack and API design
- `stages/04-ui-ux/outputs/` — wireframes and components
- `references/06-implementation/` — coding conventions, example code, patterns

## Tasks

### 1. Project Scaffolding (Framework-Agnostic)

Initialize the project based on the tech stack chosen in Stage 03:

| Stack | Init Command | Manifest | Test Setup |
|-------|-------------|----------|------------|
| Node.js/TypeScript | `npm init` / framework CLI | `package.json` | Vitest/Jest, testing-library |
| .NET/C# | `dotnet new` | `*.csproj` | xUnit/NUnit |
| Python | `poetry init` / `pip` | `pyproject.toml` | pytest |
| Rust | `cargo init` | `Cargo.toml` | built-in `cargo test` |
| Go | `go mod init` | `go.mod` | built-in `go test` |
| Unity/C# | Unity project setup | `*.csproj` / `Assembly-CSharp` | Unity Test Framework |

- **MUST create project manifest** — without it, validation will FAIL
- Set up test infrastructure immediately
- Verify: test command runs successfully (even with 0 tests)
- Use the **Write** tool to create actual files — do NOT just describe them in markdown

### 2. Database Setup
- Create database schema, migrations, seed data
- **Write tests for data models and migrations**
- Verify: schema tests pass

### 3. Core Implementation (TDD — per feature)

For each feature in priority order (P0 first):

#### Step A: Write Tests First
```
- Unit tests for business logic, utilities, data transformations
- Integration tests for API endpoints (request → response)
- Component tests for UI (render, props, user interaction)
```

#### Step B: Write Implementation
```
- Implement the minimum code to make tests pass
- Follow architecture from Stage 03
- Follow UI design from Stage 04
```

#### Step C: Verify
```
- Run: npm test (all tests must pass)
- Run: npm run build (must compile)
- Run: npm run lint (must pass)
- If any fail → fix before proceeding to next feature
```

**Repeat A→B→C for every feature. No exceptions.**

### 4. E2E Tests (Written During Implementation)

Write E2E tests for critical user flows as you implement them:
- User registration/login flow
- Core feature happy path (the main thing the app does)
- Error states and edge cases for primary flows

E2E tests should use Playwright or Cypress. Example:
```
Test: "User creates an account and uses the main feature"
  1. Navigate to signup page
  2. Fill in form, submit
  3. Verify redirect to dashboard
  4. Use the core feature
  5. Verify expected outcome
```

### 5. Integration
- Connect frontend to backend
- Wire up authentication
- **Run full test suite after integration**
- Fix any broken tests before proceeding

## Required Outputs

### Source code (in project root)
- Fully functional application code
- `package.json` with all dependencies
- Test files alongside source (or in `__tests__/` directories)
- Test configuration files (vitest.config.ts, playwright.config.ts, etc.)
- Database migrations/schema
- Environment configuration (`.env.example`)

### `stages/06-implementation/outputs/implementation_log.md` (required)
- Tasks completed (with task IDs from Stage 05)
- **Test results summary** (total tests, passed, failed)
- **Test coverage percentage** (if available)
- Files created/modified
- Technical decisions made during implementation
- Known issues or shortcuts taken
- Dependencies installed

### `stages/06-implementation/outputs/test_summary.md` (required)
- Unit test count and pass rate
- Integration test count and pass rate
- E2E test count and pass rate
- Coverage report (line, branch, function percentages)
- List of untested areas (with justification)

## Quality Gate — Stage Completion Checklist

**ALL of the following must pass before this stage is complete:**

### Source Code Verification (HARD FAIL)
- [ ] Source code files exist in project root (minimum 5 files)
- [ ] Project manifest exists (package.json, *.csproj, pyproject.toml, Cargo.toml, go.mod)

### Build & Test (project-type-dependent)
| Manifest | Build | Test | Lint |
|----------|-------|------|------|
| `package.json` | `npm run build` | `npm test` | `npm run lint` |
| `*.csproj` | `dotnet build` | `dotnet test` | — |
| `pyproject.toml` | `python -m py_compile` | `pytest` | `ruff check` |
| `Cargo.toml` | `cargo build` | `cargo test` | `cargo clippy` |
| `go.mod` | `go build ./...` | `go test ./...` | `go vet ./...` |

- [ ] Build command succeeds
- [ ] Test command succeeds — all tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Lint passes (if configured, optional)
- [ ] Typecheck passes (if TypeScript, optional)
- [ ] All P0 tasks are implemented with tests
- [ ] Test coverage >= 60% for core modules

**If source code or manifest is missing, or build/test fails, this stage CANNOT be marked complete.** Fix the issue and re-verify.

## Anti-Patterns (Do NOT Do These)

- Writing all implementation code first, then adding tests at the end
- Writing tests that don't actually test behavior (empty tests, always-pass tests)
- Skipping E2E tests because "unit tests are enough"
- Leaving failing tests and moving to the next feature
- Disabling tests to make the suite pass

## HANDOFF
Generate `stages/06-implementation/HANDOFF.md` summarizing:
- What was implemented (completed task IDs)
- **Test results**: total tests, pass rate, coverage percentage
- Architecture deviations from plan (if any)
- Technical debt incurred
- Files and modules created
- What needs refactoring attention
- **Failing or flaky tests** (if any remain)
