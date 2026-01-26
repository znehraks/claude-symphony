# /codex

Call OpenAI Codex CLI through tmux session.

## Usage
```
/codex [prompt]
```

## Actions

1. **Check/Create tmux Session**
   - Session name: `ax-codex`
   - Create new if not exists

2. **Execute Codex CLI**
   - Send prompt
   - Wait for response (wait-for method)

3. **Capture and Return Results**
   - Read results from output file
   - Display to user

## Execution Script

```bash
scripts/ai-call.sh codex "$ARGUMENTS"
```

Alternatively, direct wrapper call:
```bash
scripts/codex-wrapper.sh "$ARGUMENTS"
```

## Example

```
/codex Please refactor the following function. Improve readability and performance,
and enhance type safety:

function processData(data) {
  // long function code
}

Calling Codex...
Session: ax-codex
Timeout: 300 seconds

[Response]
Refactored code:

\`\`\`typescript
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): ProcessedResult {
  // cleanly refactored code
}
\`\`\`

Changes:
1. Added TypeScript types
2. Split function into 3 smaller functions
3. Optimized O(n²) → O(n) by removing unnecessary loops
```

## Usage Scenarios

### 1. Code Refactoring (07-refactoring)
```
/codex Please remove duplicates and apply DRY principle to the following code:
[code]
```

### 2. Test Code Generation (09-testing)
```
/codex Please write Jest test code for the following function.
Include edge cases:
[function code]
```

### 3. Performance Optimization
```
/codex Please analyze performance bottlenecks and optimize the following code:
[code]
```

### 4. Code Analysis
```
/codex Please analyze complexity and suggest improvements for the following code:
[code]
```

## Timeout

Default timeout: 300 seconds (5 minutes)

To change:
```
/codex --timeout 600 [long task prompt]
```

## Auto-Fallback

If Codex CLI is not available or fails, the system automatically falls back to ClaudeCode:

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
- Codex CLI must be installed (or fallback will be used)
- tmux must be installed for wrapper execution
- Interactive prompts not supported (single queries only)

## Related
- `/gemini`: Gemini CLI call
- `scripts/codex-wrapper.sh`: Wrapper script
