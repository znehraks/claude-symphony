# Stage 01: Brainstorming

Divergent idea generation and requirements exploration

## Overview

This stage is the starting point of the project, performing creative idea divergence and initial requirements analysis.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Gemini | Creative idea generation, web research |
| Secondary | ClaudeCode | Structuring, feasibility review |

## Getting Started

### 1. Prepare Input Files

```bash
# Create project brief
cp templates/project_brief.md inputs/project_brief.md
# Edit and fill in content
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 01-brainstorm

# Method 2: Direct script execution
../../scripts/run-stage.sh 01-brainstorm
```

### 3. Manual Workflow

```bash
# Step 1: Divergent ideation with Gemini
/gemini "$(cat prompts/ideation.md)"

# Step 2: Save results to outputs/ideas.md

# Step 3: Requirements analysis
# ClaudeCode performs automatically

# Step 4: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
01-brainstorm/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── ideation.md     # Idea generation prompt
│   ├── persona.md      # Persona creation prompt
│   └── requirements.md # Requirements analysis prompt
├── templates/
│   ├── ideas.md        # Ideas output template
│   └── requirements_analysis.md  # Requirements output template
├── inputs/             # Input files
├── outputs/            # Output files
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Completion Criteria

- [ ] Generate at least 10 ideas
- [ ] Define 3 or more user personas
- [ ] Complete requirements analysis document
- [ ] Define MVP scope
- [ ] Generate HANDOFF.md

## Outputs

| File | Description |
|------|-------------|
| `outputs/ideas.md` | Brainstorming idea list |
| `outputs/requirements_analysis.md` | Requirements analysis results |
| `outputs/personas.md` | User personas (optional) |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**→ 02-research**: Technical research and market analysis

## Tips

1. **Divergent thinking**: Allow unrestricted free thinking at this stage
2. **Record everything**: For later review
3. **Use Gemini**: Leverage for competitor analysis requiring web search
4. **Structure later**: ClaudeCode handles structuring
