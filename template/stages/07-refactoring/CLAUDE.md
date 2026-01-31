# Stage 07: Refactoring

## Objective
Review and improve code quality, eliminate technical debt, and optimize performance — **without breaking existing tests**.

## Core Principle: Tests Must Stay Green

Every refactoring change must preserve the existing test suite. Run tests after each significant refactoring step. If a test breaks, fix the refactoring (not the test) unless the test was genuinely wrong.

## Inputs
- `stages/06-implementation/HANDOFF.md` — implementation context
- `stages/06-implementation/outputs/implementation_log.md` — what was built
- `stages/06-implementation/outputs/test_summary.md` — current test coverage
- Source code in project root
- `references/07-refactoring/` — code quality rules, performance benchmarks

## Tasks

1. **Run existing test suite** — establish baseline (all tests must pass before starting)
2. **Code review** — identify code smells, duplication, complexity issues
3. **Refactoring** — apply refactoring patterns (extract method, rename, simplify conditionals)
   - After each refactoring pass: `npm test` must pass
4. **Performance optimization** — identify and fix performance bottlenecks
5. **Dependency audit** — check for unused/outdated dependencies
6. **Code organization** — ensure consistent file structure and naming conventions
7. **Test coverage check** — verify coverage has not decreased from Stage 06
   - If coverage dropped: add tests for uncovered refactored code

## Required Outputs

### Updated source code (in project root)
- Refactored code with improved quality

### `stages/07-refactoring/outputs/refactoring_report.md` (required)
- Issues found (categorized: critical, major, minor)
- Changes made (file, what changed, why)
- Performance improvements (before/after if measurable)
- Remaining technical debt
- Code quality score assessment
- **Test results after refactoring** (pass count, coverage %)
- **Coverage comparison** (before vs after refactoring)

## Quality Criteria
- **All existing tests still pass** (zero regressions)
- Test coverage has not decreased (equal or higher than Stage 06)
- Code passes linting and type checking
- Duplicated code eliminated or justified
- Functions/methods are under 50 lines
- Clear naming conventions used throughout

## HANDOFF
Generate `stages/07-refactoring/HANDOFF.md` summarizing:
- Key refactoring changes made
- Remaining code quality concerns
- Performance optimizations applied
- **Test status**: all passing, coverage percentage
- Areas needing QA attention
