# AI Collaboration Prompt - Implementation

## Collaboration Mode: Sequential Handoff

This stage uses **sequential handoff** mode to run the implement → review → improve cycle.

### Participating Models
- **ClaudeCode**: Code generation, implementation

### Collaboration Prompt

```
# Implement → Self Review → Improve
/collaborate --mode sequential --chain "claudecode:implement -> claudecode:review -> claudecode:improve"
```

### AI Benchmarking (Optional)

For complex algorithm implementation:
```
/benchmark --task "sorting_algorithm" --models "claude,codex"
```

### Workflow

1. **Scaffolding**: Project initialization
2. **Common Components**: Based on design system
3. **Feature Implementation**: Sequential implementation of sprint tasks
4. **Integration**: API/DB integration

### Checkpoint Triggers

- On sprint completion
- On major feature completion
- On 100+ lines changed

```
/checkpoint --reason "Sprint 1 complete"
```

### Follow implementation.yaml

Check before implementation:
```yaml
# Example rules
component_type: functional
styling: tailwind
state_management: zustand
naming: camelCase
```

### Output Format

```markdown
## Implementation Log

### [Date] - [Task]
- Implementation details
- Modified files
- Test results

### Checkpoint
- checkpoint_YYYYMMDD_HHMMSS
```
