# Synthesis Consolidator Skill

Consolidates outputs from parallel AI execution into a unified result.

## Overview

When multiple AI models execute the same task in parallel, this skill helps Claude Code synthesize their outputs into a single, high-quality deliverable.

## Trigger

- `/synthesize` command
- Auto-triggered after parallel execution completes

## Workflow

1. **Collect** - Gather all parallel model outputs
2. **Analyze** - Identify commonalities and consensus
3. **Evaluate** - Compare differences and unique insights
4. **Synthesize** - Create unified output
5. **Validate** - Verify completeness and quality

## Configuration

See `config/ai_collaboration.yaml` for:
- `consolidation_workflow.synthesizer` - Default: claudecode
- `consolidation_workflow.quality_threshold` - Default: 0.8

## Parallel-Capable Stages

| Stage | Primary Model | Secondary Model |
|-------|---------------|-----------------|
| 01-brainstorm | Gemini | ClaudeCode |
| 03-planning | Gemini | ClaudeCode |
| 04-ui-ux | Gemini | ClaudeCode |
| 07-refactoring | Codex | ClaudeCode |
| 09-testing | Codex | ClaudeCode |

## Output

- Final synthesized output: Stage's required output file
- Synthesis log: `state/collaborations/synthesis_log.md`
