# Stage Transition Skill

A skill that automates stage completion detection and transitions.

## Trigger Conditions

This skill auto-activates under these conditions:

1. **Completion expression detected**
   - "done", "completed", "finished", etc.
   - When stage-related work ends

2. **Completion criteria met**
   - All outputs files generated
   - config.yaml completion_criteria satisfied

3. **Explicit call**
   - After `/handoff` command
   - Before `/next` command

## Features

### 1. Completion Criteria Validation (validate.md)
- Check required outputs for current stage
- Check checkpoint requirements
- Auto-verify completion checklist

### 2. HANDOFF.md Generation (handoff-gen.md)
- Summarize completed work
- Extract key decisions
- Generate next step guidance

### 3. Transition Guidance (prompts/transition.md)
- Provide next stage information
- Guide input file locations
- Suggest shortcut commands

## Skill File Structure

```
stage-transition/
├── README.md           # This file
├── validate.md         # Completion criteria validation logic
├── handoff-gen.md      # Handoff auto-generation
└── prompts/
    └── transition.md   # Transition prompts
```

## Usage Examples

### Auto Trigger

```
User: "Brainstorming is done"

[stage-transition skill activated]
→ Validate 01-brainstorm completion criteria
→ Suggest HANDOFF.md generation
→ Provide next step guidance
```

### Validation Result Example

```
✅ Stage completion criteria verified

Current: 04-ui-ux

[Required outputs]
✓ wireframes/ exists
✓ component-spec.md generated
✓ design-system.md generated

[HANDOFF.md]
⚠️ Not yet generated

Suggestion: Run /handoff then transition with /next.
```

## Related Commands

- `/handoff` - Generate HANDOFF.md
- `/next` - Transition to next stage
- `/status` - Check current status
