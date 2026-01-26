# /research

Start the 02-research stage directly.

## Usage
```
/research [focus-area]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 02-research |
| AI Model | Claude + MCP |
| Execution Mode | Plan Mode |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - 01-brainstorm completion status
   - ideas.md file exists

2. **Execute Research**
   - Use MCP tools (web search, API)
   - Tech stack investigation
   - Competitor analysis

3. **Output Generation**
   - research.md - Research results
   - tech-stack.md - Tech stack recommendations

## Execution

```bash
scripts/run-stage.sh 02-research "$ARGUMENTS"
```

## Input Files

- `stages/01-brainstorm/outputs/ideas.md`
- `stages/01-brainstorm/outputs/decisions.md`

## Output Files

- `stages/02-research/outputs/research.md`
- `stages/02-research/outputs/tech-stack.md`

## Related Commands

- `/run-stage 02` - Start after prerequisite check
- `/next` - Next stage (03-planning)
- `/brainstorm` - Previous stage

## MCP Tool Utilization

- Context7 - Library documentation
- WebFetch - Web page analysis
- WebSearch - Search result collection
