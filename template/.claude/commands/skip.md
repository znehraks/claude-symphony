# Skip Current Stage

Skip the current pipeline stage and move to the next one.

## Instructions

1. Read `state/progress.json` to find the current stage
2. Confirm the skip with the user (display what will be skipped)
3. Mark the current stage as `"skipped"` in progress.json
4. Generate a minimal HANDOFF.md noting the stage was skipped
5. Update progress.json to point to the next stage
6. Display updated progress

## HANDOFF for Skipped Stage

```markdown
# HANDOFF — Stage XX (Skipped)

This stage was skipped by user request.

## Impact
- Outputs from this stage are not available
- The next stage should account for missing context

## What was skipped
- [Stage name and description]
```

## After Skip

If the pipeline was running (auto-pilot), continue to the next stage automatically.
If paused, stay paused at the next stage.

$ARGUMENTS
