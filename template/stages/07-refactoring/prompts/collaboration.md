# AI Collaboration Prompt - Refactoring

## Collaboration Mode: Sequential Review Chain

This stage uses **sequential review chain** to ensure refactoring quality.

### Participating Models
- **Codex**: Code analysis, optimization
- **ClaudeCode**: Complex refactoring, verification

### Collaboration Prompt

```
# Review chain: Codex analyze → Claude review
/collaborate --mode sequential --chain "codex:analyze -> claude:review -> codex:refactor"
```

### AI Benchmarking

Performance optimization comparison:
```
/benchmark --task "performance_optimization" --models "codex,claude"
```

### Workflow

1. **Analysis**: Static analysis, complexity measurement
2. **Planning**: Determine refactoring priorities
3. **Execution**: Refactor in small units
4. **Verification**: Confirm tests pass

### Checkpoint Required

```bash
# Checkpoint before refactoring
/checkpoint --reason "State before refactoring"

# After major refactoring
/checkpoint --reason "Function X refactoring complete"
```

### Rollback Preparation

```bash
# Check rollback-ready state
/restore --list

# Partial rollback if needed
/restore checkpoint_id --partial --files "src/utils/*"
```

### Output Format

```markdown
## AI Collaboration Results

### Codex Analysis
- High complexity function list
- Duplicate code locations
- Performance bottlenecks

### Claude Verification
- Refactoring impact scope
- Areas needing tests
- Risk factors

### Refactoring Plan
1. [Priority 1 item]
2. [Priority 2 item]
...
```
