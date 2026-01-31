# claude-symphony

<p align="center">
  <img src="https://raw.githubusercontent.com/znehraks/claude-symphony/main/assets/claude_symphony.webp" alt="Claude Symphony Logo" width="400">
</p>

**One command. Production-grade software. From idea to deployment.**

[![npm version](https://badge.fury.io/js/claude-symphony.svg)](https://www.npmjs.com/package/claude-symphony)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is claude-symphony?

Describe your app. We handle the rest — planning, architecture, code, tests, deployment.

```bash
npx claude-symphony init
# > "What do you want to build?"
# > "A real-time team collaboration tool with chat, file sharing, and video calls"
# > Pipeline starts automatically → 10 stages → production-ready app
```

Unlike prototyping tools (Lovable, Bolt.new) that generate MVPs, claude-symphony runs a **disciplined development process** with TDD enforcement, quality gates, test coverage, and CI/CD — producing production-grade software.

## How It Works

claude-symphony orchestrates a 10-stage pipeline where AI agents execute each stage automatically:

| # | Stage | What happens |
|---|-------|-------------|
| 01 | **Brainstorm** | Generate features, user stories, requirements |
| 02 | **Research** | Evaluate tech options, analyze feasibility |
| 03 | **Planning** | Design architecture, data models, API |
| 04 | **UI/UX** | Create wireframes, component tree, design tokens |
| 05 | **Tasks** | Decompose into implementable tasks with priorities |
| 06 | **Implementation** | Write code using **TDD** (tests first, then code) |
| 07 | **Refactoring** | Improve code quality, maintain test coverage |
| 08 | **QA** | Security audit, accessibility, E2E test expansion |
| 09 | **Testing** | Edge-case tests, performance benchmarks |
| 10 | **Deployment** | CI/CD pipeline, hosting, production deploy |

Each stage:
- Has a specialized AI persona (creative for brainstorming, precise for implementation)
- Validates outputs before progressing (quality gates)
- Generates a HANDOFF document passing context to the next stage
- Can be retried automatically if validation fails

## TDD-First Quality Gates

**"Code exists ≠ Code works."** This is the core problem claude-symphony solves.

Stage 06 (Implementation) enforces a Write-Test-Verify loop for every feature:

```
For EACH feature:
  1. Write tests first (unit + integration)
  2. Write implementation code
  3. Run tests → must pass before moving to next feature
  4. If tests fail → fix implementation, re-run
```

Quality gate (4 levels, must pass to complete):

| Level | Check | Required |
|-------|-------|----------|
| 1 | `npm run build` | Yes |
| 2 | `npm test` — all tests pass | Yes |
| 3 | `npm run test:e2e` — E2E tests | If configured |
| 4 | Lint + typecheck | Recommended |

If validation fails, the stage retries with failure details injected into the prompt.

## Quick Start

```bash
# Install and create a project
npx claude-symphony init

# Enter your Claude Code session
cd my-project
claude

# Start the auto-pilot pipeline
/auto-pilot
```

That's it. The pipeline runs through all 10 stages automatically.

See [Getting Started](docs/getting-started.md) for more details.

## Reference Materials

Drop any files into `references/<stage>/` to give the AI additional context:

```
references/
├── 01-brainstorm/    # Competitor screenshots, market research
├── 02-research/      # Technical papers, library comparisons
├── 03-planning/      # Architecture examples, API specs to follow
├── 04-ui-ux/         # Design references, wireframes, style guides
├── 06-implementation/ # Coding conventions, example code, patterns
└── ...
```

Zero config required — just drop files in the folder.

## Commands

Inside Claude Code, you have 9 commands:

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start automatic pipeline execution |
| `/pause` | Pause the pipeline after current stage |
| `/resume` | Resume a paused pipeline |
| `/skip` | Skip the current stage |
| `/status` | View current pipeline progress |
| `/checkpoint` | Create a save point |
| `/restore` | Restore from a save point |
| `/stages` | List all stages with status |
| `/run-stage [id]` | Run a specific stage manually |

### CLI Commands

```bash
claude-symphony init              # Create new project
claude-symphony init --auto       # Create and auto-start
claude-symphony import ./my-app   # Import existing project
claude-symphony import ./my-app --dry-run  # Analyze without modifying
claude-symphony status            # Show pipeline status
claude-symphony stages            # List all stages
claude-symphony checkpoint        # Create checkpoint
claude-symphony restore [id]      # Restore from checkpoint
```

### Import Existing Projects

Already have a project? Import it and run only the remaining stages:

```bash
claude-symphony import ./existing-app
# Analyzes your project → detects tests, CI/CD, components, etc.
# Skips completed stages → runs only what's missing
```

This is perfect for taking a Lovable/Bolt.new prototype and running it through QA, Testing, and Deployment.

## Key Features

### TDD-First Implementation
Every feature is built with tests first. No code is considered "done" until tests pass. This is enforced at the pipeline level — not just a suggestion.

### Quality Gates
Every stage validates its outputs before progression. Build must compile, tests must pass, coverage must meet thresholds.

### Stage Personas
Each stage uses an AI persona optimized for the task:
- Brainstorming: Creative Explorer (temperature 0.9)
- Implementation: Precise Builder (temperature 0.3)
- QA: Quality Guardian (temperature 0.4)

### HANDOFF System
Context is intelligently transferred between stages via HANDOFF documents — not raw memory dumps, but curated context relevant to the next stage.

### Retry & Recovery
If a stage fails validation, it's automatically retried with feedback. Checkpoints let you rollback to any previous state.

## Differentiation

| | claude-symphony | Lovable/Bolt.new | Raw Claude Code |
|---|---|---|---|
| **Output** | Production app with tests | Prototype | Code |
| **Process** | 10-stage pipeline | Single generation | Manual |
| **TDD enforcement** | Yes (per feature) | No | No |
| **Quality gates** | 4-level verification | No | No |
| **Tests & CI/CD** | Automatic | No | Manual |
| **Context management** | HANDOFF system | None | Token window |

<!-- ## Showcase

Coming soon — example projects built entirely with claude-symphony:

| Project | Description | Status |
|---------|-------------|--------|
| Todo App | Full-stack with auth | Planned |
| CLI Tool | Command-line utility | Planned |
| REST API | API + database | Planned |

-->

## Documentation

- [Getting Started](docs/getting-started.md) — 5-minute quickstart
- [How It Works](docs/how-it-works.md) — Pipeline architecture explained
- [CHANGELOG](CHANGELOG.md) — Release history

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Node.js >= 20.12.0

## Contributing

```bash
git clone https://github.com/znehraks/claude-symphony.git
cd claude-symphony
pnpm install
pnpm run build
pnpm run test
```

See [CLAUDE.md](CLAUDE.md) for development instructions.

## License

MIT
