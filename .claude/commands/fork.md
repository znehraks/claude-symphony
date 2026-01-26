# /fork - Pipeline Forking Command

Fork the pipeline to explore multiple approaches simultaneously.

## Usage

```bash
/fork [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--reason` | Fork reason (required) | - |
| `--name` | Fork name | auto |
| `--direction` | Exploration direction description | - |
| `--compare` | Compare with existing forks | false |
| `--merge` | Merge fork | false |
| `--list` | List active forks | false |

## Basic Usage

### Create New Fork
```bash
/fork --reason "architecture alternative exploration"
```

### Check Fork List
```bash
/fork --list
```

### Compare Forks
```bash
/fork --compare
```

### Merge Fork
```bash
/fork --merge --select "fork_03_alternative_a"
```

## Fork Process

```
1. Create checkpoint of current state
2. Create fork directory (state/forks/)
3. Copy state
4. Generate fork HANDOFF
5. Start fork work
```

## Fork Comparison Output

```markdown
# Fork Comparison

## Active Forks
| ID | Name | Stage | Progress | Created |
|----|------|-------|----------|---------|
| 1 | alternative_a | 06 | 60% | 2024-01-20 |
| 2 | alternative_b | 06 | 45% | 2024-01-20 |
| 3 | main | 06 | 100% | - |

## Metrics Comparison
| Metric | Main | Alt A | Alt B |
|--------|------|-------|-------|
| Code Quality | 0.85 | 0.90 | 0.82 |
| Performance | 0.80 | 0.75 | 0.88 |
| Maintainability | 0.88 | 0.85 | 0.80 |

## Recommendation
**Alt A** recommended: Higher code quality
```

## Merge Strategies

### best_performer
```bash
/fork --merge --strategy best_performer
```
- Select best performing fork based on metrics

### manual
```bash
/fork --merge --strategy manual --select "fork_01"
```
- Manual selection

### cherry_pick
```bash
/fork --merge --strategy cherry_pick
```
- Select optimal parts from multiple forks

## Examples

```bash
# Fork for architecture alternative exploration
/fork --reason "REST vs GraphQL comparison" --direction "GraphQL implementation"

# Check current fork status
/fork --list

# Compare forks and check metrics
/fork --compare

# Merge best performing fork
/fork --merge --strategy best_performer
```

## Fork Storage Location

```
state/forks/
├── fork_03_rest_20240120/
│   ├── source_code/
│   ├── state/
│   └── FORK_HANDOFF.md
├── fork_03_graphql_20240120/
│   ├── source_code/
│   ├── state/
│   └── FORK_HANDOFF.md
└── comparison.json
```

## Configuration

See `config/pipeline_forking.yaml`

## Limitations

- Max active forks: 3
- Max fork execution time: 2 hours
- Checkpoint auto-created before merge

## Related Commands

- `/checkpoint` - Create checkpoint
- `/restore` - Restore checkpoint
- `/status` - Pipeline status
