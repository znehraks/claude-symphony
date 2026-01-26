# /run-stage

Run a specific stage.

## Usage
```
/run-stage [stage-id]
```

## Stage IDs
- `01-brainstorm` - Brainstorming
- `02-research` - Research
- `03-planning` - Planning
- `04-ui-ux` - UI/UX Design
- `05-task-management` - Task Management
- `06-implementation` - Implementation
- `07-refactoring` - Refactoring
- `08-qa` - QA
- `09-testing` - Testing
- `10-deployment` - Deployment

## Actions

1. **Prerequisite Validation**
   - Check previous stage completion
   - Check previous stage HANDOFF.md exists
   - Check required input files exist

2. **Load Stage Configuration**
   - Load `stages/[stage-id]/config.yaml`
   - Load `stages/[stage-id]/CLAUDE.md`

3. **Update State**
   - Update current stage in `state/progress.json`
   - Record start time

4. **Execute Stage**
   - Follow stage CLAUDE.md instructions
   - Use prompt templates

## Execution Script

```bash
scripts/run-stage.sh "$ARGUMENTS"
```

## Example

```
/run-stage 02-research

Output:
✓ Prerequisite validation complete
  - 01-brainstorm: complete ✓
  - HANDOFF.md: exists ✓
✓ Stage configuration loaded
✓ Current stage: 02-research

[02-research CLAUDE.md content displayed]
```

## Prerequisite Failure

```
/run-stage 03-planning

Error:
✗ Prerequisite not met
  - 02-research: in progress (not complete)
  - 02-research HANDOFF.md: not found

Please complete the 02-research stage first.
Run /handoff to generate the handoff document.
```

## Cautions
- Stage skipping not allowed (sequential execution)
- Checkpoint-required stages (06, 07) cannot proceed without checkpoint
