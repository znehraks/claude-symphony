# /benchmark - AI Model Benchmarking Command

Compare AI model performance and select the optimal model using the benchmark-analyzer-agent.

## Usage

```bash
/benchmark [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--task` | Task type to benchmark | code_generation |
| `--models` | Models to compare (comma-separated) | claude,codex |
| `--samples` | Number of sample tasks | 3 |
| `--verbose` | Show detailed analysis and trends | false |
| `--legacy` | Use legacy bash script (fallback) | false |

## How It Works

1. **Spawn benchmark-analyzer-agent** - Agent runs in isolated context
2. **Generate Sample Tasks** - Create representative sample tasks for the benchmark type
3. **Execute Benchmarks** - Run each model on samples, measure metrics
4. **Calculate Scores** - Weighted scoring (correctness 40%, performance 20%, style 20%, readability 20%)
5. **Analyze Trends** - Compare with 7-day historical data
6. **Generate Recommendation** - Recommend best model with confidence level

## Benchmark Task Types

### code_generation
```bash
/benchmark --task code_generation --models "claude,codex"
```
- Metrics: correctness, performance, style_compliance, readability

### refactoring
```bash
/benchmark --task refactoring --models "codex,claude"
```
- Metrics: complexity_reduction, test_coverage, maintainability

### test_generation
```bash
/benchmark --task test_generation --models "codex,claude"
```
- Metrics: coverage, edge_cases, quality

## Output Format

```markdown
# AI Benchmark Results

## Task: code_generation
## Models: claude, codex

### Score Summary
| Model | Score | Rank |
|-------|-------|------|
| Claude | 0.88 | 1 |
| Codex | 0.82 | 2 |

### Metric Breakdown
| Metric | Weight | Claude | Codex |
|--------|--------|--------|-------|
| Correctness | 0.4 | 0.95 | 0.85 |
| Performance | 0.2 | 0.80 | 0.90 |
| Style | 0.2 | 0.90 | 0.80 |
| Readability | 0.2 | 0.85 | 0.75 |

### Recommendation
**Claude** recommended for this task
```

## Examples

```bash
# Code generation benchmark
/benchmark --task code_generation

# Detailed results output
/benchmark --task refactoring --verbose

# Compare specific models only
/benchmark --task test_generation --models "codex"
```

## Result Storage

- Results: `state/ai_benchmarks/`
- Reports: `state/ai_benchmarks/reports/`

## View History

```bash
# Check latest benchmark results
cat state/ai_benchmarks/latest.json

# Check weekly trends
scripts/ai-benchmark.sh --history weekly
```

## Configuration

See `config/ai_benchmarking.yaml`

## Agent Model Selection

When spawning **benchmark-analyzer-agent**:
1. Read `.claude/agents/benchmark-analyzer-agent/agent.json`
2. Pass the `model` field value to the Task tool's `model` parameter
3. If `"inherit"` or absent, omit the `model` parameter

## Related Commands

- `/collaborate` - AI collaboration
- `/gemini` - Direct Gemini call
- `/codex` - Direct Codex call
