# Pause Pipeline

Pause the auto-pilot pipeline. The current stage will finish its current work, then the pipeline will stop.

## Instructions

1. Write a `state/pipeline_state.json` file with `"status": "paused"` and the current stage info
2. Display current progress summary
3. Inform the user they can resume with `/resume`

## Example

```
Pipeline paused at stage 04-ui-ux.
Progress: 3/10 stages complete (30%)

Run /resume to continue from stage 04-ui-ux.
Run /skip to skip the current stage and move to the next.
```

$ARGUMENTS
