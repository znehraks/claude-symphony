# /handoff

Generate the HANDOFF.md document for the current stage.

## Usage
```
/handoff
```

## Actions

1. **Check Current Stage**
   - Query current stage from `state/progress.json`

2. **Verify Completion Criteria**
   - Check completion.checklist in stage config.yaml
   - Verify required output files exist

3. **Generate HANDOFF.md**
   - Generate based on `HANDOFF.md.template`
   - Variable substitution (timestamp, deliverables, etc.)
   - Get user input (key decisions, etc.)

4. **Update State**
   - Mark handoff complete in `state/progress.json`
   - Save copy to `state/handoffs/` directory

5. **Next Stage Guidance**
   - Display next stage information
   - Guide `/run-stage [next]` command

## Execution Script

```bash
scripts/create-handoff.sh
```

## Example

```
/handoff

Current stage: 01-brainstorm

Completion criteria verification:
✓ Minimum 10 ideas generated
✓ 3+ user personas defined
✓ Requirements analysis document completed

Please enter key decisions:
> MVP limited to authentication, core feature A, core feature B

HANDOFF.md generation complete!
- Location: stages/01-brainstorm/HANDOFF.md
- Backup: state/handoffs/01-brainstorm-20240120-1030.md

Next step:
/run-stage 02-research
```

## When Completion Criteria Not Met

```
/handoff

Current stage: 01-brainstorm

Completion criteria verification:
✓ Minimum 10 ideas generated
✗ 3+ user personas defined (current: 2)
✓ Requirements analysis document completed

Please meet the completion criteria.
Or use --force option to force generation:
/handoff --force
```

## Options
- `--force`: Force generation even when completion criteria not met
- `--draft`: Generate as draft (cannot proceed to next stage)
