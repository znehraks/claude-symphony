# claude-symphony v2 — Quality-Based Development Pipeline

Describe your app. We handle the rest — planning, architecture, code, tests, deployment.

## Quick Start

Run `/auto-pilot` to start the automatic pipeline. The orchestrator will:
1. **Discovery Phase**: Gather requirements through Socratic dialogue
2. **Preparation Phase**: Research your tech stack, cache best practices
3. **Execution Phase**: Execute 5 stages with quality-based validation

## Pipeline Phases

### Phase 1: Discovery
- Uses `/sc:brainstorm` for requirement gathering
- Checks API keys (ANTHROPIC_API_KEY required)
- Collects project description and tech preferences

### Phase 2: Preparation
- Uses `/sc:research` for tech stack research
- Caches official documentation via Context7
- Stores patterns in Serena memory

### Phase 3: Execution (5 Stages)

| # | Stage | SuperClaude Command | Recommended MCP |
|---|-------|---------------------|-----------------|
| 01 | Planning & Architecture | `/sc:workflow` + `/sc:design` | context7 |
| 02 | UI/UX Design | `/sc:design --type component` | stitch, pencil |
| 03 | Implementation | `/sc:implement --with-tests` | magic, context7 |
| 04 | QA & E2E Testing | `/sc:test --type e2e` | playwright |
| 05 | Deployment | `/sc:build` | - |

## Quality-Based Validation

Each stage is validated by output quality, not tool usage.

### Layer 1: Objective Checks (Automatic)
- File existence
- Section presence
- Build/test command success
- Source file count

### Layer 2: AI Review (After Layer 1 passes)
- Serena MCP task adherence check
- Quality criteria verification
- Improvement suggestions

### Failure Handling
| Level | Action |
|-------|--------|
| blocking | Stage cannot proceed |
| critical | PDCA retry (max 2) |
| non-critical | Warning only |

## MCP Policy

**MCP usage is RECOMMENDED, not REQUIRED.**

The pipeline validates output quality. If an MCP is unavailable, the AI uses built-in knowledge. Quality standards remain the same.

| MCP | Purpose | Stages |
|-----|---------|--------|
| context7 | Documentation | 01, 03 |
| stitch | UI generation | 02 |
| pencil | Design editing | 02 |
| magic | Components | 03 |
| playwright | E2E testing | 04 |
| serena | Memory/analysis | All |

## Commands

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start/resume automatic pipeline |
| `/pause` | Pause after current stage |
| `/resume-stage` | Resume paused pipeline |
| `/skip` | Skip current stage |
| `/progress` | View pipeline progress |
| `/checkpoint` | Create manual checkpoint |
| `/restore` | Restore from checkpoint |
| `/stages` | List all stages with status |
| `/run-stage [id]` | Run specific stage manually |

## Project Structure

```
your-project/
├── CLAUDE.md              # This file (pipeline instructions)
├── config/
│   ├── pipeline.jsonc     # Pipeline configuration
│   ├── discovery.jsonc    # Discovery phase settings
│   └── tech_preferences.jsonc
├── stages/
│   ├── 01-planning/
│   │   ├── CLAUDE.md      # Stage instructions
│   │   ├── outputs/       # Stage deliverables
│   │   ├── inputs/        # Project brief
│   │   └── HANDOFF.md     # Context for next stage
│   ├── 02-ui-ux/
│   ├── 03-implementation/
│   ├── 04-qa/
│   └── 05-deployment/
├── references/            # User-provided materials
│   └── XX-stage/
├── state/
│   ├── progress.json      # Pipeline progress
│   ├── discovery/         # Discovery phase state
│   ├── research/          # Tech research results
│   ├── validations/       # Quality check results
│   ├── reviews/           # AI review results
│   └── checkpoints/       # Save points
└── .claude/
    ├── commands/          # Slash commands
    └── agents/            # Sub-agent definitions
```

## Stage Outputs

### 01-planning
- `requirements.md` — Features, user stories, scope
- `architecture.md` — System design, components
- `tech_stack.md` — Technology selections
- `conventions.md` — Project conventions

### 02-ui-ux
- `design_tokens.json` — Colors, typography, spacing
- `component_specs.md` — Component definitions
- `wireframes/` — Screen designs

### 03-implementation
- Source code in project root (min 5 files)
- `package.json` or equivalent manifest
- `tasks.md` — Implementation tasks
- `implementation_log.md`
- `test_summary.md`

### 04-qa
- `e2e_report.md` — E2E test results (min 5 scenarios)
- `qa_report.md` — Security/accessibility audit

### 05-deployment
- `.github/workflows/` — CI/CD config
- `deploy.sh` — Deployment script
- `deployment_guide.md`

## HANDOFF System

HANDOFF.md files transfer context between stages:
- What was accomplished
- Key decisions and rationale
- Files created/modified
- What the next stage needs to know
- Unresolved issues

## State Management

### Progress Tracking
```json
{
  "current_stage": "03-implementation",
  "phases_completed": ["discovery", "preparation"],
  "stages": {
    "01-planning": { "status": "completed" },
    "02-ui-ux": { "status": "completed" },
    "03-implementation": { "status": "in_progress" }
  }
}
```

### Serena Memory (if available)
- `session/context` — Full pipeline state
- `session/checkpoint` — Auto-saves
- `plan/{stage}/output` — Stage results
- `learning/patterns/` — Success patterns

## Retry Logic

If quality validation fails:
1. **Attempt 1**: Feed specific errors, re-run
2. **Attempt 2**: Simplified requirements, focused re-run
3. **Attempt 3 fails**: Pause pipeline, report to user

## Reference Materials

Drop files into `references/<stage-id>/` for additional context:

```
references/
├── 01-planning/    # Architecture examples, API specs
├── 02-ui-ux/       # Design references, style guides
├── 03-implementation/ # Coding patterns, examples
├── 04-qa/          # Testing standards, checklists
└── 05-deployment/  # CI/CD templates, configs
```

Supported: `.md`, `.txt`, `.json`, `.yaml`, `.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.html`

## Prohibited Actions

- Skipping a stage without completing required outputs
- Modifying previous stage outputs
- Proceeding without generating HANDOFF.md
- Marking stage complete with failing quality checks

## Version

claude-symphony v2.0.0 — Quality-Based Pipeline
