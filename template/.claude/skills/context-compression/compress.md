# Context Compression Logic

Compress context based on analysis results.

## Compression Process

### 1. Extract Content to Keep

```markdown
# Keep Items

## Decisions
- [Decision 1]: [Content] - [Reason]
- [Decision 2]: [Content] - [Reason]

## Requirements
- [Requirements list]

## Architecture
- [Major architecture choices]

## Current Work State
- Stage: [Current stage]
- Progress: [Completed/In progress/Pending]
- Next: [Next task]
```

### 2. Process Content to Summarize

#### Discussion Summary Strategy

```
Original:
User: Should we go with React or Vue?
AI: React's advantages are... Vue's advantages are... Comparing them...
User: The team has more React experience
AI: Then React would be better. The reason is...
User: Let's go with React

Compressed:
Tech stack discussion → React selected (based on team experience)
```

#### Code Review Summary

```
Original:
[Long code diff]
AI: This part needs optimization... [Detailed explanation]
[Modified code]

Compressed:
Code review complete: [filename] optimization applied
- Change: [Core changes]
```

### 3. Content to Remove

Items completely removed:

- Full error messages (keep only solutions)
- Failed attempt processes
- Temporary debugging output
- Duplicate code displays

### 4. Generate state.md

```markdown
# Work State Save - {{TIMESTAMP}}

## Current Stage
{{STAGE_ID}}: {{STAGE_NAME}}

## Progress
- Completed: {{COMPLETED_ITEMS}}
- In progress: {{CURRENT_ITEM}}
- Pending: {{PENDING_ITEMS}}

## Key Decisions

### Tech Stack
- Frontend: React + TypeScript
- Styling: Tailwind CSS
- State management: Zustand

### Architecture
- Component-based structure
- Feature-based folder organization

## Main Context

### Requirements Summary
[3-5 core requirements]

### Discussion Results Summary
[Key discussion results]

## Recovery Instructions
1. Read this file
2. Reference stages/{{STAGE_ID}}/CLAUDE.md
3. Resume from {{CURRENT_TASK}}

## Reference Files
- progress.json
- stages/{{STAGE_ID}}/outputs/
- Latest HANDOFF.md
```

## Compression Execution

### Auto Compression (at 80k)

```
⚠️ Token limit reached (80,000)

Executing auto compression...

[Saving]
✓ Decisions extracted
✓ Current state saved
✓ state.md generated

Save complete: state/context/state.md

To recover after /clear:
1. Read state/context/state.md
2. Resume work
```

### Manual Compression

```
/context --compress

[Analysis]
...

[Compression Execution]
✓ Keep items extracted: 10,000 tokens
✓ Summaries generated: 5,000 tokens
✓ Unnecessary items removed: 50,000 tokens

[Result]
- Before compression: 65,000 tokens
- After compression: 15,000 tokens

Saved to state/context/state.md
```

## Recovery Process

### Recovery After /clear

```
New session.

Would you like to recover previous context?
Saved state: state/context/state.md

[Y] Recover / [N] Start fresh
```

### Load on Recovery

```
Recovering context...

[Loaded Information]
- Stage: 06-implementation
- Progress: Sprint 1 (3/5 tasks completed)
- Decisions: 5
- Next task: T004 User authentication implementation

Recovery complete. Continue working?
```
