# /arch-review

Validate architecture documents and detect circular dependencies using the architecture-review-agent.

## Usage
```
/arch-review [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed validation results |
| `--fix` | Generate auto-fix suggestions |
| `--stage <id>` | Review specific stage (default: 03-planning) |

## How It Works

1. **Spawn architecture-review-agent** - Agent runs in isolated context
2. **Document Validation** - Check architecture.md and implementation.yaml
3. **Dependency Analysis** - Build graph and detect circular dependencies
4. **Cross-Document Check** - Verify consistency between documents
5. **Generate Report** - Save to `state/validations/`

## Validation Items

### architecture.md
- Required sections: Overview, Components, Data Flow, Tech Stack
- Diagram presence
- Component descriptions

### implementation.yaml
- Required keys: tasks, milestones, dependencies
- Valid task structure
- Dependency graph validity

### Cross-Document
- Component names match between documents
- Milestones align with task groupings
- Dependency references are valid

## Example

```
/arch-review

Validating architecture.md...
✓ All required sections present
✓ Component diagram included
✓ 8 components defined

Validating implementation.yaml...
✓ 24 tasks defined
✓ 5 milestones defined
⚠ 2 dependency issues detected

Dependency analysis:
✓ No circular dependencies
⚠ Task-015 depends on Task-999 (not found)

Cross-document check:
✓ All components referenced in implementation
✓ Milestones aligned

Score: 0.88 ⚠️ (Issues need fixing)

Report: state/validations/03-planning_architecture_20260128_143000.json
```

## Integration

Automatically runs at Stage 03 completion.

## Impact

Prevents 50-100% of Stage 06 rework by catching issues early.

## Agent Model Selection

When spawning **architecture-review-agent**:
1. Read `.claude/agents/architecture-review-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Fallback

If agent fails, performs basic file existence check only.
