# claude-symphony

<p align="center">
  <img src="https://raw.githubusercontent.com/znehraks/claude-symphony/main/assets/claude_symphony.webp" alt="Claude Symphony Logo" width="400">
</p>

Multi-AI Orchestration Framework for Software Development

[![npm version](https://badge.fury.io/js/claude-symphony.svg)](https://www.npmjs.com/package/claude-symphony)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

claude-symphony is a 10-stage software development workflow pipeline that orchestrates multiple AI models (Claude, Gemini, Codex) like an orchestra, creating harmonious software through a complete development cycle.

### Key Features

- **10-Stage Pipeline**: Complete development cycle from brainstorming to deployment
- **Multi-AI Orchestration**: Intelligent collaboration between Gemini, Claude, and Codex with parallel, sequential, and debate modes
- **Smart HANDOFF System**: Automatic context extraction, semantic compression, and AI memory integration
- **Auto-Checkpoint & Smart Rollback**: Task-based triggers, file change detection, partial rollback support
- **Pipeline Forking**: Branch exploration for architecture alternatives with merge capabilities
- **Stage Personas**: Optimized AI behavior profiles per stage (Creative Explorer, Precise Builder, etc.)
- **Output Validation**: Automated quality checks with lint, typecheck, and coverage verification
- **Epic Cycles**: User-defined stage range repetition with context preservation between cycles
- **Implementation Order**: Frontend-first or backend-first development approach with reference links
- **Requirements Refinement**: 4-level breakdown system (Epic → Feature → Task → Subtask) with INVEST validation
- **Moodboard UX**: Interactive design reference collection with Claude Vision/Figma MCP analysis

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                   claude-symphony Pipeline                          │
├─────────────────────────────────────────────────────────────────────┤
│  01 Brainstorm  →  02 Research  →  03 Planning  →  04 UI/UX        │
│     Gemini          Claude          Gemini          Gemini          │
├─────────────────────────────────────────────────────────────────────┤
│  05 Tasks  →  06 Implement  →  07 Refactor  →  08 QA  →  09 Test   │
│    Claude       Claude           Codex         Claude     Codex     │
├─────────────────────────────────────────────────────────────────────┤
│                          10 Deploy                                  │
│                            Claude                                   │
└─────────────────────────────────────────────────────────────────────┘
```

| Stage | Name | AI Model | Mode |
|-------|------|----------|------|
| 01 | Brainstorming | Gemini + Claude | YOLO (Container) |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | Claude | Plan Mode |
| 06 | Implementation | Claude | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | Claude | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | Claude | Headless |

## Installation

### Quick Start with npx

```bash
# Create a new project
npx claude-symphony my-project
cd my-project

# Edit project brief
# stages/01-brainstorm/inputs/project_brief.md

# Start development with Claude Code
/run-stage 01-brainstorm
```

### Using Claude Code

In Claude Code, all slash commands are available:

```
/status              # Check pipeline status
/run-stage 01-brainstorm
/handoff             # Create handoff document
/next                # Move to next stage
```

## Quick Start

### Step-by-Step

```bash
# 1. Create project
npx claude-symphony my-saas-app
cd my-saas-app

# 2. Edit your project brief
# Open: stages/01-brainstorm/inputs/project_brief.md

# 3. Start brainstorming stage
# In Claude Code:
/brainstorm

# 4. Check status anytime
/status

# 5. Create handoff and move to next stage
/handoff
/next
```

### Project Brief Template

Edit `stages/01-brainstorm/inputs/project_brief.md`:

```markdown
## Project Name
my-saas-app

## One-line Description
[Describe your project in one line]

## Problem Definition
[What problem are you trying to solve?]

## Target Users
[Who are the main users?]

## Core Features (Draft)
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]
```

## Encore Mode (Memory Relay)

Start Claude with automatic session handoff when context reaches 50%:

```bash
# Start Encore Mode session
claude-symphony play

# With bypass mode (auto-approve permissions)
claude-symphony play --auto

# Check status
claude-symphony play:status

# View logs
claude-symphony play:logs -f

# Stop orchestrator
claude-symphony play:stop
```

### Session Layout

```
+--------------+------------------------+
|              |                        |
| Orchestrator |      Claude (50%)      |
|    (50%)     |                        |
|              |                        |
+--------------+------------------------+
```

- **Orchestrator** (left): Monitors context and handles session handoffs
- **Claude** (right): Main workspace for development

## Commands

### CLI Commands

| Command | Description |
|---------|-------------|
| `claude-symphony init` | Initialize a new project |
| `claude-symphony play` | Start Encore Mode session |
| `claude-symphony play --auto` | Start with bypass mode |
| `claude-symphony play:status` | Show orchestrator status |
| `claude-symphony play:logs` | View relay logs |
| `claude-symphony play:stop` | Stop orchestrator |
| `claude-symphony status` | Show pipeline status |
| `claude-symphony stages` | List all stages |

### Core Commands

| Command | Description |
|---------|-------------|
| `/status` | Check pipeline status |
| `/stages` | List all stages |
| `/run-stage <id>` | Run specific stage |
| `/next` | Move to next stage |
| `/handoff` | Create handoff document |
| `/checkpoint` | Create checkpoint |
| `/restore` | Restore checkpoint |
| `/context` | Check context usage |
| `/init-project` | Initialize project |

### AI Commands

| Command | Description |
|---------|-------------|
| `/gemini <prompt>` | Send prompt to Gemini |
| `/codex <prompt>` | Send prompt to Codex |

### Multi-AI Commands

| Command | Description |
|---------|-------------|
| `/collaborate` | Run multi-AI collaboration (parallel, sequential, debate modes) |
| `/benchmark` | Compare AI model performance on tasks |
| `/fork` | Create/manage pipeline branches for exploration |
| `/validate` | Validate stage outputs against quality criteria |

### Workflow Commands

| Command | Description |
|---------|-------------|
| `/epic` | Manage epic cycles (new, set-scope, set-count, history) |
| `/config order` | Set development order (frontend/backend/parallel) |
| `/moodboard` | Interactive design reference collection and analysis |
| `/refine` | Break down requirements (Epic → Feature → Task → Subtask) |

### Stage Shortcuts

| Stage | Command |
|-------|---------|
| 01-brainstorm | `/brainstorm` |
| 02-research | `/research` |
| 03-planning | `/planning` |
| 04-ui-ux | `/ui-ux` |
| 05-task-management | `/tasks` |
| 06-implementation | `/implement` |
| 07-refactoring | `/refactor` |
| 08-qa | `/qa` |
| 09-testing | `/test` |
| 10-deployment | `/deploy` |

## Configuration

Project configuration is stored in `config/pipeline.yaml` and other YAML files:

```yaml
claude_symphony:
  version: "2.0.0"

paths:
  project_root: "."
  stages_output: "./stages"
  state: "./state"
  checkpoints: "./state/checkpoints"

ai:
  gemini: true
  codex: true

tmux:
  gemini_session: "symphony-gemini"
  codex_session: "symphony-codex"
  output_timeout: 300

context:
  warning: 60
  action: 50
  critical: 40
  task_save_frequency: 5

git:
  commit_language: "English"
  auto_commit: true
```

## Project Structure

Each project created with `npx claude-symphony` is fully self-contained:

```
my-project/                        # PROJECT_ROOT
├── .claude/                       # Claude Code configuration
│   ├── commands/                  # Slash commands (29 commands)
│   │   ├── epic.md                # /epic - Epic cycle management
│   │   ├── moodboard.md           # /moodboard - Design collection
│   │   ├── refine.md              # /refine - Requirements refinement
│   │   ├── config.md              # /config - Implementation order
│   │   ├── status.md              # /status - Pipeline status
│   │   ├── collaborate.md         # /collaborate - Multi-AI collaboration
│   │   └── ...
│   ├── hooks/                     # Lifecycle hooks (8 hooks)
│   │   ├── pre-stage.sh
│   │   ├── post-stage.sh
│   │   ├── auto-checkpoint.sh
│   │   └── ...
│   ├── skills/                    # AI skills (7 skills)
│   └── settings.json
├── stages/                        # 10-stage pipeline
│   ├── 01-brainstorm/
│   │   ├── CLAUDE.md              # Stage-specific AI instructions
│   │   ├── config.yaml
│   │   ├── prompts/
│   │   ├── inputs/
│   │   │   └── project_brief.md   # Start here!
│   │   ├── outputs/               # Generated artifacts
│   │   └── HANDOFF.md
│   ├── 02-research/
│   └── ... (10 stages total)
├── config/                        # Pipeline configuration (24 files)
│   ├── pipeline.yaml              # Core pipeline settings
│   ├── context.yaml               # Context management
│   ├── epic_cycles.yaml           # Epic cycle configuration
│   ├── implementation_order.yaml  # Dev order settings
│   ├── requirements_refinement.yaml # Refinement rules
│   ├── ui-ux.yaml                 # Moodboard & design settings
│   ├── ai_collaboration.yaml      # Multi-AI collaboration
│   ├── models.yaml                # AI model configuration
│   └── ...
├── state/                         # Project state
│   ├── progress.json              # Pipeline progress
│   ├── checkpoints/               # Recovery points
│   └── context/                   # Context snapshots
├── scripts/                       # Helper scripts (25 scripts)
│   ├── common.sh                  # Shared utilities
│   ├── epic-cycle.sh              # Epic cycle management
│   ├── moodboard-manager.sh       # Moodboard collection
│   ├── requirements-refine.sh     # Requirements refinement
│   ├── ai-benchmark.sh            # AI benchmarking
│   └── ...
├── CLAUDE.md                      # Main AI instructions
└── src/                           # Source code (from stage 06)
```

## Design Patterns

1. **Sequential Workflow Architecture** - Sequential stage definition and auto-progression
2. **Stateless Orchestration** - Stateless context transfer via HANDOFF.md
3. **Orchestrator-Workers** - Parallel agent execution (Brainstorm stage)
4. **Proactive State Externalization** - External state file management
5. **State Machine Workflow** - State transition management (progress.json)
6. **Layered Configuration** - Hierarchical configuration structure
7. **Multi-AI Collaboration** - Parallel, sequential, and debate modes for AI coordination
8. **Pipeline Forking** - Branch exploration with merge capabilities
9. **Smart Context Management** - Semantic compression and AI memory integration
10. **Iterative Refinement Loops** - Epic cycles, requirements refinement, and moodboard feedback
11. **Hierarchical Decomposition** - 4-level requirement breakdown (Epic → Feature → Task → Subtask)

## Development

### Prerequisites

- Node.js >= 20.12.0
- tmux (for AI sessions)

### Setup

```bash
# Clone repository
git clone https://github.com/znehraks/claude-symphony.git
cd claude-symphony

# Install dependencies
npm install

# Test locally
node bin/create.js test-project
```

### Repository Structure

```
claude-symphony/
├── bin/
│   └── create.js           # npx entry point
├── template/               # Project template
│   ├── .claude/            # Claude Code config
│   │   ├── commands/       # Slash commands
│   │   ├── hooks/          # Lifecycle hooks
│   │   └── skills/         # AI skills
│   ├── stages/             # 10-stage pipeline
│   ├── config/             # Configuration files
│   ├── scripts/            # Helper scripts
│   ├── state/              # State management
│   └── CLAUDE.md
├── assets/                 # Images and assets
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Maintenance
- `refactor`: Code refactoring
- `test`: Test updates

## License

MIT

## Related

- [Claude Code](https://claude.ai/claude-code) - AI coding assistant
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google's AI CLI
