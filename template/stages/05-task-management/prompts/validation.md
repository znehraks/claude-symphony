# Output Validation Prompt - Task Management

## Validation Targets

| Output | Required Conditions | Validation Method |
|--------|---------------------|-------------------|
| `tasks.md` | Complete task list | Structure verification |
| `sprint_plan.md` | 3+ sprints | Count verification |
| `milestones.md` | Deliverables defined | Structure verification |
| `HANDOFF.md` | First sprint tasks | Item verification |

## Validation Command

```bash
/validate --stage 05-task-management
```

## Quality Criteria

### tasks.md
- [ ] MoSCoW classification applied
- [ ] Estimated time for each task
- [ ] Dependencies specified
- [ ] Assigned stage designated

### sprint_plan.md
- [ ] 3+ sprints
- [ ] Capacity calculation per sprint
- [ ] Buffer time included
- [ ] Priority-based allocation

### milestones.md
- [ ] Deliverables defined per milestone
- [ ] Success criteria specified
- [ ] Validation methods included

### HANDOFF.md
- [ ] Sprint 1 task list
- [ ] Dependency graph
- [ ] Priority implementation items

## Automated Validation Script

```bash
# Check task count
grep -c "^- TASK-" outputs/tasks.md

# Check sprint count
grep -c "^## Sprint" outputs/sprint_plan.md

# Check milestone count
grep -c "^## Milestone" outputs/milestones.md

# Check dependency graph existence
grep -c "→" outputs/tasks.md
```

## Task Quality Check

```bash
# Check for missing estimated time
grep -E "^- TASK-" outputs/tasks.md | grep -v -E "\([0-9]+h\)"

# Check for missing dependencies
grep -E "^- TASK-" outputs/tasks.md | grep -v "dependency"
```
