# /next

Complete the current stage and transition to the next stage.

## Usage
```
/next
/next --force    # Skip condition verification
/next --preview  # Preview transition
```

## Actions

1. **Verify Current Stage Completion Criteria**
   - Check outputs files exist
   - Check required checkpoints (if applicable)
   - Verify completion_criteria in config.yaml

2. **Auto-Generate HANDOFF.md**
   - Completed work summary
   - Key decisions
   - Next step guidance

3. **Update State**
   - Current stage: `completed`
   - Next stage: `in_progress`
   - Update progress.json

4. **Start Next Stage**
   - Load next stage CLAUDE.md
   - Check input files

## Execution Script

```bash
scripts/next-stage.sh "$ARGUMENTS"
```

## Output Examples

### Successful Transition
```
/next

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Stage Transition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current: 04-ui-ux → Next: 05-task-management

[Completion Criteria Verification]
✓ wireframes/ directory exists
✓ component-spec.md generated
✓ design-system.md generated

[HANDOFF.md Generation]
✓ stages/04-ui-ux/HANDOFF.md created

[State Update]
✓ 04-ui-ux: completed
✓ 05-task-management: in_progress
✓ progress.json updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 05-task-management stage started!

Next tasks:
1. Reference stages/05-task-management/CLAUDE.md
2. Start task breakdown based on PRD.md
3. Can start directly with /tasks command

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Criteria Not Met
```
/next

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Stage Transition Not Possible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current: 06-implementation

[Completion Criteria Verification]
✓ src/ directory exists
✓ Implementation files generated
✗ Checkpoint required (not created)
✗ tests/ pass confirmation needed

Next steps:
1. Run /checkpoint
2. Run tests and verify results
3. Force transition with /next --force (not recommended)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Options

| Option | Description |
|--------|-------------|
| `--force` | Skip completion criteria verification (not recommended) |
| `--preview` | Preview only (no actual transition) |
| `--no-handoff` | Skip HANDOFF.md generation |

## Completion Criteria (By Stage)

| Stage | Required Outputs | Checkpoint |
|-------|------------------|------------|
| 01-brainstorm | ideas.md, decisions.md | - |
| 02-research | research.md, tech-stack.md | - |
| 03-planning | PRD.md, architecture.md | - |
| 04-ui-ux | wireframes/, components.md | - |
| 05-task-mgmt | tasks.json, sprints.md | - |
| 06-implementation | src/, tests/ | ✅ Required |
| 07-refactoring | (modified src/) | ✅ Required |
| 08-qa | qa-report.md | - |
| 09-testing | test-results.md | - |
| 10-deployment | CI/CD complete | - |

## Related Commands

- `/status` - Check current status
- `/handoff` - Generate HANDOFF.md only
- `/checkpoint` - Create checkpoint
- `/run-stage [id]` - Move to specific stage
