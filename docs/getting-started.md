# Getting Started

Get from idea to production-grade software in one command.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Node.js >= 20.12.0

## Step 1: Create a Project

```bash
npx claude-symphony init
```

You'll be asked one question: **"What do you want to build?"**

Describe your app in plain English:
```
A task management app with user authentication, drag-and-drop boards,
real-time collaboration, and a REST API backend with PostgreSQL.
```

This creates a project directory with the pipeline structure.

## Step 2: Start the Pipeline

```bash
cd my-project
claude          # Enter Claude Code session
/auto-pilot     # Start the 10-stage pipeline
```

The pipeline runs automatically through all 10 stages:

1. **Brainstorm** — Generates features, user stories, requirements
2. **Research** — Evaluates tech options, analyzes feasibility
3. **Planning** — Designs architecture, data models, API
4. **UI/UX** — Creates wireframes, component tree, design tokens
5. **Tasks** — Decomposes into implementable tasks with priorities
6. **Implementation** — Writes code using TDD (tests first, then code)
7. **Refactoring** — Improves code quality while maintaining test coverage
8. **QA** — Security audit, accessibility review, E2E test expansion
9. **Testing** — Edge-case tests, performance benchmarks
10. **Deployment** — CI/CD pipeline, hosting configuration

## Step 3: Review the Output

Each stage saves its work to `stages/<stage-id>/outputs/`. The final result is a working application with:

- Source code in the project root
- Tests (unit, integration, E2E)
- CI/CD configuration
- Deployment guide

## Pipeline Controls

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start automatic pipeline |
| `/pause` | Pause after current stage |
| `/resume` | Resume a paused pipeline |
| `/skip` | Skip the current stage |
| `/status` | View pipeline progress |
| `/checkpoint` | Create a save point |
| `/restore` | Restore from a save point |

## Adding Reference Materials

Drop files into `references/<stage>/` to give the AI additional context:

```
references/
├── 01-brainstorm/    # Competitor analysis, market research
├── 03-planning/      # Architecture examples, API specs
├── 04-ui-ux/         # Design references, wireframes
├── 06-implementation/ # Coding conventions, example code
└── ...
```

The AI reads these files automatically when executing the corresponding stage.

## Import an Existing Project

Already have a codebase? Import it:

```bash
claude-symphony import ./my-existing-app
```

This analyzes your project structure, detects which stages are already complete (e.g., if you already have tests and CI/CD), and runs only the remaining stages.

Use `--dry-run` to preview what would happen without making changes:

```bash
claude-symphony import ./my-existing-app --dry-run
```

## Next Steps

- Read [How It Works](./how-it-works.md) for a deeper understanding of the pipeline
- Check the [CHANGELOG](../CHANGELOG.md) for recent updates
