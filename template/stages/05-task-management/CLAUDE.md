# Stage 05: Task Management

## Objective
Decompose the project plan into implementable tasks with clear priorities and dependencies.

## Inputs
- `stages/03-planning/HANDOFF.md` — architecture and plan context
- `stages/04-ui-ux/HANDOFF.md` — UI/UX design context
- `stages/03-planning/outputs/project_plan.md` — milestone plan
- `stages/04-ui-ux/outputs/components.md` — component specifications
- `references/05-task-management/` — task templates, sprint examples

## Tasks

1. **Task decomposition** — break down each milestone into implementable tasks (4-8 hours each)
2. **Dependency mapping** — identify task dependencies and ordering constraints
3. **Priority assignment** — assign priority (P0-P3) based on feature criticality and dependencies
4. **Implementation ordering** — determine optimal implementation sequence
5. **Acceptance criteria** — define clear done criteria for each task

## Required Outputs

Save all files to `stages/05-task-management/outputs/`:

### `tasks.md` (required)
- Complete task list with:
  - Task ID, title, description
  - Priority (P0-P3)
  - Estimated effort (S/M/L/XL)
  - Dependencies (which tasks must complete first)
  - Acceptance criteria
- Tasks grouped by milestone/feature area

### `implementation_order.md` (required)
- Ordered list of tasks for implementation
- Dependency graph (text-based)
- Critical path identified
- Parallel work opportunities noted

## Quality Criteria
- Every feature from planning maps to at least one task
- No task is larger than 1 day of work
- Dependencies are acyclic (no circular dependencies)
- Acceptance criteria are testable

## HANDOFF
Generate `stages/05-task-management/HANDOFF.md` summarizing:
- Total task count and distribution by priority
- Implementation order rationale
- Critical path tasks
- First 5 tasks to implement
