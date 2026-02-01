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

### 2. Multi-model gate (MANDATORY — DO NOT SKIP)

Every stage MUST be classified before execution. There is no "do nothing" path.

**MULTI-MODEL stages** (external AI call required): `01-brainstorm`, `03-planning`, `04-ui-ux`, `07-refactoring`, `09-testing`
**SINGLE-MODEL stages** (claudecode-only): `02-research`, `05-task-management`, `06-implementation`, `08-qa`, `10-deployment`

Read `config/pipeline.jsonc` to confirm the stage's `models` array. Then:

#### Path A — SINGLE-MODEL stage
Append a log entry to `state/ai-call-log.jsonl` and proceed to Step 3:
```jsonl
{"stage":"<stage-id>","type":"single-model","action":"skipped","reason":"claudecode-only stage","ts":"<ISO-8601>"}
```

#### Path B — MULTI-MODEL stage (MUST execute — this is NOT optional)
a) Use the Write tool to save the assembled prompt to `state/prompts/<stage-id>.md`
   (the Write tool creates parent directories automatically)
b) Run via Bash:
```bash
claude-symphony ai-call --stage <stage-id> --prompt-file state/prompts/<stage-id>.md
```
c) Append a log entry to `state/ai-call-log.jsonl` based on the exit code:
   - **Exit 0 (success)**: Parse JSON from stdout, save the `output` field to `state/ai-outputs/<stage-id>.md`.
     Log: `{"stage":"<stage-id>","type":"multi-model","exitCode":0,"model":"<model>","action":"called","reason":null,"ts":"<ISO-8601>"}`
   - **Exit 10 (fallback)**: Log: `{"stage":"<stage-id>","type":"multi-model","exitCode":10,"model":"<model>","action":"fallback","reason":"<reason from JSON>","ts":"<ISO-8601>"}`
     Proceed with claudecode-only execution.
   - **Exit 1 (error)**: Log: `{"stage":"<stage-id>","type":"multi-model","exitCode":1,"model":"<model>","action":"error","reason":"<reason from JSON>","ts":"<ISO-8601>"}`
     Proceed with claudecode-only execution.

Skipping the external AI call on a multi-model stage is a **protocol violation**. If the ai-call command fails, you MUST still log it and proceed — but you must NOT silently skip the call.

### 3. Spawn Task tool agent
Use the Task tool to spawn a sub-agent for the stage:

```
Task tool parameters:
- subagent_type: "general-purpose"
- description: "Execute stage <stage-id>"
- prompt: [assembled as described below]
- model: [from config/stage_personas.jsonc]
```

**Prompt assembly rules:**
- Always include: stage CLAUDE.md content + previous HANDOFF + references
- For MULTI-MODEL stages where Step 2 exit code was 0: you MUST prepend the external AI output.
  Read `state/ai-outputs/<stage-id>.md` and include it at the top of the prompt as:
  ```
  ## External AI Analysis (from <model>)
  <content from state/ai-outputs/<stage-id>.md>
  ```
  This section is MANDATORY when external AI output exists. Do NOT omit it.

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

## Multi-Model Compliance Check

When the pipeline completes all 10 stages, pauses, or fails, perform this compliance check:

1. Read `state/ai-call-log.jsonl`
2. Verify that **every multi-model stage** (`01-brainstorm`, `03-planning`, `04-ui-ux`, `07-refactoring`, `09-testing`) has at least one log entry with `"type":"multi-model"`
3. If any multi-model stage is missing from the log:
   - Display a **compliance warning** listing the missing stages
   - Example: `⚠ COMPLIANCE: Multi-model gate was not executed for stages: 03-planning, 09-testing`
4. If all multi-model stages are present, display: `✓ Multi-model compliance: all gates executed`

This check ensures the pipeline never silently skips external AI calls on stages that require them.

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
