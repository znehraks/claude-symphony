# Stage 06: Implementation

## Objective
Implement the application source code following the task plan, architecture, and UI/UX design.

## Inputs
- `stages/05-task-management/HANDOFF.md` — task plan context
- `stages/05-task-management/outputs/tasks.md` — task list
- `stages/05-task-management/outputs/implementation_order.md` — implementation sequence
- `stages/03-planning/outputs/architecture.md` — architecture design
- `stages/03-planning/outputs/tech_stack.md` — tech stack and API design
- `stages/04-ui-ux/outputs/` — wireframes and components
- `references/06-implementation/` — coding conventions, example code, patterns

## Tasks

1. **Project scaffolding** — initialize the project with the chosen framework, install dependencies
2. **Database setup** — create database schema, migrations, seed data
3. **Core implementation** — implement features following task priority order (P0 first)
4. **API implementation** — build API endpoints per the API design
5. **UI implementation** — build pages and components per the wireframes
6. **Integration** — connect frontend to backend, wire up authentication

## Required Outputs

### Source code (in project root)
- Fully functional application code
- `package.json` with all dependencies
- Database migrations/schema
- Environment configuration (`.env.example`)

### `stages/06-implementation/outputs/implementation_log.md` (required)
- Tasks completed (with task IDs from Stage 05)
- Files created/modified
- Technical decisions made during implementation
- Known issues or shortcuts taken
- Dependencies installed

## Quality Criteria
- Code compiles without errors
- `npm run lint` passes (if configured)
- `npm run typecheck` passes (if TypeScript)
- All P0 tasks are implemented
- Application starts and basic functionality works

## HANDOFF
Generate `stages/06-implementation/HANDOFF.md` summarizing:
- What was implemented (completed task IDs)
- Architecture deviations from plan (if any)
- Technical debt incurred
- Files and modules created
- What needs refactoring attention
