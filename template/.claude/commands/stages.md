# /stages

Display all stage list and details for the 10-stage pipeline.

## Usage
```
/stages
/stages [stage-id]
```

## Actions

1. **Display Stage List** (`/stages`)
   - All stage numbers/names
   - Assigned AI model
   - Current status
   - Execution mode

2. **Specific Stage Details** (`/stages [id]`)
   - Stage config.yaml information
   - Input/output file list
   - Completion criteria

## Execution Script

```bash
scripts/list-stages.sh "$ARGUMENTS"
```

## Output Examples

### View List (`/stages`)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Pipeline Stages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ##  Stage            AI Model        Mode          Status
─────────────────────────────────────────────────────────
 01  brainstorm       Gemini+Claude   YOLO          ✅
 02  research         Claude+MCP      Plan Mode     ✅
 03  planning         Gemini          Plan Mode     ✅
 04  ui-ux            Gemini          Plan Mode     🔄 ←
 05  task-management  ClaudeCode      Plan Mode     ⏳
 06  implementation   ClaudeCode      Plan+Sandbox  ⏳
 07  refactoring      Codex           Deep Dive     ⏳
 08  qa               ClaudeCode      Plan+Sandbox  ⏳
 09  testing          Codex           Playwright    ⏳
 10  deployment       ClaudeCode      Headless      ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current: 04-ui-ux | Next: /run-stage 05 or /tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### View Details (`/stages 06`)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Stage 06: Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Model:    ClaudeCode
Mode:        Plan Mode + Sandbox
Timeout:     240 minutes (longest stage)
Checkpoint:  Required

[Inputs]
 • 05-task-management/outputs/tasks.json
 • 05-task-management/outputs/sprint-plan.md
 • 04-ui-ux/outputs/wireframes/

[Outputs]
 • src/ (implemented source code)
 • tests/ (unit tests)
 • implementation-notes.md

[Completion Criteria]
 □ All tasks implemented
 □ Unit tests passed
 □ Lint/type check passed
 □ Checkpoint created

[Quick Commands]
 • /implement     - Start this stage directly
 • /run-stage 06  - Start after prerequisite check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Stage Information Reference

| Stage | Input | Output | Features |
|-------|-------|--------|----------|
| 01-brainstorm | (none) | ideas.md, decisions.md | YOLO mode, parallel AI |
| 02-research | ideas.md | research.md, tech-stack.md | MCP tools |
| 03-planning | research.md | PRD.md, architecture.md | Planning documentation |
| 04-ui-ux | PRD.md | wireframes/, components.md | Visual design |
| 05-task-mgmt | PRD, wireframes | tasks.json, sprints.md | Task breakdown |
| 06-implementation | tasks.json | src/, tests/ | Core implementation |
| 07-refactoring | src/ | src/ (improved) | Code quality |
| 08-qa | src/ | qa-report.md | Quality verification |
| 09-testing | src/, qa | test-results.md | E2E testing |
| 10-deployment | all | CI/CD, deploy | Deployment automation |

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--pending` | Show only pending stages |
| `--completed` | Show only completed stages |
