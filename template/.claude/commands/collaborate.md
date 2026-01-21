# /collaborate - Multi-AI Collaboration Command

Collaborate multiple AI models to generate better results.

## Usage

```bash
/collaborate [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--mode` | Collaboration mode (parallel, sequential, debate) | parallel |
| `--task` | Task description to perform | - |
| `--models` | Participating AI models (comma-separated) | gemini,claude |
| `--chain` | Sequential chain name (sequential mode) | - |
| `--rounds` | Debate rounds (debate mode) | 3 |
| `--topic` | Debate topic (debate mode) | - |

## Collaboration Modes

### 1. Parallel (Parallel Execution)
```bash
/collaborate --mode parallel --task "idea generation" --models "gemini,claude"
```
- Multiple AIs perform same task simultaneously
- Compare results and select best

### 2. Sequential (Sequential Handoff)
```bash
/collaborate --mode sequential --chain "code_review"
```
- Relay between AIs for progressive improvement
- Chains: `code_review`, `planning_review`

### 3. Debate (Discussion)
```bash
/collaborate --mode debate --topic "architecture choice" --rounds 3
```
- AI debate to reach optimal conclusion
- Compare various perspectives

## Predefined Chains

### code_review
1. Claude: Draft creation
2. Gemini: Creative improvement
3. Codex: Technical verification

### planning_review
1. Gemini: Idea divergence
2. Claude: Feasibility analysis
3. Claude: Final plan establishment

## Output

- Each AI's results
- Comparative analysis report
- Final selection/merge result
- Storage: `state/collaborations/{task_id}/`

## Examples

```bash
# Basic parallel collaboration
/collaborate --task "user authentication design"

# Code review chain
/collaborate --mode sequential --chain code_review

# Architecture debate
/collaborate --mode debate --topic "microservices vs monolithic"
```

## Configuration

See `config/ai_collaboration.yaml`

## Related Commands

- `/benchmark` - AI model benchmarking
- `/gemini` - Direct Gemini call
- `/codex` - Direct Codex call
