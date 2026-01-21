# Stage Validation Logic

Validates completion criteria for current stage.

## Validation Process

### 1. Identify Current Stage

```bash
# Check current stage from progress.json
CURRENT_STAGE=$(jq -r '.current_stage' state/progress.json)
```

### 2. Load Completion Criteria

Required outputs per stage:

| Stage | Required Files | Checkpoint |
|-------|---------------|------------|
| 01-brainstorm | ideas.md, decisions.md | - |
| 02-research | research.md, tech-stack.md | - |
| 03-planning | PRD.md, architecture.md | - |
| 04-ui-ux | wireframes/, component-spec.md | - |
| 05-task-management | tasks.json, sprints.md | - |
| 06-implementation | src/, tests/ | ✅ Required |
| 07-refactoring | src/ (modified) | ✅ Required |
| 08-qa | qa-report.md | - |
| 09-testing | test-results.md | - |
| 10-deployment | CI/CD files | - |

### 3. File Existence Check

```bash
STAGE_DIR="stages/$CURRENT_STAGE/outputs"

# Check required files
check_required_files() {
    local files=("$@")
    local missing=()

    for file in "${files[@]}"; do
        if [ ! -e "$STAGE_DIR/$file" ]; then
            missing+=("$file")
        fi
    done

    echo "${missing[@]}"
}
```

### 4. Checkpoint Check (When Applicable)

```bash
# Stages 06, 07 require checkpoint
if [[ "$CURRENT_STAGE" == "06-"* ]] || [[ "$CURRENT_STAGE" == "07-"* ]]; then
    STAGE_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
    CP_EXISTS=$(ls -d state/checkpoints/CP-$STAGE_NUM-* 2>/dev/null | head -1)

    if [ -z "$CP_EXISTS" ]; then
        echo "⚠️ Checkpoint required: Run /checkpoint"
    fi
fi
```

## Validation Result Format

### Success

```
✅ Stage completion criteria met

[04-ui-ux]
✓ wireframes/ exists (3 files)
✓ component-spec.md generated
✓ design-system.md generated

Next step: /next or /tasks
```

### Failure

```
⚠️ Stage completion criteria not met

[06-implementation]
✓ src/ exists
✓ tests/ exists
✗ No checkpoint

Required actions:
1. Run /checkpoint "implementation complete"
2. Transition with /next
```

## Auto Actions

Auto-suggestions based on validation results:

1. **All criteria met**
   → Suggest HANDOFF.md generation
   → Guide `/next` command

2. **Some criteria not met**
   → Guide missing items
   → Suggest resolution methods

3. **Checkpoint needed**
   → Guide `/checkpoint` command
