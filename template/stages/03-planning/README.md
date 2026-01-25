# Stage 03: Planning

System architecture and technology stack decision

## Overview

This stage designs the overall system architecture and makes final technology stack decisions based on research results.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Gemini | Architecture design, diagrams |
| Secondary | ClaudeCode | Technical validation |

**Collaboration Mode**: Parallel execution

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../02-research/HANDOFF.md
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 03-planning

# Method 2: Direct script execution
../../scripts/run-stage.sh 03-planning
```

### 3. Manual Workflow

```bash
# Step 1: Architecture design with Gemini
/gemini "$(cat prompts/architecture.md)"

# Step 2: Tech stack finalization

# Step 3: Project plan establishment

# Step 4: Requirements refinement
/refine --validate

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
03-planning/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── architecture.md # Architecture design prompt
│   ├── tech_stack_decision.md  # Tech stack prompt
│   └── project_plan.md # Project planning prompt
├── templates/
├── inputs/             # Input files
├── outputs/            # Output files
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Completion Criteria

- [ ] Write system architecture document
- [ ] Final technology stack decision
- [ ] Establish project plan
- [ ] Define 3+ milestones
- [ ] Requirements refined (`/refine --validate` passes)
- [ ] Generate HANDOFF.md

## Outputs

| File | Description |
|------|-------------|
| `outputs/architecture.md` | System architecture |
| `outputs/tech_stack.md` | Technology stack decision |
| `outputs/project_plan.md` | Project plan |
| `outputs/implementation.yaml` | Implementation rules |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 04-ui-ux**: User interface and experience design

## Tips

1. **Big picture first**: Focus on overall structure before details
2. **Risk identification**: Identify and plan for potential risks
3. **Use /refine**: Break down requirements to Feature/Task level
4. **Create implementation.yaml**: Define coding standards for Stage 06
