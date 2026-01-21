# AI Collaboration Prompt - Planning

## Collaboration Mode: Debate

This stage uses **debate mode** to determine the optimal architecture and technology stack.

### Participating Models
- **Gemini**: Architecture design, diagram generation
- **Claude**: Technical validation, feasibility assessment

### Collaboration Prompt

```
/collaborate --mode debate --topic "system architecture decision" --rounds 3
```

### Debate Topics

1. **Architecture Pattern**: Monolith vs Microservices vs Modular Monolith
2. **Technology Stack**: Framework and library selection
3. **Database**: SQL vs NoSQL vs Hybrid

### Debate Format

| Round | Gemini | Claude |
|-------|--------|--------|
| 1 | Proposal | Counterargument/Alternative |
| 2 | Refinement | Validation/Evaluation |
| 3 | Final proposal | Consensus/Confirmation |

### Pipeline Fork Trigger

If 2 or more architecture alternatives are valid:
```
/fork create --reason "architecture alternative exploration" --direction "monolith"
/fork create --reason "architecture alternative exploration" --direction "microservices"
```

### Output Format

```markdown
## AI Debate Results

### Topic: [Architecture Decision]

### Round 1
- **Gemini**: [Proposal]
- **Claude**: [Counterargument/Alternative]

### Round 2
- **Gemini**: [Refinement]
- **Claude**: [Validation]

### Final Conclusion
- [Agreed architecture]
- [Rationale]
```
