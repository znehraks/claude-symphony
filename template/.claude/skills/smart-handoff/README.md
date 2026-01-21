# Smart HANDOFF Skill

Smart context extraction and intelligent HANDOFF generation skill

## Overview

This skill automates and optimizes the HANDOFF.md generation process:
- Automatic context extraction
- Semantic-based compression
- Stage-specific summarization
- Memory system integration

## Trigger

- Auto-activates on stage completion
- `/handoff --smart` command
- When context threshold reached

## Features

### 1. Auto Context Extraction (extract.md)
- Collect completed tasks
- Extract key decisions
- List modified files
- Identify pending issues
- Organize AI call history

### 2. Context Summarization (summarize.md)
- Completed work → Compress to key achievements
- File changes → Impact analysis
- Decisions → Include rationale and alternatives
- Next steps → Immediately actionable format

### 3. Memory Integration
- Save key info to claude-mem
- Load previous session context
- Support cross-stage learning

## Configuration

See `config/handoff_intelligence.yaml`

## Usage Examples

```bash
# Smart HANDOFF generation
/handoff --smart

# Compact HANDOFF generation
/handoff --smart --compact

# Detailed recovery HANDOFF generation
/handoff --smart --recovery
```

## Output

- `stages/{current_stage}/HANDOFF.md`
- Memory save (when claude-mem connected)
