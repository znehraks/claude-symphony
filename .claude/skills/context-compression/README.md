# Context Compression Skill

A skill for monitoring token usage and compressing context.

## Trigger Conditions

This skill auto-activates under these conditions:

1. **Token threshold reached**
   - 50,000 tokens (warning_threshold): Warning
   - 80,000 tokens (limit_threshold): Compression required

2. **On stage transition**
   - Clean up previous stage context
   - Keep only essential information

3. **Explicit call**
   - `/context --compress` command

## Features

### 1. Context Analysis (analyze.md)
- Estimate current token usage
- Categorize by type
- Identify compressible areas

### 2. Compression Execution (compress.md)
- Importance-based filtering
- Summary generation
- Save to state.md

### 3. Recovery Support (prompts/compression.md)
- Load saved context
- Restore work state

## Skill File Structure

```
context-compression/
├── README.md           # This file
├── analyze.md          # Context analysis logic
├── compress.md         # Compression logic
└── prompts/
    └── compression.md  # Compression prompts
```

## Compression Strategy

### Keep
- ✅ Decisions and rationale
- ✅ Requirements specification
- ✅ Architecture choices
- ✅ Current work state
- ✅ Error solutions (final)

### Summarize
- 📝 Long discussion processes
- 📝 Exploration/investigation processes
- 📝 Multiple alternative comparisons

### Remove
- ❌ Error trial and error processes
- ❌ Repeated attempts
- ❌ Temporary output/logs
- ❌ Already applied code diffs

## Usage Examples

### Auto Warning

```
⚠️ Token Usage Warning

Current: ~52,000 tokens (exceeded 50,000)

Recommended actions:
1. Run /context --compress
2. Or /clear then recover state.md

Continuing will auto-save at 80,000.
```

### Manual Compression

```
/context --compress

Compressing context...

[Analysis]
- Total tokens: ~65,000
- Decisions: ~5,000 (keep)
- Discussions: ~40,000 (summarize → 8,000)
- Error logs: ~20,000 (remove)

[Result]
- After compression: ~13,000 tokens
- Reduction: 80%

Saved to state/context/state.md
```

## Related Commands

- `/context` - Check context state
- `/context --compress` - Execute compression
- `/context --save` - Save snapshot

## Configuration

Adjust thresholds in settings.json:

```json
{
  "context": {
    "warning_threshold": 50000,
    "limit_threshold": 80000,
    "auto_save": true
  }
}
```

## Claude Code Built-in vs Custom Tools

### Built-in Summarization (`/compact`)
Claude Code has built-in context summarization that:
- Automatically condenses conversation history
- Preserves key decisions and context
- Runs without external tools

**When to use:** Quick compression when context is getting large

### Custom Pipeline (`context-manager.sh`)
This project provides additional tooling:
- Token estimation based on file content
- Auto-snapshot generation
- Stage-aware context tracking
- Recovery file generation

**When to use:** Full state management with recovery capability

### claude-hud Plugin Integration

For real-time context monitoring, install the claude-hud plugin:

```bash
/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud
```

**Benefits with claude-hud:**
- Visual context usage in statusline
- Proactive warnings before thresholds
- No manual `/context` checks needed

**Combined workflow:**
1. claude-hud monitors context visually
2. When warning appears, run `./scripts/context-manager.sh --auto-compact warning`
3. Script saves snapshot then triggers `/compact`
4. Recovery possible from saved snapshots
