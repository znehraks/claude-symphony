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

For EACH stage, use the Task tool to spawn a sub-agent:

```
Task tool parameters:
- subagent_type: "general-purpose"
- description: "Execute stage <stage-id>"
- prompt: [stage CLAUDE.md content + previous HANDOFF + references]
- model: [from config/stage_personas.jsonc]
```

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
1. First retry: Feed the validation errors back to the agent and re-run
2. Second retry: Simplify the requirements and retry
3. Third failure: Stop and report the error to the user

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

## Start

Read `state/progress.json` now and begin executing from the current stage. If starting fresh, begin with stage 01-brainstorm.

DO NOT ask for confirmation. Execute each stage automatically. Only stop if:
- A stage fails validation 3 times
- The pipeline reaches completion (all 10 stages done)
- A critical error occurs

$ARGUMENTS
