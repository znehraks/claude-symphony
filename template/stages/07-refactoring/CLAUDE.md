# Stage 07: Refactoring

## Objective
Review and improve code quality, eliminate technical debt, and optimize performance.

## Inputs
- `stages/06-implementation/HANDOFF.md` — implementation context
- `stages/06-implementation/outputs/implementation_log.md` — what was built
- Source code in project root
- `references/07-refactoring/` — code quality rules, performance benchmarks

## Tasks

1. **Code review** — identify code smells, duplication, complexity issues
2. **Refactoring** — apply refactoring patterns (extract method, rename, simplify conditionals)
3. **Performance optimization** — identify and fix performance bottlenecks
4. **Dependency audit** — check for unused/outdated dependencies
5. **Code organization** — ensure consistent file structure and naming conventions

## Required Outputs

### Updated source code (in project root)
- Refactored code with improved quality

### `stages/07-refactoring/outputs/refactoring_report.md` (required)
- Issues found (categorized: critical, major, minor)
- Changes made (file, what changed, why)
- Performance improvements (before/after if measurable)
- Remaining technical debt
- Code quality score assessment

## Quality Criteria
- No regression in existing functionality
- Code passes linting and type checking
- Duplicated code eliminated or justified
- Functions/methods are under 50 lines
- Clear naming conventions used throughout

## HANDOFF
Generate `stages/07-refactoring/HANDOFF.md` summarizing:
- Key refactoring changes made
- Remaining code quality concerns
- Performance optimizations applied
- Areas needing QA attention
