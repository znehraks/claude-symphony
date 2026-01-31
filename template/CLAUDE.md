# claude-symphony — Auto-Pilot Development Pipeline

Describe your app. We handle the rest — planning, architecture, code, tests, deployment.

## Quick Start

Run `/auto-pilot` to start the automatic 10-stage pipeline. The orchestrator will:
1. Read each stage's instructions from `stages/XX/CLAUDE.md`
2. Load reference materials from `references/XX/`
3. Execute the stage work using a specialized AI agent
4. Validate outputs and generate HANDOFF context
5. Auto-progress to the next stage

## Pipeline Stages

| # | Stage | Focus | Model |
|---|-------|-------|-------|
| 01 | Brainstorming | Ideas, features, requirements | sonnet (creative) |
| 02 | Research | Tech evaluation, feasibility | sonnet |
| 03 | Planning | Architecture, data models, API | sonnet |
| 04 | UI/UX | Wireframes, components, design | sonnet |
| 05 | Tasks | Task decomposition, priorities | haiku |
| 06 | Implementation | Write actual code | sonnet |
| 07 | Refactoring | Code quality, optimization | sonnet |
| 08 | QA | Security, accessibility, bugs | sonnet |
| 09 | Testing | Unit, integration, E2E tests | sonnet |
| 10 | Deployment | CI/CD, hosting, production | sonnet |

## Commands

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start automatic pipeline execution |
| `/pause` | Pause the pipeline after current stage |
| `/resume` | Resume a paused pipeline |
| `/skip` | Skip the current stage |
| `/status` | View current pipeline progress |
| `/checkpoint` | Create a checkpoint (save point) |
| `/restore` | Restore from a checkpoint |
| `/stages` | List all stages with status |
| `/run-stage [id]` | Run a specific stage manually |

## Reference Materials

Drop files into `references/<stage-id>/` to provide additional context for any stage:

```
references/
├── 01-brainstorm/    # Competitor analysis, market research
├── 02-research/      # Technical papers, library comparisons
├── 03-planning/      # Architecture examples, API specs
├── 04-ui-ux/         # Design references, wireframes, style guides
├── 05-task-management/# Task templates, sprint examples
├── 06-implementation/ # Coding conventions, example code
├── 07-refactoring/   # Quality rules, performance benchmarks
├── 08-qa/            # QA checklists, testing standards
├── 09-testing/       # Test examples, coverage requirements
└── 10-deployment/    # CI/CD templates, infrastructure configs
```

Supported formats: `.md`, `.txt`, `.json`, `.yaml`, `.ts`, `.js`, `.tsx`, `.jsx`, `.css`, `.html`

## Project Structure

```
your-project/
├── CLAUDE.md              # This file (pipeline instructions)
├── config/
│   ├── pipeline.jsonc     # Pipeline configuration
│   ├── stage_personas.jsonc # AI persona per stage
│   ├── handoff_intelligence.jsonc
│   ├── context.jsonc
│   └── output_validation.jsonc
├── stages/
│   └── XX-stage/
│       ├── CLAUDE.md      # Stage instructions (agent-executable)
│       ├── outputs/       # Stage deliverables
│       └── HANDOFF.md     # Generated context for next stage
├── references/            # User-provided reference materials
│   └── XX-stage/
├── state/
│   ├── progress.json      # Pipeline progress tracker
│   ├── checkpoints/       # Save points
│   └── handoffs/          # HANDOFF archive
└── .claude/
    ├── commands/          # Slash commands
    └── agents/            # Sub-agent definitions
```

## Stage Transition Protocol

Each stage follows this sequence:
1. Load stage `CLAUDE.md` for instructions
2. Load previous stage `HANDOFF.md` for context
3. Load `references/<stage>/` for user-provided materials
4. Execute all tasks defined in the stage instructions
5. Save outputs to `stages/<stage>/outputs/`
6. Validate outputs (required files exist, minimum quality)
7. Generate `HANDOFF.md` for the next stage
8. Update `state/progress.json`
9. Create checkpoint (for implementation-heavy stages)

## Stage Personas

Each stage uses an optimized AI behavior profile:

| Stage | Persona | Temperature |
|-------|---------|-------------|
| 01 Brainstorm | Creative Explorer | 0.9 |
| 02 Research | Analytical Investigator | 0.5 |
| 03 Planning | Strategic Architect | 0.6 |
| 04 UI/UX | Creative Designer | 0.7 |
| 05 Tasks | Systematic Organizer | 0.4 |
| 06 Implementation | Precise Builder | 0.3 |
| 07 Refactoring | Code Surgeon | 0.5 |
| 08 QA | Quality Guardian | 0.4 |
| 09 Testing | Methodical Tester | 0.3 |
| 10 Deployment | DevOps Engineer | 0.3 |

## HANDOFF System

HANDOFF.md files transfer context between stages. Each contains:
- What was accomplished
- Key decisions and rationale
- Files created/modified
- What the next stage needs to know
- Unresolved issues

## Output Validation

Each stage has required outputs that are validated before progression:
- File existence checks
- Minimum content size
- Required markdown sections
- Build/lint/test commands (for code stages)

If validation fails, the stage is retried with feedback.

## Prohibited Actions

- Skipping a stage without completing required outputs
- Modifying previous stage outputs
- Proceeding without generating HANDOFF.md
- Destructive operations without checkpoint (stages 06-10)
