# Resume Pipeline

Resume a paused auto-pilot pipeline from where it stopped.

## Instructions

1. Read `state/pipeline_state.json` to find the paused state
2. If no paused pipeline exists, inform the user and suggest `/auto-pilot` instead
3. If paused, resume by:
   - Reading `state/progress.json` for the current stage
   - Continuing the auto-pilot loop from that stage
   - Follow the same protocol as `/auto-pilot` (spawn Task agents, validate, HANDOFF, progress)

## Behavior

This command is equivalent to `/auto-pilot` but starts from the paused stage instead of the beginning. Follow the exact same stage execution protocol defined in `/auto-pilot`.

$ARGUMENTS
