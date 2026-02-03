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
- `stages/03-planning/outputs/conventions.md` — project conventions (code style, naming, structure)
- `stages/04-ui-ux/outputs/` — wireframes and components
- `references/06-implementation/` — coding conventions, example code, patterns

## Design Asset Utilization

If Stage 04 produced design assets from Stitch/Pencil.dev MCP tools:
- `stages/04-ui-ux/outputs/design_assets/component_specs.json` — use as component implementation reference
- `stages/04-ui-ux/outputs/design_assets/design_tokens.json` — use for styling (colors, spacing, typography)
- `stages/04-ui-ux/outputs/design_assets/screen_screenshots/` — use as visual reference during implementation
- `stages/04-ui-ux/outputs/design_assets/layout_specs.md` — use for layout implementation

When implementing UI components:
1. Reference the component_specs.json for exact props, variants, and dimensions
2. Apply design_tokens.json values directly (do NOT hardcode colors/spacing)
3. Compare implementation against screen_screenshots for visual accuracy
4. Follow layout_specs.md for grid, spacing, and responsive behavior

If Pencil.dev MCP is available during implementation, use `pencil__get_screenshot` to compare your implementation against the original designs.

### React Best Practices Compliance (React/Next.js projects)
When implementing React/Next.js code, validate against Vercel React Best Practices:
- Source: `https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/AGENTS.md`
- **Critical**: No waterfall chains (use Promise.all), no barrel file imports, strategic Suspense boundaries
- **High**: Server Action authentication, minimize RSC serialization, per-request deduplication
- **Medium**: Derive state during render, narrow effect dependencies, CSS content-visibility for long lists

### Design Asset Change Management
If implementation requires design changes:
1. Update JSON asset with version bump (1.0 → 1.1)
2. Add entry to `stages/04-ui-ux/outputs/design_assets/screen_inventory.md` changelog
3. Document in implementation_log.md: "Modified component_specs.json v1.0 → v1.1 (reason)"
4. DO NOT silently implement differently from the design

### Convention Amendment During Implementation
If a convention blocks implementation:

**In-place amendment (default — most cases):**
1. Document the issue in `stages/03-planning/outputs/conventions-changelog.md`
2. Apply the amendment (version bump in conventions.md) and continue
3. Note in `implementation_log.md`

**Loop-back (emergency only — convention makes implementation impossible):**
Only when: convention is technically impossible to follow AND no in-place workaround exists.
1. Document critical flaw in conventions-changelog.md
2. `/checkpoint "Pre-loopback — Convention critical flaw"`
3. `/goto 03-planning -r "CRITICAL: Convention [description] blocks implementation"`

NEVER silently deviate — all deviations must be documented.

### Critical Flaw Loop-Back (Emergency Only)
Loop-back is a last resort. Exhaust all in-place solutions first.

A loop-back is justified ONLY when the flaw is:
- **Blocking**: Cannot write correct code that satisfies requirements
- **Unfixable here**: Requires changes to architecture, design, or task structure from an earlier stage
- **Documented**: Critical Flaw Report written in `implementation_log.md`

If all criteria are met:
1. `/checkpoint "Pre-loopback from 06 — [flaw]"`
2. `/goto <target-stage> -r "CRITICAL: [description]"`

