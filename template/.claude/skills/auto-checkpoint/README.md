# Auto-Checkpoint Skill

Automatic checkpoint creation and smart rollback skill

## Overview

Automatic checkpoint system for work safety:
- Condition-based automatic checkpoint creation
- Smart rollback suggestion and execution
- Pipeline forking support

## Trigger

### Auto Trigger
- Every 5 completed tasks
- When 100+ lines of file changes
- When destructive action detected
- 30 minute intervals (when changes exist)
- On stage completion

### Manual Trigger
- `/checkpoint` command

## Features

### 1. Auto Checkpoint (trigger.md)
- Condition detection and checkpoint creation
- Metadata recording
- Git tag integration

### 2. Smart Rollback (rollback.md)
- Error analysis and finding related checkpoints
- Partial rollback support (file/function/stage)
- Rollback preview

### 3. Pipeline Forking
- Explore multiple approaches simultaneously
- Fork comparison and merge

## File Structure

```
auto-checkpoint/
├── README.md          # This file
├── trigger.md         # Checkpoint trigger guide
├── rollback.md        # Rollback guide
└── prompts/
    └── CLAUDE.md      # AI instructions
```

## Configuration

- `config/auto_checkpoint.yaml` - Auto checkpoint
- `config/smart_rollback.yaml` - Smart rollback
- `config/pipeline_forking.yaml` - Pipeline forking

## Usage Examples

```bash
# Manual checkpoint creation
/checkpoint --name "feature-complete"

# View rollback suggestions
/restore --suggest

# Rollback to specific checkpoint
/restore --checkpoint "stage_06_complete_20240120"

# Pipeline fork
/fork --reason "Architecture alternative exploration"
```

## Storage Locations

- Checkpoints: `state/checkpoints/`
- Forks: `state/forks/`
- Rollback history: `state/rollback_history/`
