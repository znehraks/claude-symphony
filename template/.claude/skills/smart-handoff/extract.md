# Smart HANDOFF - Context Extraction

## Auto Context Extraction Process

### 1. Collect Completed Tasks

```markdown
## Extraction Target
- TodoWrite completed items
- Committed changes
- Generated outputs

## Format
- [ ] Completed task (timestamp)
```

### 2. Extract Key Decisions

Detect following patterns from conversation:
- "decided", "selected", "adopted"
- "use B instead of A", "because..."
- Architecture/tech stack selection

```markdown
## Decision Format
**Decision**: [Decision content]
**Reason**: [Selection reason]
**Alternatives**: [Considered alternatives]
```

### 3. List Modified Files

```bash
# Extract changed files via Git
git diff --name-only HEAD~10
```

```markdown
## File Format
| File | Change Type | Key Changes |
|------|-------------|-------------|
```

### 4. Identify Pending Issues

Detection patterns:
- "TODO:", "FIXME:", "HACK:"
- "later", "next time", "afterwards"
- Unresolved errors/warnings

```markdown
## Issue Format
- [ ] Issue description (Priority: High/Medium/Low)
```

### 5. Organize AI Call History

```markdown
## AI Call History
| AI | Time | Purpose | Result Summary |
|----|------|---------|----------------|
```

## Extraction Priority

1. **Critical (100)**: Blocking issues
2. **Key Decisions (90)**: Core decisions
3. **Pending Issues (80)**: Pending issues
4. **File Changes (70)**: File changes
5. **Completed Tasks (60)**: Completed tasks
6. **AI History (50)**: AI call history

## Implementation

Script: `scripts/smart-handoff.sh`
Config: `config/handoff_intelligence.yaml`
