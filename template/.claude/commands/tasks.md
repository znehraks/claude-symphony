# /tasks

Start the 05-task-management stage directly.

## Usage
```
/tasks
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 05-task-management |
| AI Model | ClaudeCode |
| Execution Mode | Plan Mode |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 04-ui-ux completion status
   - wireframes/, component-spec.md exist

2. **Task Breakdown**
   - Extract tasks from PRD
   - Dependency analysis
   - Sprint planning

3. **Output Generation**
   - tasks.json - Task list (structured)
   - sprints.md - Sprint plan

## Execution

```bash
scripts/run-stage.sh 05-task-management "$ARGUMENTS"
```

## Input Files

- `stages/03-planning/outputs/PRD.md`
- `stages/04-ui-ux/outputs/wireframes/`
- `stages/04-ui-ux/outputs/component-spec.md`

## Output Files

- `stages/05-task-management/outputs/tasks.json`
- `stages/05-task-management/outputs/sprints.md`

## tasks.json Structure

```json
{
  "tasks": [
    {
      "id": "T001",
      "title": "Implement user authentication",
      "sprint": 1,
      "priority": "high",
      "dependencies": [],
      "estimate": "4h",
      "status": "pending"
    }
  ]
}
```

## Related Commands

- `/run-stage 05` - Start after prerequisite check
- `/next` - Next stage (06-implementation)
- `/ui-ux` - Previous stage
- `/implement` - Start implementation directly

## Tips

- Break tasks into 4-hour or less units
- Mark dependencies clearly
- Recommend 5-7 tasks per sprint
