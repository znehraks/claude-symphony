# /checkpoint

Create a checkpoint of the current state.

## Usage
```
/checkpoint [description]
```

## Actions

1. **Capture Current State**
   - Current stage information
   - All outputs files
   - state/progress.json
   - Source code (when applicable)

2. **Create Checkpoint**
   - ID: `CP-[stage]-[timestamp]`
   - Location: `state/checkpoints/[CP-ID]/`

3. **Save Metadata**
   ```json
   {
     "id": "CP-06-20240120-1430",
     "stage": "06-implementation",
     "description": "Sprint 1 completed",
     "created_at": "2024-01-20T14:30:00Z",
     "files": [...],
     "progress_snapshot": {...}
   }
   ```

4. **Update state/progress.json**
   - Add to checkpoints array

## Execution Script

```bash
scripts/create-checkpoint.sh "$ARGUMENTS"
```

## Example

```
/checkpoint Sprint 1 completed

Creating checkpoint...
✓ Current state captured
✓ File copy completed (42 files)
✓ Metadata saved

Checkpoint created!
- ID: CP-06-20240120-1430
- Location: state/checkpoints/CP-06-20240120-1430/
- Description: Sprint 1 completed

Recovery command:
scripts/restore-checkpoint.sh CP-06-20240120-1430
```

## View Checkpoint List

```
/checkpoint --list

Checkpoint List:
| ID | Stage | Description | Created |
|----|-------|-------------|---------|
| CP-06-20240120-1030 | 06-impl | Project initialized | 2024-01-20 10:30 |
| CP-06-20240120-1430 | 06-impl | Sprint 1 completed | 2024-01-20 14:30 |
```

## Restore Checkpoint

```bash
scripts/restore-checkpoint.sh CP-06-20240120-1030

Warning: Current state will be restored to checkpoint CP-06-20240120-1030.
Current changes may be lost.
Continue? [y/N] y

✓ Checkpoint restored
✓ Current stage: 06-implementation
```

## Required Checkpoint Stages
- `06-implementation`: At major milestones during implementation
- `07-refactoring`: Before/after refactoring

## Options
- `--list`: Display checkpoint list
- `--delete [CP-ID]`: Delete checkpoint
