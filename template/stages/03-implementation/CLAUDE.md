# Stage 03: Implementation

## PRIMARY OUTPUT: Source Code in Project Root

This stage's primary deliverable is **actual source code files created in the project root**.
Documentation files are secondary deliverables.

**SuperClaude Command**: `/sc:implement --with-tests`

**Recommended MCP**: magic, context7

## Inputs
- `stages/02-ui-ux/HANDOFF.md` — context from UI/UX design
- `stages/01-planning/outputs/architecture.md` — architecture design
- `stages/01-planning/outputs/tech_stack.md` — tech stack and API design
- `stages/01-planning/outputs/conventions.md` — project conventions
- `stages/02-ui-ux/outputs/design_tokens.json` — design tokens
- `stages/02-ui-ux/outputs/component_specs.md` — component specifications
- `state/research/combined_patterns.json` — best practices
- `references/03-implementation/` — coding examples, patterns

## Validation Criteria (FAIL if not met)
- Source code files in project root: **minimum 5**
- Project manifest exists (package.json, *.csproj, pyproject.toml, Cargo.toml, go.mod)
- Build command succeeds
- Test command succeeds (80%+ pass rate)

**CRITICAL**: If project root has no source code, this stage is FAILED.

## Tasks

### 1. Task Decomposition
Before implementation, break down the work:
- Create `tasks.md` with all implementation tasks
- Assign priority (P0-P3) and effort (S/M/L/XL)
- Define dependencies between tasks
- Establish implementation order

### 2. Project Scaffolding

Initialize the project based on tech stack:

| Stack | Init Command | Manifest | Test Setup |
|-------|-------------|----------|------------|
| Node.js/TypeScript | `npm init` / framework CLI | `package.json` | Vitest/Jest |
| .NET/C# | `dotnet new` | `*.csproj` | xUnit/NUnit |
| Python | `poetry init` | `pyproject.toml` | pytest |
| Rust | `cargo init` | `Cargo.toml` | `cargo test` |
| Go | `go mod init` | `go.mod` | `go test` |

- **MUST create project manifest**
- Set up test infrastructure immediately
- Use the **Write** tool to create actual files

### 3. TDD Implementation (per feature)

For EACH feature in priority order:

#### Step A: Write Tests First
```
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI
```

#### Step B: Write Implementation
```
- Implement minimum code to make tests pass
- Follow architecture from Stage 01
- Follow UI design from Stage 02
```

#### Step C: Verify
```
- Run: npm test (all tests must pass)
- Run: npm run build (must compile)
- If any fail → fix before proceeding
```

#### Step D: Refactor
```
- Check against conventions.md
- Look for code smells, duplication
- Only refactor if there's a real issue
```

#### Step E: Re-verify
```
- Run full test suite again
- Must pass before next feature
```

**Repeat A→B→C→D→E for every feature.**

### 4. Database Setup
- Create database schema, migrations, seed data
- Write tests for data models
- Verify: schema tests pass

### 5. Core Implementation
- Implement backend APIs
- Implement frontend components
- Wire authentication
- Connect frontend to backend

### 6. E2E Test Sheet
Maintain `e2e-test-sheet.md` in project root:

```markdown
| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| 1 | User signup | Go to /signup -> Fill -> Submit | Dashboard | PASS |
```

### 7. Integration
- Connect all components
- Run full test suite
- Fix any broken tests

## MCP Integration (Recommended)

### Using Context7 (if available)
```
mcp__context7__query-docs("react", "hooks patterns")
```

### Using Magic (if available)
```
mcp__magic__21st_magic_component_builder(...)
```

**Note**: MCP usage is recommended but not required.

## Required Outputs

### Source code (in project root)
- Fully functional application code
- `package.json` with all dependencies
- Test files
- Database migrations/schema
- Environment configuration (`.env.example`)

### `stages/03-implementation/outputs/tasks.md` (required)
- Task list with priorities
- Implementation order
- Dependencies

### `stages/03-implementation/outputs/implementation_log.md` (required)
- Tasks completed
- Test results summary
- Files created/modified
- Technical decisions made
- Dependencies installed

### `stages/03-implementation/outputs/test_summary.md` (required)
- Unit test count and pass rate
- Integration test count and pass rate
- Coverage report (if available)

## Convention Compliance
Reference `stages/01-planning/outputs/conventions.md`:
- Follow file/folder naming
- Apply coding style
- Use defined error handling patterns
- Follow test naming conventions

## Quality Gate

**ALL must pass before stage completion:**

### Source Code Verification (HARD FAIL)
- [ ] Source code files exist (minimum 5)
- [ ] Project manifest exists

### Build & Test
| Manifest | Build | Test |
|----------|-------|------|
| `package.json` | `npm run build` | `npm test` |
| `*.csproj` | `dotnet build` | `dotnet test` |
| `pyproject.toml` | `python -m py_compile` | `pytest` |
| `Cargo.toml` | `cargo build` | `cargo test` |
| `go.mod` | `go build ./...` | `go test ./...` |

- [ ] Build succeeds
- [ ] Tests pass (80%+ pass rate)
- [ ] All P0 tasks implemented

## Quality Checks (Automated)
- `build`: npm run build (blocking)
- `test`: npm run test, 80% pass rate (critical)
- `source_files`: minimum 5 source files (blocking)
- `manifest_exists`: package.json exists (blocking)

## Anti-Patterns (Do NOT Do)
- Writing all code first, then tests at the end
- Writing empty/always-pass tests
- Skipping E2E tests
- Leaving failing tests
- Disabling tests to make suite pass

## HANDOFF
Generate `stages/03-implementation/HANDOFF.md` summarizing:
- What was implemented (task IDs)
- Test results: total, pass rate, coverage
- Architecture deviations (if any)
- Technical debt incurred
- Files and modules created
- What QA stage needs to know
