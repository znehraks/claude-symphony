# AI Collaboration Prompt - Task Management

## Collaboration Mode: Sequential Review

This stage uses **sequential review** mode to ensure completeness of task breakdown.

### Participating Models
- **ClaudeCode**: Task breakdown, dependency analysis

### Collaboration Prompt

```
# Single model with iterative review
/collaborate --mode sequential --chain "claudecode:decompose -> claudecode:review"
```

### Workflow

1. **Initial Breakdown**: Feature → Epic → Story → Task
2. **Dependency Analysis**: Identify task relationships
3. **Review and Adjustment**: Identify missing/duplicate tasks

### Task Quality Criteria

| Criteria | Description |
|----------|-------------|
| Atomicity | Cannot be broken down further |
| Clarity | Clear completion criteria |
| Independence | Minimal dependencies |
| Estimable | Time estimation possible |

### Notion Integration

Must follow when creating tasks:
- Create one at a time sequentially
- Status field required (default: To Do)
- Specify order with Order field

### Output Format

```markdown
## Task Breakdown Results

### Epic 1: [Epic Name]
#### Story 1.1: [Story Name]
- TASK-001: [Task] (2h)
- TASK-002: [Task] (4h)
...

### Dependency Graph
TASK-001 → TASK-003
TASK-002 → TASK-004
...
```
