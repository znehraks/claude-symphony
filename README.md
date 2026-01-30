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

- **Sub-Agent System (NEW in v0.4.x)**: Specialized agents run in isolated contexts (0% main session usage), achieving 100-120% cumulative context savings
- **10-Stage Pipeline**: Complete development cycle from brainstorming to deployment
- **Multi-AI Orchestration**: Intelligent collaboration between Gemini, Claude, and Codex
- **Smart HANDOFF System**: Automatic context extraction and semantic compression
- **Context Monitoring**: Real-time context tracking via statusline with auto-compact integration
- **Auto-Checkpoint & Rollback**: Task-based triggers with partial rollback support
- **Pipeline Forking**: Branch exploration for architecture alternatives
- **Stage Personas**: Optimized AI behavior profiles per stage
- **Output Validation**: Automated quality checks with sub-agent fallback

### Pipeline Stages

| Stage | Name | AI Model | Mode |
|-------|------|----------|------|
| 01 | Brainstorming | Gemini + Claude | YOLO |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini + Claude | Plan Mode |
| 04 | UI/UX Planning | Gemini + Claude | Plan Mode |
| 05 | Task Management | Claude | Plan Mode |
| 06 | Implementation | Claude | Plan + Sandbox |
| 07 | Refactoring | Codex + Claude | Deep Dive |
| 08 | QA | Claude | Plan + Sandbox |
| 09 | Testing & E2E | Codex + Claude | Sandbox + Playwright |
| 10 | CI/CD & Deployment | Claude | Headless |

## Quick Start

```bash
# Create a new project
npx claude-symphony init
cd my-project

# Edit project brief
# stages/01-brainstorm/inputs/project_brief_sample.md

# Start development with Claude Code
/brainstorm
```

## Sub-Agent System

claude-symphony features a sub-agent system where specialized agents execute tasks in isolated contexts, preserving your main session's context window.

### Tier 1 Agents (Implemented in v0.4.x)

| Agent | Purpose | Execution Time | Context Usage |
|-------|---------|----------------|---------------|
| **validation-agent** | Validates stage outputs against quality criteria | ~15s | 0% |
| **handoff-generator-agent** | Generates intelligent stage transition documents | ~30s | 0% |
| **output-synthesis-agent** | Consolidates parallel AI outputs (Gemini + Claude) | ~35s | 0% |
| **architecture-review-agent** | Detects circular dependencies and architectural issues | ~40s | 0% |
| **research-analysis-agent** | Cross-references research outputs, detects contradictions | ~45s | 0% |

### Tier 2 Agents (Structure Only)

| Agent | Purpose | Status |
|-------|---------|--------|
| **qa-analysis-agent** | QA analysis and defect detection | Structure defined |
| **test-execution-agent** | Test execution orchestration | Structure defined |
| **checkpoint-manager-agent** | Checkpoint lifecycle management | Structure defined |
| **benchmark-analyzer-agent** | Performance benchmark analysis | Structure defined |

### Tier 3 Agents (Structure Only)

| Agent | Purpose | Status |
|-------|---------|--------|
| **requirements-validation-agent** | Requirements completeness validation | Structure defined |
| **task-decomposition-agent** | Task breakdown and estimation | Structure defined |
| **moodboard-analysis-agent** | UI/UX moodboard analysis | Structure defined |
| **cicd-validation-agent** | CI/CD pipeline validation | Structure defined |
| **smart-rollback-agent** | Intelligent rollback decisions | Structure defined |
| **refactoring-analysis-agent** | Code refactoring analysis | Structure defined |

### Benefits

- **Context Preservation**: 0% main session usage (agents run separately)
- **Automatic Integration**: Hooks trigger agents at key moments (`/next`, `/validate`, etc.)
- **Fallback Support**: Legacy validation available if agents fail (95%+ reliability)
- **Extended Thinking**: Tier 1 agents use extended thinking for deep analysis

### Documentation

- Agent definitions: `template/.claude/agents/` (15 agents)
- End-user guide: `template/docs/`
- Changelog: `CHANGELOG.md`

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

### Context Commands

```bash
# Check context status
/context

# Save snapshot manually
/context --save

# List all snapshots
/context --list
```

### Key Files

