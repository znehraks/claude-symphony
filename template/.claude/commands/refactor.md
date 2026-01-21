# /refactor

Start the 07-refactoring stage directly.

## Usage
```
/refactor [focus-area]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 07-refactoring |
| AI Model | Codex → ClaudeCode |
| Execution Mode | Deep Dive |
| Checkpoint | **Required** |

## Actions

1. **Prerequisite Check**
   - 06-implementation completion status
   - src/, tests/ exist
   - 06 checkpoint exists

2. **Execute Refactoring**
   - Codex: Code analysis and improvement suggestions
   - ClaudeCode: Apply refactoring

3. **Output Generation**
   - (Improved) src/
   - refactoring-report.md

## Execution

```bash
scripts/run-stage.sh 07-refactoring "$ARGUMENTS"
```

## Workflow

```
Codex (Analysis)
    ↓
Identify Improvements
    ↓
ClaudeCode (Apply)
    ↓
Test Verification
```

## Input Files

- `stages/06-implementation/outputs/src/`
- `stages/06-implementation/outputs/tests/`

## Output Files

- (Modified) `src/`
- `stages/07-refactoring/outputs/refactoring-report.md`

## Checkpoint Required!

**Checkpoint required** before and after refactoring:

```bash
# Before refactoring
/checkpoint "Pre-refactoring state"

# After refactoring
/checkpoint "Refactoring completed"
```

## Refactoring Areas

- Code duplication removal
- Function/class separation
- Naming convention unification
- Performance optimization
- Security improvements

## Related Commands

- `/run-stage 07` - Start after prerequisite check
- `/next` - Next stage (08-qa)
- `/implement` - Previous stage
- `/codex` - Direct Codex CLI call
- `/checkpoint` - Create checkpoint
- `/restore` - Rollback

## Tips

- Always checkpoint before refactoring
- Incremental improvements in small units
- Commit after test pass verification
