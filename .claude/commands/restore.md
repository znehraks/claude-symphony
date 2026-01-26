# /restore

Restore project state from a checkpoint.

## Usage
```
/restore --list          # View checkpoint list
/restore --latest        # Restore to latest checkpoint
/restore [CP-ID]         # Restore to specific checkpoint
```

## Actions

### View List (`--list`)
1. Scan `state/checkpoints/` directory
2. Read each checkpoint's metadata
3. Output in table format

### Restore (`[CP-ID]` or `--latest`)
1. **Confirmation prompt** (if not in automation mode)
2. **Backup current state** (optional)
3. **Restore checkpoint files**
   - Restore progress.json
   - Restore outputs files
   - Restore HANDOFF.md (if exists)
4. **Update state**

## Execution Script

```bash
scripts/restore-checkpoint.sh "$ARGUMENTS"
```

## Output Examples

### View List
```
/restore --list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Checkpoint List
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ID                    Stage             Created
─────────────────────────────────────────────────
 CP-06-20240120-1030   06-implementation 2024-01-20 10:30
 CP-06-20240120-1430   06-implementation 2024-01-20 14:30
 CP-07-20240121-0900   07-refactoring    2024-01-21 09:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total 3 checkpoints | Restore with /restore [ID]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Execute Restore
```
/restore CP-06-20240120-1430

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Checkpoint Restore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checkpoint: CP-06-20240120-1430
Stage:      06-implementation
Description: Sprint 1 completed
Created:    2024-01-20 14:30

⚠️  Warning: Current state will be restored to that point.
   Current changes may be lost.

Proceed with restore? [y/N] y

Restoring...
✓ progress.json restored
✓ outputs files restored (42 files)
✓ HANDOFF.md restored

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Checkpoint restore complete!
Current stage: 06-implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Options

| Option | Description |
|--------|-------------|
| `--list` | Display checkpoint list |
| `--latest` | Restore to latest checkpoint |
| `--force` | Force restore without confirmation |
| `--backup` | Backup current state before restore |
| `--dry-run` | Preview only without actual restore |

## Cautions

- Current work will be **overwritten** during restore
- Run `/checkpoint` first if you have important changes
- Use `--backup` option for automatic current state backup

## Use Cases

1. **Rollback after failed implementation**
   ```
   /restore --latest
   ```

2. **Restore to specific point**
   ```
   /restore --list
   /restore CP-06-20240120-1030
   ```

3. **Safe restore (with backup)**
   ```
   /restore CP-06-20240120-1030 --backup
   ```
