# Context Analysis Logic

Analyze current context to identify compression targets.

## Analysis Process

### 1. Token Estimation

Classify conversation content by category and estimate tokens:

```
Token estimation formula:
- English: word count × 1.3
- Korean: character count × 0.5
- Code: line count × 10
```

### 2. Category Classification

| Category | Importance | Handling |
|----------|-----------|----------|
| Decisions | High | Keep |
| Requirements | High | Keep |
| Architecture | High | Keep |
| Current work | High | Keep |
| Discussion/Exploration | Medium | Summarize |
| Code review | Medium | Summarize |
| Error logs | Low | Remove |
| Trial and error | Low | Remove |

### 3. Identification Patterns

#### Decisions (Keep)
```
Keywords:
- "decided", "selected", "confirmed"
- "let's go with", "would be good"
- "A instead of B"

Structure:
- Decision content
- Selection reason
- Alternatives (briefly)
```

#### Discussion/Exploration (Summarize)
```
Keywords:
- "let's look at", "review", "analyze"
- "option 1", "option 2"
- "what do you think?"

Compression:
- Keep only main points
- Emphasize final conclusion
- Omit intermediate process
```

#### Error/Trial and Error (Remove)
```
Keywords:
- "error", "failed", "fix"
- "try again"
- "TypeError", "SyntaxError"

Exceptions (Keep):
- Final solution
- Recurring issues
```

### 4. Analysis Result Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Context Analysis Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estimated total tokens: ~65,000

[Distribution by Category]
Decisions      ████░░░░░░░░░░░░   5,000 (keep)
Requirements   ██░░░░░░░░░░░░░░   2,000 (keep)
Current work   ███░░░░░░░░░░░░░   3,000 (keep)
Discussion     ████████████░░░░  40,000 (→ 8,000 summarize)
Error logs     █████░░░░░░░░░░░  15,000 (remove)

[Compression Estimate]
- Before compression: 65,000 tokens
- After compression: 18,000 tokens
- Reduction: 72%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Compress? [Y/n]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Auto Analysis Triggers

Auto analysis runs in these situations:

1. **Token warning threshold reached** (50,000)
2. **Before stage transition**
3. **After long conversation** (20+ messages)

## Analysis Priorities

Priority adjustment by stage:

| Stage | Keep Priority |
|-------|--------------|
| 01-03 | Decisions, Requirements |
| 04-05 | Design content, Tasks |
| 06-07 | Implementation decisions, Code patterns |
| 08-10 | Issues, Solutions |
