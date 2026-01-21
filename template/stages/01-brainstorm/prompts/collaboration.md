# AI Collaboration Prompt - Brainstorming

## Collaboration Mode: Parallel Execution

This stage uses **parallel execution** mode where multiple AI models generate ideas simultaneously.

### Participating Models
- **Gemini**: Creative idea divergence, web research
- **Claude**: Structuring, feasibility review

### Collaboration Prompt

```
/collaborate --mode parallel --models gemini,claude --task "idea brainstorming"
```

### Merge Strategy

1. **Gemini Results**: Creative ideas, diverse perspectives
2. **Claude Results**: Structured analysis, feasibility assessment
3. **Merge**: Best-of-N selection then integration

### Debate Mode (Optional)

Use debate mode for complex idea evaluation:
```
/collaborate --mode debate --topic "Determine optimal MVP scope" --rounds 2
```

### Output Format

```markdown
## AI Collaboration Results

### Gemini Ideas
- [Idea 1]
- [Idea 2]
...

### Claude Analysis
- [Structured evaluation]
...

### Integrated Results
- [Final idea list]
```
