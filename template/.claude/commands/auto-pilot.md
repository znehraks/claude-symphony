# Auto-Pilot: Automatic Pipeline Execution

You are the auto-pilot orchestrator for claude-symphony. Your job is to execute the entire 10-stage development pipeline automatically, from the current stage to completion.

## How It Works

For each stage in the pipeline:
1. Read `state/progress.json` to determine the current stage
2. Read the stage's `CLAUDE.md` for instructions
3. Check `references/<stage-id>/` for any reference materials
4. Read the previous stage's HANDOFF.md for context
5. Execute the stage work (create all required outputs)
6. Save outputs to `stages/<stage-id>/outputs/`
7. Generate HANDOFF.md in `stages/<stage-id>/`
8. Update `state/progress.json` to mark stage complete
9. Move to the next stage

## Stage Execution Protocol

For EACH stage:

### 1. Load context
Read `state/progress.json` to determine the current stage. Then load:
- The stage's `CLAUDE.md` for instructions
- Previous stage's `HANDOFF.md` for context
- `references/<stage-id>/` for user-provided materials

### 2. External AI check (multi-model pipeline)
Read `config/pipeline.jsonc` for the current stage's `models` array.
If it contains a non-claudecode model (gemini, codex):

a) Use the Write tool to save the assembled prompt to `state/prompts/<stage-id>.md`
   (the Write tool creates parent directories automatically)
b) Run via Bash:
```bash
claude-symphony ai-call --stage <stage-id> --prompt-file state/prompts/<stage-id>.md
```
c) If exit code 0: Parse JSON from stdout, use the Write tool to save
   the `output` field to `state/ai-outputs/<stage-id>.md`
d) If exit code 10 (fallback) or 1 (error): Log the reason from JSON, proceed with claudecode-only execution

### 3. Spawn Task tool agent
Use the Task tool to spawn a sub-agent for the stage:

```
Task tool parameters:
- subagent_type: "general-purpose"
- description: "Execute stage <stage-id>"
- prompt: [stage CLAUDE.md content + previous HANDOFF + references]
         If external AI output was obtained in step 2, include it as:
         ## External AI Analysis
         <content from state/ai-outputs/<stage-id>.md>
- model: [from config/stage_personas.jsonc]
```

### 4. Validate outputs
Verify the required outputs exist (see Validation section below).

### 5. Generate HANDOFF and progress
Generate HANDOFF.md and update `state/progress.json` as usual.

## Validation

After each stage completes, verify the required outputs exist:
- Stage 01: `outputs/ideas.md`, `outputs/requirements_analysis.md`
- Stage 02: `outputs/tech_research.md`, `outputs/feasibility_report.md`
- Stage 03: `outputs/architecture.md`, `outputs/tech_stack.md`, `outputs/project_plan.md`
- Stage 04: `outputs/wireframes.md`, `outputs/components.md`
- Stage 05: `outputs/tasks.md`, `outputs/implementation_order.md`
- Stage 06: Source code files in the project root + `outputs/implementation_log.md`
- Stage 07: Updated source files + `outputs/refactoring_report.md`
- Stage 08: `outputs/qa_report.md`
- Stage 09: Test files + `outputs/test_report.md`, `outputs/coverage_report.md`
- Stage 10: CI/CD config + `outputs/deployment_guide.md`

## Retry Logic

If a stage's outputs are incomplete or validation fails:

1. **Attempt 1 (retry with feedback)**: Feed the specific validation errors back to the agent. Include the list of missing/failing checks in the prompt and re-run the stage.
2. **Attempt 2 (simplified retry)**: Simplify the requirements — focus only on producing the required output files with correct structure. Re-run with explicit file-by-file instructions.
3. **Attempt 3 fails → Pause**: Stop the pipeline and report the error to the user. Save pipeline state to `state/pipeline_state.json` with `"status": "paused"`. The user can fix issues manually and `/resume`, or `/skip` the stage.

When retrying, always include this in the prompt:
```
## RETRY ATTEMPT N of 3
The previous attempt failed validation. Fix these issues:
1. [specific error]
2. [specific error]
```

## Pipeline State

Save pipeline state to `state/pipeline_state.json`:
```json
{
  "status": "running",
  "currentStage": "03-planning",
  "retryState": null,
  "startedAt": "2026-01-31T..."
}
```

Valid statuses: `running`, `paused`, `completed`, `failed`

Check for paused state at startup — if paused, inform user and ask whether to resume or restart.

## HANDOFF Generation

After each stage, generate a HANDOFF.md containing:
- What was accomplished
- Key decisions made
- Files created/modified
- Context needed for the next stage

## Progress Display

After each stage completion, display progress:
```
[OK] 01 Brainstorming    Done
[OK] 02 Research          Done
[>>] 03 Planning          Running...
[  ] 04 UI/UX
...
```

## Pause/Resume Support

- If `state/pipeline_state.json` has `"status": "paused"`, ask the user before continuing
- The user can run `/pause` at any time to stop after the current stage
- The user can run `/skip` to skip a problematic stage
- The user can run `/resume` to continue from where they left off

## Start

Read `state/progress.json` now and begin executing from the current stage. If starting fresh, begin with stage 01-brainstorm.

DO NOT ask for confirmation. Execute each stage automatically. Only stop if:
- A stage fails validation 3 times (pause pipeline)
- The pipeline reaches completion (all 10 stages done)
- A critical error occurs
- The user runs `/pause`

$ARGUMENTS
