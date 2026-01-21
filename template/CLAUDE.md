# claude-symphony - Multi-AI Orchestration Framework

10-Stage Software Development Workflow Orchestration System

## Pipeline Overview

| Stage | Name | AI Model | Execution Mode |
|-------|------|----------|----------------|
| 01 | Brainstorming | Gemini + ClaudeCode | YOLO (Container) |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | ClaudeCode | Plan Mode |
| 06 | Implementation | ClaudeCode | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | ClaudeCode | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | ClaudeCode | Headless |

## Context Management Rules

> Configuration file: `config/context.yaml`

### Percentage-Based Thresholds (Based on Remaining Context)

| Threshold | Trigger | Action |
|-----------|---------|--------|
| **60%** (warning) | Display warning | Calculate compression ratio, show banner |
| **50%** (action) | Auto-save | Save state to `state/context/`, recommend compression |
| **40%** (critical) | `/clear` recommended | Force save, generate recovery HANDOFF |

### Task-Based Auto-Save
- **Auto-save every 5 completed tasks**
- Save location: `state/context/state_{timestamp}_{stage}.md`

### State Save Format
> Template: `state/templates/phase_state.md.template`

```markdown
# Work State Save - {{TIMESTAMP}}

## Context State
- Remaining context: {{REMAINING_PERCENT}}%
- Save trigger: {{TRIGGER_REASON}}

## Current Stage
{{STAGE_ID}}: {{STAGE_NAME}}

## Progress
- Completed: [list]
- In progress: [current task]
- Pending: [remaining tasks]

## Key Context
- Major decisions
- Modified files
- Active issues/bugs

## AI Call Log
| AI | Time | Prompt | Result |
|----|------|--------|--------|

## Recovery Instructions
1. Read this file
2. Reference {{HANDOFF_FILE}}
3. Resume from {{CURRENT_TASK}}
```

### Context Compression Strategies
1. **summarize_completed**: Replace completed work with summaries
2. **externalize_code**: Replace code blocks with file references
3. **handoff_generation**: Externalize current state to HANDOFF.md

## Stage Transition Protocol

### Required Sequence
1. Verify all outputs for current stage are generated
2. Generate `HANDOFF.md` (required)
3. Create checkpoint (implementation/refactoring stages)
4. Update `state/progress.json`
5. Load next stage `CLAUDE.md`

### Required HANDOFF.md Contents
- Completed tasks checklist
- Key decisions and rationale
- Successful/failed approaches
- Immediate next steps for next stage
- Checkpoint references (if applicable)

## Slash Commands

### Basic Commands
| Command | Description |
|---------|-------------|
| `/init-project` | Initialize new project |
| `/run-stage [id]` | Run specific stage |
| `/handoff` | Generate current stage HANDOFF.md |
| `/checkpoint` | Create checkpoint |
| `/gemini [prompt]` | Call Gemini CLI |
| `/codex [prompt]` | Call Codex CLI |

### Multi-AI Commands
| Command | Description |
|---------|-------------|
| `/collaborate` | Run Multi-AI collaboration |
| `/benchmark` | AI model benchmarking |
| `/fork` | Pipeline branch management |
| `/validate` | Run output validation |

### Visibility Commands
| Command | Description |
|---------|-------------|
| `/status` | Check pipeline status |
| `/stages` | Stage list and details |
| `/context` | Context (token) state management |

### Navigation Commands
| Command | Description |
|---------|-------------|
| `/next` | Transition to next stage |
| `/restore` | Restore from checkpoint |

### Stage Shortcut Commands
| Command | Stage |
|---------|-------|
| `/brainstorm` | 01-brainstorm |
| `/research` | 02-research |
| `/planning` | 03-planning |
| `/ui-ux` | 04-ui-ux |
| `/tasks` | 05-task-management |
| `/implement` | 06-implementation |
| `/refactor` | 07-refactoring |
| `/qa` | 08-qa |
| `/test` | 09-testing |
| `/deploy` | 10-deployment |

## Skills (Auto-Activated)

