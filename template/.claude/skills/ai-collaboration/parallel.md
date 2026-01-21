# AI Collaboration - Parallel Execution

## Parallel Execution Mode

Multiple AI models perform the same task simultaneously to select optimal from various results.

## Use Scenarios

1. **Idea Generation**: Collect ideas from various perspectives
2. **Code Implementation**: Compare multiple approaches
3. **Documentation**: Compare styles

## Execution Process

### 1. Task Definition
```yaml
task:
  description: "User authentication system design"
  type: "design"
  constraints:
    - "JWT based"
    - "OAuth support"
```

### 2. Model Selection
```yaml
models:
  - gemini:
      focus: "Creative approach"
  - claude:
      focus: "Practical implementation"
```

### 3. Parallel Execution
```bash
# Simultaneous execution via tmux sessions
scripts/gemini-wrapper.sh "prompts/task.md" &
# Claude runs in current session
```

### 4. Collect Results
Save each AI's output to `state/collaborations/{task_id}/`

### 5. Evaluate and Select
```yaml
evaluation:
  metrics:
    - completeness: 0.3
    - creativity: 0.3
    - feasibility: 0.4
```

## Merge Strategies

### Best-of-N
- Select result with highest score
- Auto-select if above threshold (0.85)

### Synthesis
- Extract only advantages from each result
- Generate new integrated result

## Output Format

```markdown
# Parallel Execution Results

## Task
[Task description]

## Results

### Gemini Result
[Result content]
**Score**: 0.82

### Claude Result
[Result content]
**Score**: 0.88

## Analysis
| Metric | Gemini | Claude |
|--------|--------|--------|
| Completeness | 0.80 | 0.90 |
| Creativity | 0.90 | 0.85 |
| Feasibility | 0.75 | 0.90 |

## Selected: Claude Result
**Reason**: High feasibility and completeness
```

## Resource Management

- Max concurrent execution: 2 models
- Token budget: 50,000 per collaboration
- Timeout: 5 minutes per model
