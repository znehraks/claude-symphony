# /gemini

Call Gemini CLI through tmux session.

## Usage
```
/gemini [prompt]
```

## Actions

1. **Check/Create tmux Session**
   - Session name: `ax-gemini`
   - Create new if not exists

2. **Execute Gemini CLI**
   - Send prompt
   - Wait for response (wait-for method)

3. **Capture and Return Results**
   - Read results from output file
   - Display to user

## Execution Script

```bash
scripts/ai-call.sh gemini "$ARGUMENTS"
```

Alternatively, direct wrapper call:
```bash
scripts/gemini-wrapper.sh "$ARGUMENTS"
```

## Example

```
/gemini Please summarize recent posts about Claude Code from Reddit r/programming

Calling Gemini...
Session: ax-gemini
Timeout: 300 seconds

[Response]
Recent posts about Claude Code from Reddit r/programming:

1. "My experience refactoring an entire project with Claude Code" (3 days ago)
   - Cleanly split functions over 200 lines
   - Test coverage improved from 30% to 85%
   - Pros: Context understanding, Cons: Large file processing speed

2. ...
```

## Usage Scenarios

### 1. Brainstorming (01-brainstorm)
```
/gemini Please brainstorm 10 creative ideas for the following project:
[project description]
```

### 2. Web Research (02-research)
```
/gemini Please search the web for latest React Server Components best practices
```

### 3. Competitor Analysis
```
/gemini Please analyze the features and UI of [competitor URL]
```

## Timeout

Default timeout: 300 seconds (5 minutes)

To change:
```
/gemini --timeout 600 [long task prompt]
```

## Auto-Fallback

If Gemini CLI is not available or fails, the system automatically falls back to ClaudeCode:

| Exit Code | Reason | Action |
|-----------|--------|--------|
| 100 | CLI not installed | Auto-fallback to ClaudeCode |
| 101 | API timeout | Auto-fallback to ClaudeCode |
| 102 | API error | Auto-fallback to ClaudeCode |
| 103 | Output capture failed | Auto-fallback to ClaudeCode |

When fallback occurs, you will see:
```
ACTION_REQUIRED: CLAUDECODE_FALLBACK
```

ClaudeCode will then execute the same prompt directly.

## Limitations
- Gemini CLI must be installed (or fallback will be used)
- tmux must be installed for wrapper execution
- Interactive prompts not supported (single queries only)

## Related
- `/codex`: Codex CLI call
- `scripts/gemini-wrapper.sh`: Wrapper script
