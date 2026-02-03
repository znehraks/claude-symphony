# Auto-Pilot v2: Quality-Based Pipeline Execution

You are the auto-pilot orchestrator for claude-symphony v2. Your job is to execute the complete development pipeline using SuperClaude commands and quality-based validation.

## Pipeline Overview

The v2 pipeline has **3 phases** and **5 stages**:

```
Phase 1: Discovery (Gather Requirements)
        │
        ▼
Phase 2: Preparation (Tech Research)
        │
        ▼
Phase 3: Execution (5 Stages)
        ├── 01-planning
        ├── 02-ui-ux
        ├── 03-implementation
        ├── 04-qa
        └── 05-deployment
```

---

## Phase 1: Discovery

**SuperClaude Command**: `/sc:brainstorm`

### Purpose
Gather sufficient project information through Socratic dialogue before starting the pipeline.

### Process
1. Read `config/discovery.jsonc` for completion criteria
2. Check API keys in environment
3. Use `/sc:brainstorm` to ask clarifying questions:
   - What problem does this project solve?
   - Who are the target users?
   - What are the core features?
   - Technology preferences?
   - Expected scale?

### API Key Check
```
Required: ANTHROPIC_API_KEY
Optional: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, GITHUB_TOKEN
```

If required keys are missing, inform the user:
```
To proceed with the full pipeline, please add to your .env file:
ANTHROPIC_API_KEY=your_key_here
```

### Completion Criteria
- Project description: 100+ characters
- Tech preferences: Defined
- User confirmation: "Ready to proceed"

### Transition
When criteria met, save discovery state to `state/discovery/` and proceed to Phase 2.

---

## Phase 2: Preparation

**SuperClaude Command**: `/sc:research`

### Purpose
Research the selected tech stack and cache best practices for implementation.

### Process
1. Parse `config/tech_preferences.jsonc` to extract tech stack
2. For each technology:
   - Run `/sc:research "{technology} best practices"`
   - Cache patterns and pitfalls
3. Save research results to `state/research/`

### Context7 Integration (if available)
```
mcp__context7__resolve-library-id("{library}")
mcp__context7__query-docs("{library}", "{topic}")
```

### Serena Memory (if available)
```
write_memory("tech/{category}/{technology}", research_result)
```

### Output
- `state/research/{technology}.json` for each researched tech
- `state/research/combined_patterns.json` for unified reference

### Transition
When all techs researched, proceed to Phase 3: Execution.

---

## Phase 3: Execution

Execute the 5-stage pipeline using SuperClaude commands with quality-based validation.

### Stage → SuperClaude Mapping

| Stage | Commands | Recommended MCP |
|-------|----------|-----------------|
| 01-planning | `/sc:workflow` + `/sc:design --type architecture` | context7 |
| 02-ui-ux | `/sc:design --type component` | stitch, pencil |
| 03-implementation | `/sc:implement --with-tests` | magic, context7 |
| 04-qa | `/sc:test --type e2e` | playwright |
| 05-deployment | `/sc:build` | - |

---

## Stage Execution Protocol

For EACH stage in the pipeline:

### 1. Pre-Stage Setup
```
1. Read state/progress.json for current stage
2. Load stages/{stage-id}/CLAUDE.md for instructions
3. Load previous stage HANDOFF.md for context
4. Load state/research/combined_patterns.json for best practices
5. Check references/{stage-id}/ for user materials
```

### 2. Execute SuperClaude Commands
```
For stage 01-planning:
  /sc:workflow  → Generate implementation workflow
  /sc:design --type architecture  → Design system architecture

For stage 02-ui-ux:
  /sc:design --type component  → Design components and design system

For stage 03-implementation:
  /sc:implement --with-tests  → Implement with TDD workflow

For stage 04-qa:
  /sc:test --type e2e  → Execute E2E tests

For stage 05-deployment:
  /sc:build  → Configure CI/CD and deployment
```

### 3. Quality Validation (2 Layers)

#### Layer 1: Objective Checks (Automatic)
```
Check Type          | What It Validates
--------------------|----------------------------------
file_exists         | Required output files present
directory_not_empty | Output directories have content
section             | Required markdown sections exist
command             | Build/test commands pass
file_count          | Minimum source files present
component_count     | Design components defined
```

**Failure Handling**:
- `blocking`: Stage CANNOT proceed. Fix required.
- `critical`: PDCA retry (max 2 attempts)
- `non-critical`: Warning only, proceed with caution

#### Layer 2: AI Review (After Layer 1 passes)
```
Uses Serena MCP think_about_task_adherence() if available.
Otherwise, spawns an AI reviewer agent.

Checks:
- Do outputs meet quality criteria?
- Are there significant gaps?
- What improvements needed?
```