| File | Purpose |
|------|---------|
| `.claude/hooks/statusline.sh` | Real-time context monitoring |
| `.claude/hooks/stop.sh` | Auto-trigger after response |
| `state/context/` | Auto-saved snapshots |
| `state/handoffs/` | HANDOFF archive |
| `state/checkpoints/` | Checkpoint storage |
| `state/collaborations/` | AI collaboration results |

## Commands

### CLI Commands

| Command | Description |
|---------|-------------|
| `claude-symphony init` | Initialize a new project |
| `claude-symphony status` | Show pipeline status |
| `claude-symphony stages` | List all stages with status |
| `claude-symphony run-stage <id>` | Run a specific stage |
| `claude-symphony next` | Transition to next stage/sprint |
| `claude-symphony goto [stage-id]` | Jump to a previous stage |
| `claude-symphony validate` | Validate configuration |
| `claude-symphony checkpoint` | Create a checkpoint |
| `claude-symphony restore [id]` | Restore from checkpoint |
| `claude-symphony dashboard` | Show full dashboard |

### Core Slash Commands

| Category | Commands |
|----------|---------|
| **Pipeline** | `/status`, `/next`, `/handoff`, `/checkpoint`, `/context`, `/validate`, `/restore` |
| **Multi-AI** | `/collaborate`, `/synthesize`, `/benchmark`, `/fork` |
| **Stage Shortcuts** | `/brainstorm`, `/research`, `/planning`, `/ui-ux`, `/tasks`, `/implement`, `/refactor`, `/qa`, `/test`, `/deploy` |
| **Agent** | `/arch-review`, `/qa-analyze` |
| **Configuration** | `/config`, `/goto`, `/init-project` |

See [template/docs/commands.md](template/docs/commands.md) for the complete command reference (34 commands).

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
│   ├── cli/                # CLI implementation (commands, utils)
│   ├── core/               # Core modules
│   │   ├── agents/         # Agent system (spawner, registry, types)
│   │   ├── ai/             # AI orchestration
│   │   ├── config/         # Config loader/validation
│   │   ├── pipeline/       # Pipeline engine
│   │   └── state/          # State management
│   ├── hooks/              # Lifecycle hooks
│   ├── integrations/       # External AI integrations
│   ├── types/              # Type definitions
│   └── utils/              # Utilities
├── test/                   # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── helpers/            # Test helpers
│   └── fixtures/           # Test fixtures
├── dist/                   # Compiled output
├── template/               # Project template (copied to user projects)
│   ├── .claude/            # Claude Code config
│   │   ├── commands/       # Slash commands (34)
│   │   ├── hooks/          # Lifecycle hooks (13 files)
│   │   ├── skills/         # AI skills (8)
│   │   └── agents/         # Sub-agent definitions (15)
│   ├── scripts/            # Runtime scripts
│   ├── stages/             # 10-stage pipeline
│   ├── config/             # Configuration files (27)
│   ├── state/              # State management
│   ├── docs/               # End-user documentation
│   └── CLAUDE.md           # Main AI instructions
├── schemas/                # JSON schemas for config validation
├── scripts/                # Development and runtime scripts
│   ├── dev/                # Framework development
│   ├── test/               # Test scripts
│   └── user/               # End-user runtime scripts
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
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:coverage` | Run tests with coverage |
| `pnpm run test:pipeline` | Run pipeline tests |
| `pnpm run benchmark` | Run agent benchmarks |
| `pnpm run clean` | Clean build output |

### Testing

#### Automated Tests (Vitest)
- **109 tests** covering core infrastructure and agent system
- **5 Tier 1 agents** with fallback verification
- **Mock utilities** for Task tool simulation
- **Framework**: Vitest with @vitest/coverage-v8

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Test pipeline functionality
pnpm test:pipeline
```

#### Agent Benchmarking
Performance testing for all 5 Tier 1 agents:
- **Average execution**: <5ms (infrastructure only)
- **Success rate**: 100% (verified in automated tests)
- **Context isolation**: 100% verified (0% main session usage)

```bash
# Run benchmark suite
pnpm run benchmark

# Results saved to: state/benchmarks/benchmark-{timestamp}.json
```

#### Manual E2E Testing
- Full Task tool integration verified across all Tier 1 agents
- Average execution: 31s (with actual Task tool)
- Success rate: 100% across all Tier 1 agents

**Test Coverage**:
- Agent loading and configuration: ✅
- Task spawning (foreground/background): ✅
- Error handling and fallback: ✅
- Infrastructure performance: ✅

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