| Skill | Trigger | Description |
|-------|---------|-------------|
| `stage-transition` | "completed", "/next" | Stage completion detection and transition automation |
| `context-compression` | Token 50k+ | Context compression and state save |
| `smart-handoff` | Stage completion | Smart context extraction and HANDOFF generation |
| `ai-collaboration` | `/collaborate` | Multi-AI collaboration orchestration |
| `auto-checkpoint` | Trigger conditions met | Automatic checkpoint generation |
| `output-validator` | `/validate`, stage completion | Output validation and quality verification |

## Git Auto-Commit Rules

> Configuration file: `config/git.yaml`

### Auto-Commit Triggers
- **On task completion**: Commit related files
- **On stage completion**: Commit all changes + create tag
- **On checkpoint creation**: Checkpoint commit + tag

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <description>
```

| Stage | Type | Scope | Example |
|-------|------|-------|---------|
| 06-implementation | `feat` | `impl` | `feat(impl): implement user authentication` |
| 07-refactoring | `refactor` | `refactor` | `refactor(refactor): optimize auth service` |
| 08-qa | `fix` | `qa` | `fix(qa): fix session expiry bug` |
| 09-testing | `test` | `test` | `test(test): add E2E tests` |
| 10-deployment | `ci` | `deploy` | `ci(deploy): configure GitHub Actions` |

### Commit Principles
- Commit frequently in small units
- Write meaningful commit messages
- Run lint/format before commit

## AI Call Logging

> Configuration file: `config/ai_logging.yaml`

### AI Call Recording
- All AI calls (Gemini, Codex, ClaudeCode) are recorded in HANDOFF.md
- Track call time, prompt file, result file, and status

### Gemini Call Verification Checklist
| Step | Check Item | Command |
|------|------------|---------|
| 1 | CLI installation check | `which gemini` |
| 2 | Use wrapper | `scripts/gemini-wrapper.sh` |
| 3 | tmux session check | `tmux attach -t symphony-gemini` |
| 4 | Save output file | `outputs/` directory |

### AI Call Log Format (HANDOFF.md)
```markdown
## AI Call Log
| AI | Call Time | Prompt | Result | Status |
|----|-----------|--------|--------|--------|
| Gemini | 14:30 | prompts/ideation.md | outputs/ideas.md | Success |
```

## Q&A Auto-Recording (Q&A Logging)

> Configuration file: `config/qa_logging.yaml`

### Auto-Recording Triggers
- **On stage completion**: Record key Q&A for that stage
- **On issue discovery**: Record problem and solution
- **On process change request**: Record changes and rationale

### Recording Format
```markdown
### Q{{number}}: {{title}}
**Question**: {{question}}
**Answer**: {{answer}}
**Solution**: {{solution}}
**Future Improvement Suggestions**: {{suggestion}}
```

### Recording Target Files
- Default: `feedback.md`
- Backup: `state/qa_backups/`

### Categories
- `workflow_improvements`: Workflow improvements
- `tool_usage`: Tool usage
- `process_changes`: Process changes
- `bug_fixes`: Bug fixes
- `best_practices`: Best practices

## Prohibited Actions

- Stage transition without HANDOFF.md
- Destructive operations without checkpoint (implementation/refactoring)
- Mixing multiple stages in single session
- Modifying previous stage outputs
- WIP commits, meaningless commit messages

## Directory Structure (Issue #17 Resolution)

### ⚠️ Key Distinction: TEMPLATE_ROOT vs PROJECT_ROOT

```
TEMPLATE_ROOT (Pipeline Management)    PROJECT_ROOT (Source Code)
/my-new-project/                       /my-new-project/[project-name]/
├── stages/        ← Outputs           ├── src/
│   └── XX-stage/                      ├── public/
│       └── outputs/                   ├── package.json
├── config/                            └── ...
├── state/
└── CLAUDE.md
```

### Path Rules

| Type | Save Location | Example |
|------|---------------|---------|
| Outputs (documents) | `stages/XX/outputs/` | `ideas.md`, `architecture.md` |
| Source code | `[project-name]/src/` | Components, API |
| State files | `state/` | `progress.json`, checkpoints |
| HANDOFF | `stages/XX/` | `HANDOFF.md` |

### ⚠️ Prohibited: Creating stages/ in PROJECT_ROOT
```
❌ Incorrect structure
/my-new-project/my-app/
├── stages/        ← Should not be created here!
└── src/

