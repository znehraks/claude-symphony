# /brainstorm

Start the 01-brainstorm stage directly.

## Usage
```
/brainstorm [topic]
```

## Stage Information

| Item | Value |
|------|-------|
| Stage | 01-brainstorm |
| AI Model | Gemini + ClaudeCode |
| Execution Mode | YOLO (Container) |
| Checkpoint | Optional |

## Actions

1. **Prerequisite Check**
   - Project initialization status (progress.json)

2. **Stage Start**
   - Gemini CLI call (creative ideas)
   - ClaudeCode parallel execution (technical review)

3. **Output Generation**
   - ideas.md - Brainstorming ideas
   - decisions.md - Key decisions

## Execution

```bash
# Same as /run-stage 01
scripts/run-stage.sh 01-brainstorm "$ARGUMENTS"
```

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Stage 01: Brainstorm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: Gemini + ClaudeCode (parallel)
Mode: YOLO (Container)

Topic: $ARGUMENTS

[Gemini] Generating creative ideas...
[ClaudeCode] Technical review in progress...

After completion: /next or /research
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Related Commands

- `/run-stage 01` - Start after prerequisite check
- `/next` - Next stage (02-research)
- `/gemini` - Direct Gemini CLI call

## Tips

- YOLO mode: Failure is okay, creativity first
- Freely explore multiple ideas
- Record final selections in decisions.md
