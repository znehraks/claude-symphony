# HANDOFF.md Auto-Generation

Auto-generates HANDOFF.md on stage completion.

## Generation Logic

### 1. Context Collection

```
Collection items:
- Current stage information
- Generated outputs list
- Decisions extracted from conversation
- Next stage requirements
```

### 2. HANDOFF.md Structure

```markdown
# Handoff: [Current Stage] → [Next Stage]

Generated: {{TIMESTAMP}}

## Completed Work

- [x] Task 1
- [x] Task 2
- [x] Task 3

## Key Decisions

### Decision 1: [Title]
- **Choice**: [Selected option]
- **Reason**: [Selection reason]
- **Impact**: [Impact on next steps]

## Outputs

| File | Description |
|------|-------------|
| file1.md | Description |
| file2.json | Description |

## Failed Approaches

(If applicable)
- Approach 1: [Failure reason]

## Next Steps

### Immediate Actions
1. [Action 1]
2. [Action 2]

### Reference Files
- stages/[current]/outputs/[file]

## Checkpoint

(If applicable)
- ID: CP-XX-YYYYMMDD-HHMM
- Description: [Description]
```

### 3. Decision Extraction

Patterns to extract decisions from conversation:

```
Keywords:
- "decided", "selected", "let's go with", "would be good"
- "A instead of B", "B over A"
- "finally", "confirmed"

Structure:
- Decision title
- Selected option
- Selection reason
- Alternatives (if any)
```

### 4. Auto Output Detection

```bash
# Scan outputs directory
find stages/$CURRENT_STAGE/outputs -type f \
    -name "*.md" -o -name "*.json" -o -name "*.yaml" |
while read file; do
    echo "| $(basename $file) | $(head -1 $file | sed 's/^#\s*//') |"
done
```

## Generation Example

### Input (Conversation Context)

```
User: Chose React over Vue
AI: Wrote component specs based on React.
User: Let's add Tailwind CSS too
AI: Added Tailwind config to design-system.md.
```

### Output (HANDOFF.md)

```markdown
# Handoff: 04-ui-ux → 05-task-management

Generated: 2024-01-20 15:30

## Completed Work

- [x] Wireframe design
- [x] Component spec creation
- [x] Design system definition

## Key Decisions

### Decision 1: Frontend Framework
- **Choice**: React
- **Reason**: Team experience, ecosystem maturity
- **Impact**: Component-based architecture applied

### Decision 2: CSS Framework
- **Choice**: Tailwind CSS
- **Reason**: Fast prototyping, consistent design
- **Impact**: Utility-first styling

## Outputs

| File | Description |
|------|-------------|
| wireframes/home.md | Home screen wireframe |
| component-spec.md | React component specs |
| design-system.md | Tailwind-based design system |

## Next Steps

### Immediate Actions
1. Create component-specific tasks in tasks.json
2. Establish sprint plan

### Reference Files
- stages/04-ui-ux/outputs/component-spec.md
- stages/04-ui-ux/outputs/design-system.md
```

## User Confirmation

Request user confirmation after generation:

```
HANDOFF.md has been generated.

[Preview]
...

Let me know if modifications are needed.
Once confirmed, transition to next stage with /next.
```
