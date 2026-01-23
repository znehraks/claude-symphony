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

### 6. Extract Epic Cycle Information (Conditional)

Only extract if `progress.json` has `epic_cycle.enabled: true`

```bash
# Get from progress.json
jq '.epic_cycle' state/progress.json
```

```markdown
## Epic Cycle Information
| Property | Value |
|----------|-------|
| Current Cycle | {{current}} / {{total}} |
| Scope | {{start_stage}} → {{end_stage}} |
| Completed | {{completed_cycles}} |

### Previous Cycle Learnings
{{learnings from epic_history}}
```

### 7. Extract Implementation Order (Conditional)

Only extract if `progress.json` has `implementation_order.selected` not null

```bash
# Get from progress.json
jq '.implementation_order' state/progress.json
```

```markdown
## Implementation Order
| Property | Value |
|----------|-------|
| Selected Order | {{selected}} |
| Current Phase | {{current_phase}} |
| Phase Name | {{phase_name}} |

### Reference Links
{{from config/implementation_order.yaml}}
```

### 8. Extract Moodboard Analysis (Conditional)

Only extract if `progress.json` has `moodboard.active: true`

```bash
# Get from progress.json
jq '.moodboard' state/progress.json
```

Detection patterns:
- Style selection: "modern", "bold", "professional", "playful"
- Analysis status: "initial", "feedback_received", "finalized"

```markdown
## Moodboard Analysis
| Property | Value |
|----------|-------|
| Style | {{design_style}} |
| Analysis Status | {{status}} |
| Feedback Iterations | {{iterations}} |

### Categories Collected
{{category_list with counts}}

### Design Token Status
{{tokens_generated: true/false}}
```

### 9. Extract Requirements Refinement (Conditional)

Only extract if `progress.json` has `requirements_refinement.active: true`

```bash
# Get from progress.json
jq '.requirements_refinement' state/progress.json
jq '.refinement_history' state/progress.json
```

Detection patterns:
- Refinement actions: "broke down", "refined", "split into"
- Levels: "epic", "feature", "task", "subtask"

```markdown
## Requirements Refinement
| Property | Value |
|----------|-------|
| Iteration | {{current_iteration}} |
| Refined | {{refined_count}} requirements |
| Validation | {{validation_status}} |

### Hierarchy Summary
| Level | Count |
|-------|-------|
| Epics | {{epic_count}} |
| Features | {{feature_count}} |
| Tasks | {{task_count}} |
| Subtasks | {{subtask_count}} |

### Pending Refinement
{{list of requirements still needing breakdown}}
```

## Extraction Priority

1. **Critical (100)**: Blocking issues
2. **Key Decisions (90)**: Core decisions
3. **Pending Issues (80)**: Pending issues
4. **Epic Cycle (75)**: Epic iteration state
5. **Refinement (72)**: Requirements refinement state
6. **Impl Order (70)**: Implementation order
7. **File Changes (65)**: File changes
8. **Moodboard (62)**: Moodboard analysis
9. **Completed Tasks (60)**: Completed tasks
10. **AI History (50)**: AI call history

## Conditional Extraction Rules

| Feature | Condition | Source |
|---------|-----------|--------|
| Epic Cycle | `epic_cycle.enabled == true` | `progress.json`, `config/epic_cycles.yaml` |
| Impl Order | `implementation_order.selected != null` | `progress.json`, `config/implementation_order.yaml` |
| Moodboard | `moodboard.active == true` | `progress.json`, `config/ui-ux.yaml` |
| Refinement | `requirements_refinement.active == true` | `progress.json`, `state/refinement_log.json` |

## Implementation

Script: `scripts/smart-handoff.sh`
Config: `config/handoff_intelligence.yaml`

### Feature-Specific Scripts
- Epic Cycles: `scripts/epic-cycle.sh`
- Moodboard: `scripts/moodboard-manager.sh`
- Refinement: `scripts/requirements-refine.sh`
