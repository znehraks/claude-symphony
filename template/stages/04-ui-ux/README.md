# Stage 04: UI/UX Planning

User interface and experience design

## Overview

This stage focuses on user interface and experience design, creating wireframes, user flows, and establishing the design system foundation.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | Gemini | Creative UI design |
| Secondary | ClaudeCode | UX validation |

**Collaboration Mode**: Parallel execution

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../03-planning/HANDOFF.md

# Optionally prepare moodboard
/moodboard
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 04-ui-ux

# Method 2: Direct script execution
../../scripts/run-stage.sh 04-ui-ux
```

### 3. Manual Workflow

```bash
# Step 1: Moodboard collection (optional)
/moodboard add ui ~/Desktop/reference.png

# Step 2: Wireframe design with Gemini
/gemini "$(cat prompts/wireframes.md)"

# Step 3: User flow definition

# Step 4: Design system establishment

# Step 5: Generate HANDOFF.md
/handoff
```

## Directory Structure

```
04-ui-ux/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── wireframes.md   # Wireframe design prompt
│   ├── user_flows.md   # User flow prompt
│   └── design_system.md  # Design system prompt
├── templates/
├── inputs/
│   └── moodboard/      # Design references
├── outputs/            # Output files
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Generated handoff (upon completion)
```

## Completion Criteria

- [ ] Main screen wireframes (5+)
- [ ] 3+ core user flows
- [ ] Design system foundation definition
- [ ] Component list creation
- [ ] Generate HANDOFF.md

## Outputs

| File | Description |
|------|-------------|
| `outputs/wireframes.md` | Wireframes (ASCII/Mermaid) |
| `outputs/user_flows.md` | User flows |
| `outputs/design_system.md` | Design system |
| `HANDOFF.md` | Handoff document for next stage |

## Next Stage

**-> 05-task-management**: Task breakdown and sprint planning

## Tips

1. **User-centric**: Always think from the user's perspective
2. **Use moodboard**: Collect design references for consistent direction
3. **Accessibility**: Consider accessibility from the start
4. **Component thinking**: Design with reusable components in mind
