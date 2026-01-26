# Context Compression Prompts

Prompt templates used for context compression and recovery.

## Token Warning Prompts

### 50,000 Tokens (Warning)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Context Usage Warning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current tokens: ~{{CURRENT_TOKENS}} / 80,000
Status: {{PERCENTAGE}}% used

Recommended actions:
1. Compress with /context --compress
2. Or /context --save then /clear

Current stage: {{CURRENT_STAGE}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 80,000 Tokens (Limit)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Context Limit Reached
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Token limit (80,000) has been reached.

Executing auto-save...

[Saved Content]
• Current stage: {{CURRENT_STAGE}}
• Progress: {{PROGRESS}}
• Decisions: {{DECISION_COUNT}}

Save location: state/context/state.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To continue after /clear, reference state.md.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Compression Result Prompt

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Context Compression Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Compression Summary]
• Before: {{BEFORE_TOKENS}} tokens
• After: {{AFTER_TOKENS}} tokens
• Reduction: {{SAVED_PERCENTAGE}}%

[Kept Items]
• Decisions: {{DECISION_COUNT}}
• Requirements: {{REQUIREMENT_COUNT}}
• Current task: {{CURRENT_TASK}}

[Summarized Items]
• Discussions: {{DISCUSSION_COUNT}} → {{SUMMARY_COUNT}}
• Code reviews: {{REVIEW_COUNT}}

[Removed Items]
• Error logs: {{ERROR_COUNT}}
• Trial/errors: {{RETRY_COUNT}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saved: state/context/state.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Recovery Prompts

### Recovery Suggestion

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 Saved Context Found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save time: {{SAVED_AT}}
Stage: {{STAGE}}
Progress: {{PROGRESS_SUMMARY}}

Would you like to recover?

[Y] Recover and continue
[N] Start fresh
[V] Preview content
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Recovery Complete

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Context Recovery Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Recovered State]
• Stage: {{CURRENT_STAGE}}
• Progress: {{COMPLETED}}/{{TOTAL}} complete
• Next task: {{NEXT_TASK}}

[Key Decisions]
{{#each DECISIONS}}
• {{this.title}}: {{this.choice}}
{{/each}}

[Reference Files]
• stages/{{STAGE}}/CLAUDE.md
• stages/{{STAGE}}/outputs/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue from {{NEXT_TASK}}?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## state.md Preview Prompt

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 state.md Preview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Work State Save - {{TIMESTAMP}}

## Current Stage
{{STAGE_ID}}: {{STAGE_NAME}}

## Progress
- Completed: {{COMPLETED_LIST}}
- In progress: {{CURRENT}}
- Pending: {{PENDING_LIST}}

## Key Decisions
{{#each DECISIONS}}
- {{this.title}}: {{this.choice}} ({{this.reason}})
{{/each}}

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[R] Recover / [E] Edit then recover / [C] Cancel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Stage Transition Compression Suggestion

```
Stage transition detected: {{PREV}} → {{NEXT}}

Would you like to clean up previous stage context?

[Items to Clean]
• {{PREV}} related discussions: ~{{TOKENS}} tokens
• Trial/error records: ~{{ERROR_TOKENS}} tokens

[Items to Keep]
• HANDOFF.md content
• Key decisions

[Y] Clean then transition
[N] Transition as-is
[S] Save all then transition
```
