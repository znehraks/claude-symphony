# claude-symphony — Auto-Pilot Development Pipeline

Describe your app. We handle the rest — planning, architecture, code, tests, deployment.

## Quick Start

Run `/auto-pilot` to start the automatic 8-stage pipeline. The orchestrator will:
1. Read each stage's instructions from `stages/XX/CLAUDE.md`
2. Load reference materials from `references/XX/`
3. Execute the stage work using a specialized AI agent
4. Validate outputs and generate HANDOFF context
5. Auto-progress to the next stage

## Pipeline Stages

| # | Stage | Focus | Model |
|---|-------|-------|-------|
| 01 | Brainstorming | Ideas, features, requirements | reasoning |
| 02 | Research | Tech evaluation, feasibility | balanced |
| 03 | Planning | Architecture, data models, API, conventions | reasoning |
| 04 | UI/UX | Wireframes, components, design | balanced |
| 05 | Tasks | Task decomposition, priorities | fast |
| 06 | Implementation | Write actual code (TDD + refactoring + E2E sheet) | balanced |
| 07 | QA & Full Testing | Security, bugs, all tests must pass | balanced |
| 08 | Deployment | CI/CD, hosting, production | fast |

### Model Strategy

- **reasoning**: Creative ideation, architecture design, security audit, performance analysis
- **balanced**: Code generation, research, testing, QA
- **fast**: Task decomposition, validation, deployment config

## Commands

| Command | Description |
|---------|-------------|
| `/auto-pilot` | Start automatic pipeline execution |
| `/pause` | Pause the pipeline after current stage |
| `/resume-stage` | Resume a paused pipeline |
| `/skip` | Skip the current stage |
| `/progress` | View current pipeline progress |
| `/checkpoint` | Create a checkpoint (save point) |
| `/restore` | Restore from a checkpoint |
| `/stages` | List all stages with status |
| `/run-stage [id]` | Run a specific stage manually |
| `/debate` | Run multi-agent debate for current stage |
| `/goto <stage>` | Emergency loop-back to a previous stage (critical flaws only) |

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
├── 07-qa/            # QA checklists, testing standards
└── 08-deployment/    # CI/CD templates, infrastructure configs
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

## Stage Loop-Back Guide (Emergency Only)

Loop-back is an **exceptional measure** reserved for critical flaws that make forward progress impossible. Most issues should be resolved in-place within the current stage.

### Critical Flaw Criteria (ALL must be true)

A loop-back is justified ONLY when ALL of the following conditions are met:
1. **Blocking**: The flaw makes it impossible to proceed (not just inconvenient)
2. **Unfixable in-place**: Cannot be resolved by the current stage alone
3. **Root cause is in a previous stage**: The flaw originates from an earlier stage's output

### Decision Matrix

| Severity | Example | Action |
|----------|---------|--------|
| **CRITICAL** — Pipeline blocked | Architecture fundamentally incompatible with requirements | Loop back with `/goto` |
| **CRITICAL** — Pipeline blocked | Convention makes implementation technically impossible | Loop back with `/goto` |
| **HIGH** — Significant but workable | Design asset needs substantial changes | Fix in-place + document in changelog |
| **MEDIUM** — Inconvenient | Task decomposition slightly off | Fix in-place + update tasks.md |
| **LOW** — Minor | Typo, unclear wording | Fix in-place |

### Loop-Back Protocol

When a critical flaw is confirmed:

1. **Checkpoint first**: `/checkpoint "Pre-loopback to XX — [flaw description]"`
2. **Document the flaw**: Write a Critical Flaw Report in current stage's `implementation_log.md` or `qa_report.md`
3. **Execute**: `/goto <target-stage> -r "CRITICAL: [description]"`
4. **Focused re-execution**: ONLY re-work the affected parts — do NOT re-execute the entire target stage
5. **Forward cascade**: Re-validate all intermediate stages' outputs after the fix
6. **Resume**: Return to original stage and continue

### Loop-Back Decision Process

Loop-backs are NOT triggered unilaterally. Before any loop-back, the orchestrator runs a **focused debate**:

1. **Flaw Report**: The agent that discovered the flaw writes a Critical Flaw Report
2. **Debate**: Launch a mini-debate (2 agents) to evaluate the flaw:
   - **Advocate**: Argues why loop-back is necessary (presents evidence)
   - **Skeptic**: Challenges whether an in-place fix is possible
3. **Decision**: If both agents agree loop-back is unavoidable → proceed. If the Skeptic proposes a viable in-place alternative → use it instead.
4. **Log**: Record the debate outcome in `state/ai-call-log.jsonl`

This ensures loop-backs only happen when genuinely necessary, not as a reflex.

### Loop-Back History

All loop-backs are recorded in `state/loopback_history.json` and appended to HANDOFF.md.

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

Each stage includes role-specific instructions:

| Stage | Persona |
|-------|---------|
| 01 Brainstorm | Creative Explorer |
| 02 Research | Analytical Investigator |
| 03 Planning | Strategic Architect |
| 04 UI/UX | Creative Designer |
| 05 Tasks | Systematic Organizer |
| 06 Implementation | Precise Builder |
| 07 QA & Testing | Quality Guardian |
| 08 Deployment | DevOps Engineer |

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
- Destructive operations without checkpoint (stages 06-08)
