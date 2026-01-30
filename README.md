# claude-symphony

<p align="center">
  <img src="https://raw.githubusercontent.com/znehraks/claude-symphony/main/assets/claude_symphony.webp" alt="Claude Symphony Logo" width="400">
</p>

Multi-AI Orchestration Framework for Software Development

[![npm version](https://badge.fury.io/js/claude-symphony.svg)](https://www.npmjs.com/package/claude-symphony)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

claude-symphony is a 10-stage software development workflow pipeline that orchestrates multiple AI models (Claude, Gemini, Codex) through a complete development cycle.

### Key Features

- **Sub-Agent System**: Specialized agents run in isolated contexts, preserving your main session's context window
- **10-Stage Pipeline**: Complete development cycle from brainstorming to deployment
- **Multi-AI Orchestration**: Collaboration between Gemini, Claude, and Codex
- **Smart HANDOFF System**: Context extraction and stage transition documents
- **Context Monitoring**: Context tracking via statusline
- **Auto-Checkpoint & Rollback**: Task-based triggers with partial rollback support
- **Pipeline Forking**: Branch exploration for architecture alternatives
- **Stage Personas**: Optimized AI behavior profiles per stage
- **Output Validation**: Automated quality checks with sub-agent fallback

### Pipeline Stages

| Stage | Name               | AI Model        |
| ----- | ------------------ | --------------- |
| 01    | Brainstorming      | Gemini + Claude |
| 02    | Research           | Claude          |
| 03    | Planning           | Gemini + Claude |
| 04    | UI/UX Planning     | Gemini + Claude |
| 05    | Task Management    | Claude          |
| 06    | Implementation     | Claude          |
| 07    | Refactoring        | Codex + Claude  |
| 08    | QA                 | Claude          |
| 09    | Testing & E2E      | Codex + Claude  |
| 10    | CI/CD & Deployment | Claude          |

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed and authenticated
- Node.js >= 20.12.0
- (Optional) [Gemini CLI](https://github.com/google-gemini/gemini-cli) for multi-AI stages
- (Optional) [Codex CLI](https://github.com/openai/codex) for refactoring/testing stages
- (Optional) tmux for AI session management

## Quick Start

```bash
# Create a new project
npx claude-symphony init
cd my-project

# Edit your project brief
# stages/01-brainstorm/inputs/project_brief_sample.md

# Launch Claude Code in the project directory
claude

# Inside Claude Code, start the first stage:
/brainstorm
```

## Sub-Agent System

claude-symphony features a sub-agent system where specialized agents execute tasks in isolated contexts, preserving your main session's context window.

### Built-in Agents

| Agent                         | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| **validation-agent**          | Validates stage outputs against quality criteria          |
| **handoff-generator-agent**   | Generates stage transition documents                      |
| **output-synthesis-agent**    | Consolidates parallel AI outputs (Gemini + Claude)        |
| **architecture-review-agent** | Detects circular dependencies and architectural issues    |
| **research-analysis-agent**   | Cross-references research outputs, detects contradictions |

### Benefits

- **Context Preservation**: Agents run in isolated contexts, separate from your main session
- **Automatic Integration**: Hooks trigger agents at key moments (`/next`, `/validate`, etc.)
- **Fallback Support**: Legacy validation available if agents fail

## Context Management

claude-symphony provides context management tools to help track and manage Claude's context window.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Context Thresholds (Remaining %)                           │
├─────────────────────────────────────────────────────────────┤
│  60%  │ Warning    │ Display warning banner                 │
│  50%  │ Action     │ Recommend snapshot + /compact           │
│  40%  │ Critical   │ Generate HANDOFF.md + /clear required  │
└─────────────────────────────────────────────────────────────┘
```

### Context Commands

```bash
# Check context status
/context

# Save snapshot manually
/context --save

# List all snapshots
/context --list
```

## Commands

### CLI Commands

| Command                           | Description                     |
| --------------------------------- | ------------------------------- |
| `claude-symphony init`            | Initialize a new project        |
| `claude-symphony status`          | Show pipeline status            |
| `claude-symphony stages`          | List all stages with status     |
| `claude-symphony run-stage <id>`  | Run a specific stage            |
| `claude-symphony next`            | Transition to next stage/sprint |
| `claude-symphony goto [stage-id]` | Jump to a previous stage        |
| `claude-symphony validate`        | Validate configuration          |
| `claude-symphony checkpoint`      | Create a checkpoint             |
| `claude-symphony restore [id]`    | Restore from checkpoint         |
| `claude-symphony dashboard`       | Show full dashboard             |

### Core Slash Commands

| Category                  | Commands                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Pipeline**              | `/status`, `/next`, `/handoff`, `/checkpoint`, `/context`, `/validate`, `/restore`, `/run-stage`, `/stages`       |
| **Multi-AI**              | `/collaborate`, `/synthesize`, `/benchmark`, `/fork`, `/gemini`, `/codex`                                         |
| **Stage Shortcuts**       | `/brainstorm`, `/research`, `/planning`, `/ui-ux`, `/tasks`, `/implement`, `/refactor`, `/qa`, `/test`, `/deploy` |
| **Requirements & Design** | `/epic`, `/refine`, `/moodboard`, `/moodboard generate`, `/pencil`, `/stitch`                                     |
| **Agent**                 | `/arch-review`, `/qa-analyze`                                                                                     |
| **Configuration**         | `/config`, `/goto`, `/init-project`                                                                               |

See [template/docs/commands.md](template/docs/commands.md) for the complete command reference.

## Contributing

### Prerequisites

- Node.js >= 20.12.0
- pnpm (recommended) or npm

### Setup

```bash
git clone https://github.com/znehraks/claude-symphony.git
cd claude-symphony
pnpm install
pnpm run build
```

### Build Commands

| Command                  | Description             |
| ------------------------ | ----------------------- |
| `pnpm run build`         | Build the CLI           |
| `pnpm run dev`           | Watch mode              |
| `pnpm run typecheck`     | Type checking           |
| `pnpm run lint`          | Lint source             |
| `pnpm run test`          | Run tests               |
| `pnpm run test:coverage` | Run tests with coverage |
| `pnpm run test:pipeline` | Run pipeline tests      |
| `pnpm run clean`         | Clean build output      |

### Repository Structure

```
claude-symphony/
├── src/                    # Framework source code
│   ├── cli/                # CLI implementation
│   ├── core/               # Core modules (agents, pipeline, state)
│   ├── hooks/              # Lifecycle hooks
│   ├── integrations/       # External AI integrations
│   ├── types/              # Type definitions
│   └── utils/              # Utilities
├── test/                   # Test suite
├── dist/                   # Compiled output
├── template/               # Project template (copied to user projects)
├── schemas/                # JSON schemas for config validation
├── scripts/                # Development and runtime scripts
└── assets/                 # Images and assets
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Maintenance
- `refactor`: Code refactoring
- `test`: Test updates

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure `pnpm run build && pnpm run test && pnpm run typecheck` pass
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT

## Related

- [Claude Code](https://claude.ai/claude-code) - AI coding assistant
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google's AI CLI