✅ Correct structure
/my-new-project/
├── stages/        ← Only exists in TEMPLATE_ROOT
└── my-app/
    └── src/       ← PROJECT_ROOT
```

### Pipeline File Structure

```
config/
  pipeline.yaml        # Pipeline definition
  models.yaml          # AI model assignment
  context.yaml         # Context management settings
  model_enforcement.yaml  # AI role distribution
  git.yaml             # Git auto-commit rules
  mcp_fallbacks.yaml   # MCP fallback settings
  ai_logging.yaml      # AI call logging settings
  qa_logging.yaml      # Q&A auto-recording settings
  implementation.yaml.template  # Implementation rules template

stages/
  XX-stage-name/
    CLAUDE.md          # Stage AI instructions
    config.yaml        # Stage settings
    prompts/           # Prompt templates
    templates/         # Output templates
    inputs/            # Input files (previous stage links)
    outputs/           # Output files (deliverables)
    HANDOFF.md         # Generated handoff

state/
  progress.json        # Pipeline progress
  checkpoints/         # Checkpoint storage
  context/             # Context state storage
  handoffs/            # Handoff archive
  templates/           # State templates
```

## Design Patterns Applied

1. **Sequential Workflow Architecture** - Sequential stage definition and auto-progression
2. **Stateless Orchestration** - Stateless context transfer (HANDOFF.md)
3. **Orchestrator-Workers** - Parallel agent execution (Brainstorm stage)
4. **Proactive State Externalization** - External state file management
5. **State Machine Workflow** - State transition management (progress.json)
6. **Layered Configuration** - Hierarchical configuration structure (global → stage)

---

## Multi-AI Orchestration

> Configuration files: `config/ai_collaboration.yaml`, `config/ai_benchmarking.yaml`

### AI Collaboration Modes

| Mode | Description | Used In Stages |
|------|-------------|----------------|
| `parallel` | Execute same task with multiple AIs simultaneously | 01-brainstorm, 02-research |
| `sequential` | Sequential handoff between AIs (review chain) | 06-implementation, 07-refactoring |
| `debate` | AI debate to reach optimal conclusions | 03-planning, 04-ui-ux |

### AI Model Specialization

| AI Model | Strengths | Optimal Stages |
|----------|-----------|----------------|
| Claude | Accurate code generation, logic analysis | 06-implementation, 08-qa |
| Gemini | Creative ideas, rapid exploration | 01-brainstorm, 03-planning |
| Codex | Deep analysis, refactoring | 07-refactoring, 09-testing |

### Usage
```bash
# Parallel collaboration execution
/collaborate --mode parallel --models claude,gemini --task "idea generation"

# Debate mode
/collaborate --mode debate --rounds 3

# AI benchmarking
/benchmark --task code_generation --models claude,codex
```

---

## Smart HANDOFF System

> Configuration files: `config/handoff_intelligence.yaml`, `config/memory_integration.yaml`

### Auto-Extracted Items
- Completed tasks (`completed_tasks`)
- Key decisions (`key_decisions`)
- Modified files (`modified_files`)
- Pending issues (`pending_issues`)
- AI call history (`ai_call_history`)

### Context Compression
- **Strategy**: Semantic-based compression (`semantic`)
- **Target ratio**: 30% of original
- **Preserved items**: Key decisions, blocking issues, file changes

### AI Memory Integration
- Integration with claude-mem MCP
- Auto-save to memory on stage completion
- Previous context injection on stage start

### HANDOFF Modes
```bash
# Default (smart) HANDOFF
/handoff

# Compact mode (minimum essential info only)
/handoff --compact