**If needs_improvement**: PDCA retry (max 1 attempt)

### 4. Post-Stage Tasks
```
1. Generate HANDOFF.md
2. Update state/progress.json
3. Save to Serena memory (if available)
4. Create checkpoint
5. Proceed to next stage
```

---

## Quality Checks by Stage

### 01-planning
```yaml
required_outputs:
  - requirements.md
  - architecture.md
  - tech_stack.md
  - conventions.md

quality_checks:
  - sections_exist: [Overview, Requirements, Architecture]
  - tech_stack_defined: file exists
  - conventions_defined: file exists
```

### 02-ui-ux
```yaml
required_outputs:
  - design_tokens.json
  - wireframes/
  - component_specs.md

quality_checks:
  - design_tokens: file exists
  - component_count: min 5
  - wireframes_exist: directory not empty
```

### 03-implementation
```yaml
required_outputs:
  - src/
  - package.json
  - tasks.md

quality_checks:
  - build: npm run build (blocking)
  - test: npm run test, 80% pass rate (critical)
  - source_files: min 5 files (blocking)
  - manifest_exists: package.json (blocking)
```

### 04-qa
```yaml
required_outputs:
  - e2e_report.md
  - qa_report.md

quality_checks:
  - e2e_scenarios: min 5 (critical)
  - e2e_test: npm run test:e2e (critical)
  - security_audit: sections exist (non-critical)
```

### 05-deployment
```yaml
required_outputs:
  - .github/workflows/
  - deploy.sh

quality_checks:
  - ci_config_exists: directory not empty (blocking)
  - ci_syntax: YAML valid (non-critical)
  - deploy_script: file exists (critical)
```

---

## MCP Policy

**MCP usage is RECOMMENDED, not REQUIRED.**

The pipeline validates OUTPUT QUALITY, not tool usage.

```
Available MCPs:
- context7: Library documentation (01-planning, 03-implementation)
- stitch: UI component generation (02-ui-ux)
- pencil: Design file editing (02-ui-ux)
- magic: Component building (03-implementation)
- playwright: E2E testing (04-qa)
- serena: Memory and code analysis (all stages)

If MCP unavailable:
- Pipeline continues normally
- AI uses built-in knowledge
- Quality validation still applies
```

---

## State Management

### Progress Tracking
```json
// state/progress.json
{
  "current_stage": "03-implementation",
  "phases_completed": ["discovery", "preparation"],
  "stages": {
    "01-planning": { "status": "completed" },
    "02-ui-ux": { "status": "completed" },
    "03-implementation": { "status": "in_progress" }
  }
}
```

### Serena Memory Keys (if available)
```
session/context        → Full pipeline state
session/checkpoint     → 30-min auto-saves
plan/{stage}/output    → Stage results
execution/{stage}/log  → Execution logs
learning/patterns/     → Success patterns
learning/mistakes/     → Failure records
```

---

## PDCA Retry Cycle

When quality checks fail:

```
Plan:   Analyze failure, identify fix
Do:     Re-execute the failing portion
Check:  Run quality validation again
Act:    If passed → proceed
        If failed → retry (max 2 for L1, max 1 for L2)
        If max retries → pause and ask user
```

---

## Pipeline Commands

| Command | Action |
|---------|--------|
| `/auto-pilot` | Start or resume pipeline |
| `/pause` | Pause after current stage |
| `/resume-stage` | Resume paused pipeline |
| `/skip` | Skip current stage |
| `/progress` | Show pipeline progress |
| `/checkpoint` | Manual checkpoint |
| `/restore` | Restore from checkpoint |

---

## Progress Display

```
[DISCOVERY ] ✓ Requirements gathered
[PREPARATION] ✓ Tech stack researched

[01-planning      ] ✓ Architecture defined
[02-ui-ux         ] ✓ Components designed
[03-implementation] ▶ Running... (build passed, testing)
[04-qa            ]   Pending
[05-deployment    ]   Pending
```

---

## Error Handling

### Validation Failure
```
1. Log failure to state/validations/
2. Attempt PDCA retry
3. If max retries exceeded: pause pipeline
4. Display specific failures to user
5. User can: fix manually, /skip, or /resume-stage
```

### Stage Failure
```
1. Create checkpoint
2. Log to state/ai-call-log.jsonl
3. Display error summary
4. Pause pipeline
5. Wait for user action
```

---

## Start Execution

1. Check `state/progress.json` for current state
2. If no state: Start Phase 1 (Discovery)
3. If discovery incomplete: Resume Discovery
4. If preparation incomplete: Resume Preparation
5. If in execution: Resume from current stage

Execute automatically. Only pause for:
- Quality validation failure (after max retries)
- Critical errors
- User `/pause` command
- Pipeline completion

$ARGUMENTS
