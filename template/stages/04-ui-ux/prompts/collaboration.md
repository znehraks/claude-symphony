# AI Collaboration Prompt - UI/UX Planning

## Collaboration Mode: Debate + Parallel

This stage uses **debate mode** to determine UX direction, then **parallel mode** for detailed design.

### Participating Models
- **Gemini**: Creative UI design, wireframe generation
- **Claude**: Usability review, accessibility assessment

### Collaboration Prompt

```
# UX Direction Debate
/collaborate --mode debate --topic "user experience direction" --rounds 2

# Parallel Design
/collaborate --mode parallel --models gemini,claude --task "UI component design"
```

### Debate Topics

1. **Interaction Patterns**: Traditional vs Innovative
2. **Information Architecture**: Flat vs Hierarchical
3. **Design System**: Existing vs Custom

### Task Distribution

| AI | Responsibility | Output |
|----|----------------|--------|
| Gemini | Wireframes, visual design | wireframes.md |
| Claude | User flows, accessibility review | user_flows.md |

### Design Review Checklist

- [ ] User scenario-based design
- [ ] Responsive considerations
- [ ] Accessibility (WCAG 2.1)
- [ ] Consistent design language

### Output Format

```markdown
## AI Collaboration Results

### Gemini Design
- Wireframes (ASCII/Mermaid)
- Color/typography suggestions

### Claude Review
- Usability assessment
- Accessibility improvements

### Integrated Design System
- [Final component list]
```
