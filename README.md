# claude-symphony

Multi-AI Orchestration Framework for Software Development

[![CI](https://github.com/znehraks/claude-symphony/actions/workflows/ci.yml/badge.svg)](https://github.com/znehraks/claude-symphony/actions/workflows/ci.yml)
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
- **Dual Distribution**: Both NPM CLI and Claude Code plugin available

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

## Packages

This monorepo contains three packages:

| Package | Description | Install |
|---------|-------------|---------|
| [`claude-symphony`](./packages/cli) | NPM CLI | `npm install -g claude-symphony` |
| [`@claude-symphony/core`](./packages/core) | Core library | `npm install @claude-symphony/core` |
| [`@claude-symphony/plugin`](./packages/plugin) | Claude Code plugin | `claude plugin install @claude-symphony/plugin` |

## Commands

### Core Commands

| Command | CLI | Plugin |
|---------|-----|--------|
| Initialize project | `symphony init` | `/init-project` |
| Show status | `symphony status` | `/status` |
| List stages | `symphony stages` | `/stages` |
| Run stage | `symphony run-stage <id>` | `/run-stage <id>` |
| Next stage | `symphony next` | `/next` |
| Create handoff | `symphony handoff` | `/handoff` |
| Create checkpoint | `symphony checkpoint` | `/checkpoint` |
| Restore checkpoint | `symphony restore` | `/restore` |
| Check context | `symphony context` | `/context` |

### AI Commands

| Command | CLI | Plugin |
|---------|-----|--------|
| Gemini prompt | `symphony gemini <prompt>` | `/gemini <prompt>` |
| Codex prompt | `symphony codex <prompt>` | `/codex <prompt>` |

### Multi-AI Commands

| Command | CLI | Plugin | Description |
|---------|-----|--------|-------------|
| AI Collaboration | `symphony collaborate` | `/collaborate` | Run multi-AI collaboration (parallel, sequential, debate modes) |
| AI Benchmarking | `symphony benchmark` | `/benchmark` | Compare AI model performance on tasks |
| Pipeline Fork | `symphony fork` | `/fork` | Create/manage pipeline branches for exploration |
| Output Validation | `symphony validate` | `/validate` | Validate stage outputs against quality criteria |

### Stage Shortcuts

| Stage | CLI | Plugin |
|-------|-----|--------|
| 01-brainstorm | `symphony brainstorm` | `/brainstorm` |
| 02-research | `symphony research` | `/research` |
| 03-planning | `symphony planning` | `/planning` |
| 04-ui-ux | `symphony ui-ux` | `/ui-ux` |
| 05-task-management | `symphony tasks` | `/tasks` |
| 06-implementation | `symphony implement` | `/implement` |
| 07-refactoring | `symphony refactor` | `/refactor` |
| 08-qa | `symphony qa` | `/qa` |
| 09-testing | `symphony test` | `/test` |
| 10-deployment | `symphony deploy` | `/deploy` |

## Configuration

Project configuration is stored in `.symphony-config.yaml`:

```yaml
claude_symphony:
  version: "2.0.0"

paths:
  project_root: "./my-app"
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

Each project is fully self-contained with all pipeline components:

```
my-project/                        # PROJECT_ROOT
├── .claude/                       # Claude Code configuration
│   ├── commands/                  # Slash commands (26 commands)
│   ├── hooks/                     # Lifecycle hooks
│   ├── skills/                    # AI skills
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
├── config/                        # Pipeline configuration
│   ├── pipeline.yaml
│   ├── context.yaml
│   └── ... (15+ config files)
├── state/                         # Project state
│   ├── progress.json              # Pipeline progress
│   ├── checkpoints/               # Recovery points
│   └── context/                   # Context snapshots
├── scripts/                       # Helper scripts
├── CLAUDE.md                      # Main AI instructions
├── src/                           # Source code (from stage 06)
└── package.json
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

## Documentation

- [CLI Reference](./packages/cli/README.md)
- [Plugin Reference](./packages/plugin/README.md)
- [Migration Guide](./docs/migration-guide.md)

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- tmux (for AI sessions)

### Setup

```bash
# Clone repository
git clone https://github.com/znehraks/claude-symphony.git
cd claude-symphony

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Local Development

```bash
# Link CLI globally
cd packages/cli
pnpm link --global

# Test CLI
symphony --help

# Link plugin to Claude Code
claude plugin link ./packages/plugin
```

### Monorepo Structure

```
claude-symphony/
├── packages/
│   ├── core/              # Shared business logic
│   │   ├── src/
│   │   │   ├── config/    # Configuration management
│   │   │   ├── stage/     # Stage management
│   │   │   ├── context/   # Context management
│   │   │   └── ai/        # AI model abstraction
│   │   └── package.json
│   │
│   ├── cli/               # NPM CLI package
│   │   ├── src/
│   │   │   ├── commands/  # CLI commands
│   │   │   └── prompts/   # Interactive prompts
│   │   ├── bin/ax.js
│   │   └── package.json
│   │
│   └── plugin/            # Claude Code plugin
│       ├── plugin.json
│       ├── CLAUDE.md
│       ├── .claude/
│       │   ├── commands/  # Slash commands
│       │   └── hooks/     # Lifecycle hooks
│       ├── scripts/       # Helper scripts
│       └── package.json
│
├── templates/             # Installable templates
│   └── default/           # Default 10-stage template
│
├── docs/                  # Documentation
└── package.json           # Monorepo root
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