Most issues (convention tweaks, design adjustments, task updates) should be handled in-place with changelog documentation.

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
- If any fail → fix before proceeding
```

#### Step D: Refactor (if needed)
```
- Check against conventions.md (naming, structure, style)
- Look for code smells, duplication, complexity
- Don't create unnecessary work — only refactor if there's a real issue
```

#### Step E: Re-verify (after refactoring)
```
- Run: npm test (all tests must still pass)
- Run: npm run build (must compile)
- If any fail → fix before proceeding to next feature
```

**Repeat A→B→C→D→E for every feature. No exceptions.**

### Refactoring Quality Metrics

Track in `refactoring_report.md` > Metrics Summary section:

| Metric | Type | Description | Target |
|--------|------|-------------|--------|
| files_reviewed | `string[]` | Relative paths of reviewed files | 100% of modified files |
| violations | `Record<string, string[]>` | File path → list of violation descriptions | Document all |
| violations_fixed | `Record<string, string[]>` | File path → list of fixed violations | 100% |
| duplication_removed | `Record<string, string[]>` | File path → list of removed duplications | Track all |
| complexity_hotspots | `Record<string, string[]>` | File path → list of complex functions/issues | List each |

**Key naming convention:**
- Use relative file paths as keys (e.g., `"src/auth/login.ts"`)
- Use `"_general"` as a reserved key for cross-cutting issues not attributable to a single file
  - e.g., `"_general": ["Inconsistent naming convention across 12 files", "No shared error handling pattern"]`

**Example:**
```json
{
  "files_reviewed": ["src/auth/login.ts", "src/api/users.ts", "src/utils/validate.ts"],
  "violations": {
    "src/auth/login.ts": ["Missing input validation on password field", "No error type narrowing"],
    "src/api/users.ts": ["Hardcoded timeout value"],
    "_general": ["Inconsistent error response format across API handlers"]
  },
  "violations_fixed": {
    "src/auth/login.ts": ["Added zod validation for password", "Added type guard"],
    "src/api/users.ts": ["Extracted timeout to config constant"]
  },
  "duplication_removed": {
    "src/auth/login.ts": ["Duplicate token refresh logic (extracted to src/utils/token.ts)"]
  },
  "complexity_hotspots": {
    "src/api/users.ts": ["processUserUpdate — cyclomatic complexity 15, refactored to 8"],
    "_general": ["Deep callback nesting pattern in 3 API handlers"]
  }
}
```

**Why file-path keys?** Enables git-based traceability: `git log -- <path>` and `git diff <path>` to verify each reviewed file's change history.

### 4. E2E Test Sheet (Mandatory — Updated Per Task)

Maintain `e2e-test-sheet.md` in the project root throughout implementation.

**Rule: On every task completion (or when work produces an E2E-testable flow):**
1. Add the corresponding scenario to `e2e-test-sheet.md`
2. Write E2E test code (Playwright or Cypress)
3. Run E2E tests — must pass before moving to the next task

E2E Test Sheet Format (`e2e-test-sheet.md`):
```markdown
| # | Scenario | Steps | Expected | Status | Sprint | Task ID |
|---|----------|-------|----------|--------|--------|---------|
| 1 | User signup | Go to /signup -> Fill form -> Submit | Redirect to dashboard | PASS | S1 | T-001 |
| 2 | Core feature happy path | Login -> Use feature -> Verify | Expected outcome shown | PASS | S1 | T-003 |
```

### 5. Sprint Completion Gate (E2E Mandatory)

At each Sprint completion, you MUST:
1. Run all E2E scenarios added in the current Sprint
2. Re-run all E2E scenarios from previous Sprints (regression)
3. Run full unit/integration test suite
4. **Sprint-level refactoring review:**
   - Convention compliance check (verify conventions.md code conventions are followed)
   - Code review across Sprint scope (duplication, structure, consistency)
5. Re-run full test suite after refactoring (unit + integration + E2E regression)
6. **All tests must pass before the next Sprint can begin**

#### Sprint Milestone Checklist
- [ ] **Pre-Sprint**: Sprint goal defined, dependencies verified
- [ ] **Mid-Sprint**: Unit tests passing, integration tests written, refactoring metrics updated
- [ ] **Sprint Review**: All tests pass, convention compliance checked, metrics finalized

Sprint transition checklist:
- [ ] All tasks in this Sprint completed
- [ ] All E2E scenarios for this Sprint show PASS in `e2e-test-sheet.md`
- [ ] Previous Sprint scenarios have no regressions
- [ ] Sprint-level refactoring review completed (convention compliance + code quality)
- [ ] `npm test` passes (unit + integration) — including post-refactoring
- [ ] `npm run test:e2e` passes (all E2E) — including post-refactoring

If any test fails: fix the issue and re-run. Do NOT proceed to the next Sprint with failing tests.

### 6. Integration
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

### `stages/06-implementation/outputs/refactoring_report.md` (required)
- Task-level refactoring summary (what was refactored per task)
- Sprint-level refactoring summary (cross-cutting improvements per sprint)
- Final codebase review results (convention compliance, architecture alignment)
- Refactoring points identified and addressed
- Convention compliance results (pass/fail per convention category)
- Must include **Metrics Summary** section with quantitative data (files_reviewed, violations_found/fixed, duplication_removed, complexity_hotspots)

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

## Stage Completion: Full Codebase Review & Final Refactoring

After all Sprints are complete, before Stage 06 can be marked done:

1. **Full codebase review:**
   - Architecture flow verification (compare against Stage 03 architecture.md)
   - Code consistency audit (conventions.md code conventions — full sweep)
   - Naming convention check (files, folders, variables, functions, components)
2. **Identify refactoring points** — duplicated code, complexity hotspots, unused code, performance issues, convention violations
3. **Execute refactoring** — address all identified points
4. **Re-run full test suite** — unit + integration + E2E (all must pass)
5. **Generate `refactoring_report.md`** — document all changes, convention compliance results

The stage CANNOT be completed until the full codebase review passes and all tests pass.

## CRITICAL: Process Enforcement

The TDD + Refactoring process is NON-NEGOTIABLE. The following sequence MUST be followed for every task:

1. Write Tests → 2. Implement → 3. Verify (pass) → 4. Refactor (convention check) → 5. Re-verify (pass)

**VIOLATIONS (will cause stage FAILURE):**
- Implementing code before writing tests
- Skipping the refactoring step
- Skipping convention compliance check during refactoring
- Proceeding to next task with failing tests
- Skipping Sprint-level refactoring review
- Marking stage complete without full codebase review

Each violation must be caught and corrected immediately. There are no exceptions.

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
