# /ui-ux

Start the 04-ui-ux stage directly.

## Usage
```
/ui-ux
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 04-ui-ux |
| AI Model | Gemini |
| Execution Mode | Plan Mode |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 03-planning completion status
   - PRD.md exists

2. **UI/UX Design**
   - Wireframe design
   - Component specification
   - Design system

3. **Output Generation**
   - wireframes/ - Wireframe files
   - component-spec.md - Component specification
   - design-system.md - Design system

## Execution

```bash
scripts/run-stage.sh 04-ui-ux "$ARGUMENTS"
```

## Input Files

- `stages/03-planning/outputs/PRD.md`
- `stages/03-planning/outputs/architecture.md`

## Output Files

- `stages/04-ui-ux/outputs/wireframes/`
- `stages/04-ui-ux/outputs/component-spec.md`
- `stages/04-ui-ux/outputs/design-system.md`

## Related Commands

- `/run-stage 04` - Start after prerequisite check
- `/next` - Next stage (05-task-management)
- `/planning` - Previous stage

## Tool Utilization

- Figma MCP - Design context (if configured)
- 21st Magic - UI component inspiration
