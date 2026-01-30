# Auto-Checkpoint Hook

Automatically creates checkpoints based on trigger conditions using the checkpoint-manager-agent.

## Trigger Conditions

All conditions are evaluated continuously. Checkpoint is created when ANY condition is met:

| Trigger | Condition | Priority |
|---------|-----------|----------|
| Task-based | 5 tasks completed | Medium |
| File change | 100+ lines changed | Medium |
| Time-based | 30 minutes elapsed | Low |
| Destructive operation | rm, delete, drop patterns detected | Critical |
| Stage completion | Stage marked complete | High |

## Agent Execution

**Agent**: checkpoint-manager-agent
**Mode**: Background (non-blocking)
**Model**: Haiku (lightweight, fast)

### Execution Flow

```
Trigger Detected

↓

Evaluate Risk Score
├─ Critical (destructive op) → Score: 1.0
├─ High (stage complete) → Score: 0.8
├─ Medium (tasks/files) → Score: 0.5
└─ Low (time-based) → Score: 0.3

↓

Spawn checkpoint-manager-agent (background)

↓

Agent Tasks (in parallel with main work)
├─ Archive changed files → checkpoint_{id}.tar.gz
├─ Create metadata → metadata.json
├─ Create git tag → checkpoint_{id}
└─ Cleanup old checkpoints (if > max_retention)

↓

Log Result
├─ ✅ Success → Log checkpoint ID
└─ ❌ Fail → Log error (non-blocking)
```

## Checkpoint Metadata

```json
{
  "id": "checkpoint_20260128_120000_06-implementation",
  "timestamp": "2026-01-28T12:00:00Z",
  "stage": "06-implementation",
  "trigger": "task_count",
  "risk_score": 0.5,
  "files_changed": 12,
  "lines_changed": 150,
  "tasks_completed": 5,
  "git_tag": "checkpoint_20260128_120000"
}
```

## Retention Policy

- **Max checkpoints**: 20 (default)
- **Milestone preservation**: Stage completion checkpoints never deleted
- **Cleanup strategy**: Delete oldest non-milestone checkpoint first

## Configuration

```yaml
# config/auto_checkpoint.yaml
enabled: true
triggers:
  task_count:
    enabled: true
    threshold: 5
  file_changes:
    enabled: true
    threshold: 100
  time_elapsed:
    enabled: true
    threshold_minutes: 30
  destructive_ops:
    enabled: true
    patterns: ["rm -rf", "DROP TABLE", "DELETE FROM"]
  stage_completion:
    enabled: true
retention:
  max_checkpoints: 20
  preserve_milestones: true
agent:
  mode: background
  model: haiku
```

## Performance

- **Average time**: 5-10 seconds (background, non-blocking)
- **Storage**: ~1-5 MB per checkpoint
- **Success rate**: 99%+

## Manual Checkpoint

```bash
# Force checkpoint creation
/checkpoint

# With description
/checkpoint --description "Before major refactoring"
```

## Restore from Checkpoint

```bash
# List checkpoints
/restore --list

# Restore specific checkpoint
/restore checkpoint_20260128_120000

# Smart rollback (uses smart-rollback-agent)
/restore --smart
```

## Disable Auto-Checkpoint

```bash
# Temporarily disable for session
/config checkpoint disable

# Re-enable
/config checkpoint enable
```

## Error Handling

| Error | Behavior |
|-------|----------|
| Agent spawn fails | Log error, continue work |
| Archive fails | Log error, skip checkpoint |
| Git tag fails | Create checkpoint anyway |
| Cleanup fails | Keep all checkpoints |

**Note**: All checkpoint errors are non-blocking and logged only.

## Agent Model Selection

When spawning **checkpoint-manager-agent**:
1. Read `.claude/agents/checkpoint-manager-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter (expected: `haiku`)
3. If `"inherit"` or absent, omit the `model` parameter

> **STRICT**: checkpoint-manager-agent MUST use `haiku` model for cost efficiency. This agent runs frequently in background — using a larger model wastes resources.

## Related

- `/checkpoint` - Manual checkpoint
- `/restore` - Restore from checkpoint
- `smart-rollback-agent` - Intelligent rollback recommendations
