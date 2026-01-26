# AI Collaboration Skill

Multi-AI Collaboration and Orchestration Skill

## Overview

Collaborate multiple AI models (Claude, Gemini, Codex) to generate better results:
- Gain diverse perspectives through parallel execution
- Gradual improvement through sequential handoff
- Derive optimal conclusions through debate mode

## Trigger

- `/collaborate` command
- Auto-suggested when complex task detected
- When low confidence detected

## Collaboration Modes

### 1. Parallel Execution
Multiple AIs perform the same task simultaneously → Select optimal result

```bash
/collaborate --mode parallel --task "idea generation" --models "gemini,claude"
```

### 2. Sequential Handoff
AI relay to gradually improve results

```bash
/collaborate --mode sequential --chain "code_review"
```

### 3. Debate Mode
AI debate to derive optimal conclusions from various perspectives

```bash
/collaborate --mode debate --topic "architecture selection" --rounds 3
```

## File Structure

```
ai-collaboration/
├── README.md          # This file
├── parallel.md        # Parallel execution guide
├── debate.md          # Debate mode guide
└── prompts/
    └── CLAUDE.md      # AI instructions
```

## Configuration

See `config/ai_collaboration.yaml`

## Output

- Each AI's result
- Comparative analysis report
- Final selection/merge result
- Saved to `state/collaborations/`
