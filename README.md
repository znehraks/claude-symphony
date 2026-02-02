# claude-symphony

<p align="center">
  <img src="https://raw.githubusercontent.com/znehraks/claude-symphony/main/assets/claude_symphony.webp" alt="Claude Symphony Logo" width="400">
</p>

**Structured AI development. 10 stages. Quality gates. Checkpoints.**

[![npm version](https://badge.fury.io/js/claude-symphony.svg)](https://www.npmjs.com/package/claude-symphony)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is claude-symphony?

Describe your app. claude-symphony runs a 10-stage AI pipeline — from brainstorming to deployment — producing a tested, deployable codebase with quality gates at every step.

```bash
npx claude-symphony init
# > "What do you want to build?"
# > "A real-time team collaboration tool with chat, file sharing, and video calls"
# > Pipeline starts automatically → 10 stages → tested, deployable codebase
```

## How It Works

claude-symphony orchestrates a 10-stage pipeline where AI agents execute each stage:

| # | Stage | What happens |
|---|-------|-------------|
| 01 | **Brainstorm** | Generate features, user stories, requirements |
| 02 | **Research** | Evaluate tech options, analyze feasibility |
| 03 | **Planning** | Design architecture, data models, API |
| 04 | **UI/UX** | Create wireframes, component tree, design tokens |
| 05 | **Tasks** | Decompose into implementable tasks with priorities |
| 06 | **Implementation** | Write code using a test-first workflow |
| 07 | **Refactoring** | Improve code quality, maintain test coverage |
| 08 | **QA** | Security audit, accessibility, E2E test expansion |
| 09 | **Testing** | Edge-case tests, performance benchmarks |
| 10 | **Deployment** | CI/CD pipeline, hosting, production deploy |

> **Multi-agent debate**: Stages can run multiple Claude agents with different perspectives (e.g., Visionary vs Skeptic). This is a prompt-based protocol — agents are instructed to critique and refine each other's outputs within the conversation.

Each stage:
- Includes role-specific instructions (creative for brainstorming, precise for implementation)
- Validates outputs before progressing (quality gates)
- Generates a HANDOFF document passing context to the next stage
- Can be retried automatically if validation fails

## Quality Gates

Every stage validates its outputs. Stage 06 (Implementation) guides a Write-Test-Verify workflow for each feature:

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

See [Getting Started](docs/getting-started.md) for more details. You can also drop reference files into `references/<stage>/` to give the AI additional context.

## Commands

Inside Claude Code, you have 10 commands:

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start automatic pipeline execution |
| `/pause` | Pause the pipeline after current stage |
| `/resume-stage` | Resume a paused pipeline |
| `/skip` | Skip the current stage |
| `/progress` | View current pipeline progress |
| `/checkpoint` | Create a save point |
| `/restore` | Restore from a save point |
| `/stages` | List all stages with status |
| `/run-stage [id]` | Run a specific stage manually |
| `/debate` | Run multi-agent debate for current stage |

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

This is useful for taking an existing prototype and running it through QA, Testing, and Deployment.

## Without vs With claude-symphony

| | Without | With claude-symphony |
|---|---|---|
| **Output** | Code (quality varies) | Tested codebase with CI/CD config |
| **Process** | Manual or single generation | 10-stage pipeline with checkpoints |
| **Quality gates** | None | 4-level verification (build, test, E2E, lint) |
| **Tests** | Manual setup | Generated per feature |
| **Context management** | Token window only | HANDOFF system between stages |

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
