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
- **Multi-AI Orchestration**: Intelligent collaboration between Gemini, Claude, and Codex
- **Smart HANDOFF System**: Automatic context extraction and semantic compression
- **Context Manager**: Automatic context monitoring with snapshot/HANDOFF generation at thresholds
- **Memory Relay (Encore Mode)**: Infinite session orchestration - Claude never stops
- **Auto-Checkpoint & Rollback**: Task-based triggers with partial rollback support
- **Pipeline Forking**: Branch exploration for architecture alternatives
- **Stage Personas**: Optimized AI behavior profiles per stage
- **Output Validation**: Automated quality checks

### Pipeline Stages

| Stage | Name | AI Model | Mode |
|-------|------|----------|------|
| 01 | Brainstorming | Gemini + Claude | YOLO |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | Claude | Plan Mode |
| 06 | Implementation | Claude | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | Claude | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | Claude | Headless |

## Quick Start

```bash
# Create a new project
npx claude-symphony my-project
cd my-project

# Edit project brief
# stages/01-brainstorm/inputs/project_brief.md

# Start development with Claude Code
/brainstorm
```

## Context Management

claude-symphony includes automatic context management to ensure continuous workflow even when Claude's context window fills up.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Context Thresholds (Remaining %)                           │
├─────────────────────────────────────────────────────────────┤
│  60%  │ Warning    │ Display warning banner                 │
│  50%  │ Action     │ Auto-snapshot + recommend /compact     │
│  40%  │ Critical   │ Generate HANDOFF.md + /clear required  │
└─────────────────────────────────────────────────────────────┘
```

### Encore Mode (Memory Relay)

Start with `claude-symphony-play` to enable automatic session handoff:

```bash
# Install Memory Relay (one-time)
./scripts/memory-relay/install.sh

# Start Encore Mode
claude-symphony-play

# With bypass mode
claude-symphony-play --bypass
```

When context drops below 50%, the system automatically:
1. Creates a snapshot in `state/context/`
2. Generates `HANDOFF.md` with recovery instructions
3. Signals Memory Relay to start a new session
4. New session continues from where you left off

### Manual Context Commands

```bash
# Check context status
/context

# Save snapshot manually
/context --save

# List all snapshots
/context --list

# Trigger relay manually
/context --relay
```

## Commands

### CLI Commands

| Command | Description |
|---------|-------------|
| `claude-symphony init` | Initialize a new project |
| `claude-symphony play` | Start Encore Mode (auto-handoff) |
| `claude-symphony play --auto` | Start with bypass mode |
| `claude-symphony status` | Show pipeline status |

### Core Slash Commands

| Command | Description |
|---------|-------------|
| `/status` | Check pipeline status |
| `/next` | Move to next stage |
| `/handoff` | Create handoff document |
| `/checkpoint` | Create checkpoint |
| `/context` | Context management (status, save, list, relay) |

See [template/docs/commands.md](template/docs/commands.md) for the complete command reference.

---

## Development

### Prerequisites

- Node.js >= 20.12.0
- pnpm (recommended) or npm
- tmux (for AI sessions)

### Setup

```bash
# Clone repository
git clone https://github.com/znehraks/claude-symphony.git
cd claude-symphony

# Install dependencies
pnpm install

# Build
pnpm run build

# Test locally
node dist/cli/index.js init test-project
```

### Repository Structure

```
claude-symphony/
├── src/                    # Framework source code
│   └── cli/                # CLI implementation
├── dist/                   # Compiled output
├── template/               # Project template (copied to user projects)
│   ├── .claude/            # Claude Code config
│   │   ├── commands/       # Slash commands (30+)
│   │   ├── hooks/          # Lifecycle hooks (statusline, stop, etc.)
│   │   └── skills/         # AI skills (7)
│   ├── scripts/            # Runtime scripts
│   │   └── context-manager.sh  # Context automation
│   ├── stages/             # 10-stage pipeline
│   ├── config/             # Configuration files (25+)
│   ├── state/              # State management
│   ├── docs/               # End-user documentation
│   └── CLAUDE.md           # Main AI instructions
├── schemas/                # JSON schemas for config validation
├── scripts/                # Development and runtime scripts
│   ├── dev/                # Framework development
│   ├── test/               # Test scripts
│   ├── user/               # End-user runtime scripts
│   └── memory-relay/       # Session orchestration
├── docs/                   # Developer documentation
└── assets/                 # Images and assets
```

### Build Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build the CLI |
| `pnpm run dev` | Watch mode |
| `pnpm run typecheck` | Type checking |
| `pnpm run lint` | Lint source |
| `pnpm run test` | Run tests |

### Testing

```bash
# Run unit tests
pnpm run test

# Run with coverage
pnpm run test:coverage

# Test pipeline functionality
pnpm run test:pipeline
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
