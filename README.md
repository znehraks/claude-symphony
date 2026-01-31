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

Unlike prototyping tools (Lovable, Bolt.new) that generate MVPs, claude-symphony runs a **disciplined development process** with quality gates, test coverage, and CI/CD — producing production-grade software.

## How It Works

claude-symphony orchestrates a 10-stage pipeline where AI agents execute each stage automatically:

| # | Stage | What happens |
|---|-------|-------------|
| 01 | **Brainstorm** | Generate features, user stories, requirements |
| 02 | **Research** | Evaluate tech options, analyze feasibility |
| 03 | **Planning** | Design architecture, data models, API |
| 04 | **UI/UX** | Create wireframes, component tree, design tokens |
| 05 | **Tasks** | Decompose into implementable tasks with priorities |
| 06 | **Implementation** | Write the actual code |
| 07 | **Refactoring** | Improve code quality and performance |
| 08 | **QA** | Security audit, accessibility, bug hunting |
| 09 | **Testing** | Unit, integration, and E2E tests |
| 10 | **Deployment** | CI/CD pipeline, hosting, production deploy |

Each stage:
- Has a specialized AI persona (creative for brainstorming, precise for implementation)
- Validates outputs before progressing (quality gates)
- Generates a HANDOFF document passing context to the next stage
- Can be retried automatically if validation fails

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

## Reference Materials

Drop any files into `references/<stage>/` to give the AI additional context:

```
references/
├── 01-brainstorm/    # Competitor screenshots, market research
├── 02-research/      # Technical papers, library comparisons
├── 03-planning/      # Architecture examples, API specs to follow
├── 04-ui-ux/         # Design references, wireframes, style guides
├── 05-task-management/
├── 06-implementation/ # Coding conventions, example code, patterns
├── 07-refactoring/
├── 08-qa/            # QA checklists, testing standards
├── 09-testing/       # Test examples, coverage requirements
└── 10-deployment/    # CI/CD templates, infrastructure configs
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

This is perfect for taking a Lovable/Bolt.new prototype and running it through QA → Testing → Deployment.

## Key Features

### Quality Gates
Every stage validates its outputs before progression. No skipping broken stages.

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

| | claude-symphony | Lovable/Bolt.new | SuperClaude | Raw Claude Code |
|---|---|---|---|---|
| **Output** | Production app | Prototype | Tools | Code |
| **Process** | 10-stage pipeline | Single generation | Manual commands | Manual |
| **Quality gates** | Yes | No | No | No |
| **Tests & CI/CD** | Automatic | No | No | Manual |
| **Persona switching** | Per-stage | No | No | No |

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed and authenticated
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
