# /benchmark - AI Model Benchmarking Command

Compare AI model performance and select the optimal model.

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
| `--metrics` | Metrics to measure | correctness,performance |
| `--verbose` | Verbose output | false |

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

## Related Commands

- `/collaborate` - AI collaboration
- `/gemini` - Direct Gemini call
- `/codex` - Direct Codex call
