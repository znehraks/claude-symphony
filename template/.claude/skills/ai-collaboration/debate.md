# AI Collaboration - Debate Mode

## Debate Mode

Multiple AI models debate from various perspectives to derive optimal conclusions.

## Use Scenarios

1. **Architecture Decisions**: Compare multiple design alternatives
2. **Technology Selection**: Framework/library selection
3. **Trade-off Analysis**: Performance vs maintainability, etc.

## Debate Structure

### Participant Roles

```yaml
participants:
  advocate:
    model: "claude"
    perspective: "Technical feasibility"
    stance: "Stable and proven approach"

  challenger:
    model: "gemini"
    perspective: "Innovative approach"
    stance: "New technologies and methodologies"
```

### Debate Rounds

```
Round 1: Present initial positions
  - Advocate: [Position + Evidence]
  - Challenger: [Counter position + Evidence]

Round 2: Rebuttals and supplements
  - Advocate: [Rebuttal + Additional evidence]
  - Challenger: [Rebuttal + Additional evidence]

Round 3: Convergence and conclusion
  - Extract common points
  - Summarize agreements
  - Final recommendations
```

## Debate Rules

```yaml
rules:
  rounds: 3
  max_tokens_per_turn: 2000
  require_evidence: true
  convergence_check: true
```

### Evidence Requirements
- Claims must include supporting evidence
- Include numbers/data when possible
- Case citations recommended

## Execution Method

### 1. Set Debate Topic
```bash
/collaborate --mode debate --topic "monolithic vs microservices"
```

### 2. Assign Perspectives
```yaml
debate_setup:
  topic: "monolithic vs microservices"
  advocate:
    model: "claude"
    position: "Monolithic (initial phase)"
  challenger:
    model: "gemini"
    position: "Microservices (scalability)"
```

### 3. Conduct Debate
Collect responses sequentially per round

### 4. Derive Conclusion
```yaml
conclusion:
  method: "consensus"  # or "vote", "weighted"
  include_dissenting: true
```

## Output Format

```markdown
# Debate Results

## Topic
[Debate topic]

## Round 1: Initial Positions

### Advocate (Claude)
**Position**: [Position]
**Arguments**:
1. [Evidence 1]
2. [Evidence 2]

### Challenger (Gemini)
**Position**: [Position]
**Arguments**:
1. [Evidence 1]
2. [Evidence 2]

## Round 2: Rebuttals
[Rebuttal content]

## Round 3: Convergence
[Convergence process]

## Conclusion

### Consensus Points
- [Consensus 1]
- [Consensus 2]

### Remaining Differences
- [Differences]

### Recommendation
[Final recommendation]

### Dissenting Opinion
[Minority opinion - optional]
```

## Conclusion Methods

### Consensus
- Extract common points
- Specify differences
- Propose compromise

### Vote
- Each AI's final choice
- Majority rule

### Weighted
- Weight by expertise
- Weighted average decision