# Detailed recovery HANDOFF
/handoff --recovery
```

---

## Auto-Checkpoint System

> Configuration files: `config/auto_checkpoint.yaml`, `config/smart_rollback.yaml`

### Auto-Generation Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| Task-based | 5 tasks completed | Create checkpoint |
| File change | 100+ lines changed | Create checkpoint |
| Destructive operation | rm, delete, drop patterns | Force checkpoint |
| Time-based | 30 minutes elapsed | Create checkpoint |

### Retention Policy
- Max retention: 10
- Milestone retention: Stage completion checkpoints preserved permanently

### Smart Rollback
```bash
# Checkpoint list
/restore --list

# Rollback to specific checkpoint
/restore checkpoint_20240101_120000

# Partial rollback (file level)
/restore checkpoint_id --partial --files "src/auth/*"
```

---

## Pipeline Forking

> Configuration file: `config/pipeline_forking.yaml`

### Fork Points
- When architecture alternatives are proposed (03-planning)
- When technical choices exist (06-implementation)

### Fork Management
- **Max active forks**: 3
- **Merge strategy**: Best performer basis (`best_performer`)

### Comparison Metrics
- Code quality (`code_quality`)
- Performance (`performance`)
- Maintainability (`maintainability`)

### Usage
```bash
# Create fork
/fork create --reason "architecture alternative exploration" --direction "microservices"

# Fork list
/fork list

# Compare forks
/fork compare

# Merge fork
/fork merge fork_name

# Delete fork
/fork delete fork_name
```

---

## Stage Personas

> Configuration file: `config/stage_personas.yaml`

Defines optimized AI behavior characteristics for each stage.

| Stage | Persona | Characteristics | Temperature |
|-------|---------|-----------------|-------------|
| 01-brainstorm | Creative Explorer | Divergent thinking, unconstrained ideas | 0.9 |
| 02-research | Analytical Investigator | Systematic analysis, in-depth investigation | 0.5 |
| 03-planning | Strategic Architect | Long-term perspective, structural thinking | 0.6 |
| 06-implementation | Precise Builder | Accurate implementation, error prevention | 0.3 |
| 07-refactoring | Code Surgeon | Deep analysis, performance optimization | 0.5 |
| 08-qa | Quality Guardian | Thorough verification, risk detection | 0.4 |

---

## Output Validation

> Configuration file: `config/output_validation.yaml`

### Validation Items

| Stage | Required Outputs | Validation Command |
|-------|------------------|-------------------|
| 01-brainstorm | `ideas.md` (minimum 5 ideas) | - |
| 06-implementation | `src/` (lint, typecheck pass) | `npm run lint`, `npm run typecheck` |
| 09-testing | `tests/` (coverage 80%+) | `npm run test:coverage` |

### Quality Metrics
- Code quality threshold: 0.8
- Test coverage threshold: 80%

### Usage
```bash
# Validate current stage
/validate

# Validate specific stage
/validate --stage 06-implementation

# Include auto-fix
/validate --fix

# Verbose output
/validate --verbose

# Proceed despite failure (not recommended)
/validate --force
```

---

## New Configuration Files

| File | Description |
|------|-------------|
| `config/ai_collaboration.yaml` | AI collaboration mode settings |
| `config/ai_benchmarking.yaml` | AI benchmarking settings |
| `config/handoff_intelligence.yaml` | Smart HANDOFF settings |
| `config/memory_integration.yaml` | AI memory integration settings |
| `config/auto_checkpoint.yaml` | Auto-checkpoint settings |
| `config/smart_rollback.yaml` | Smart rollback settings |
| `config/pipeline_forking.yaml` | Pipeline forking settings |
| `config/stage_personas.yaml` | Stage persona settings |
| `config/output_validation.yaml` | Output validation settings |

## New State Directories

| Directory | Description |
|-----------|-------------|
| `state/ai_benchmarks/` | AI benchmark results storage |
| `state/forks/` | Pipeline fork state storage |
| `state/validations/` | Validation results storage |
