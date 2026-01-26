# /implement

Start the 06-implementation stage directly.

## Usage
```
/implement [task-id]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 06-implementation |
| AI Model | ClaudeCode |
| Execution Mode | Plan Mode + Sandbox |
| Checkpoint | **Required** |
| Timeout | 240 minutes (longest) |

## Actions

1. **Prerequisite Check**
   - 05-task-management completion status
   - tasks.json exists

2. **Execute Implementation**
   - Implementation by task
   - Unit test writing
   - Code quality verification

3. **Output Generation**
   - src/ - Source code
   - tests/ - Unit tests
   - implementation-notes.md

## Execution

```bash
scripts/run-stage.sh 06-implementation "$ARGUMENTS"
```

## Input Files

- `stages/05-task-management/outputs/tasks.json`
- `stages/05-task-management/outputs/sprints.md`
- `stages/04-ui-ux/outputs/wireframes/`

## Output Files

- `stages/06-implementation/outputs/src/`
- `stages/06-implementation/outputs/tests/`
- `stages/06-implementation/outputs/implementation-notes.md`

## Checkpoint Required!

This stage **requires checkpoints**:

```bash
# Execute at major milestones
/checkpoint "Sprint 1 completed"
```

## Completion Criteria

- [ ] All tasks implemented
- [ ] Unit tests passed
- [ ] Lint/type check passed
- [ ] Checkpoint created

## Related Commands

- `/run-stage 06` - Start after prerequisite check
- `/next` - Next stage (07-refactoring)
- `/tasks` - Previous stage
- `/checkpoint` - Create checkpoint
- `/restore` - Restore checkpoint

## Tips

- Create checkpoints by sprint
- Implement with tests
- Record decisions in implementation-notes.md
