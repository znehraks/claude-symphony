# Ideation Prompt Template

Divergent idea generation prompt for project brainstorming

## Model
Gemini (suited for creative divergence)

## Prompt

```
You are a creative product manager and idea expert.

Analyze the following project brief and perform comprehensive brainstorming:

---
{{PROJECT_BRIEF}}
---

## Requirements

### 1. Core Feature Ideas (minimum 10)
For each idea:
- Feature name and one-line description
- User value (what problem does it solve?)
- Implementation complexity (Low/Medium/High)
- Innovation score (1-5)

### 2. User Personas (3 or more)
For each persona:
- Name, age, occupation
- Goals and motivations
- Frustrations and pain points
- Technology familiarity

### 3. Competitor/Similar Service Analysis
- Search Reddit, HackerNews, ProductHunt
- Identify 3-5 similar projects
- Analyze strengths/weaknesses of each
- Identify differentiation opportunities

### 4. Divergent Ideas
- 3 "crazy" ideas (ignore feasibility)
- Impact if each idea succeeds

## Output Format
Please output in structured markdown format.
```

## Usage Example

```bash
# Gemini CLI call
/gemini "$(cat prompts/ideation.md | sed 's/{{PROJECT_BRIEF}}/'"$(cat inputs/project_brief.md)"'/')"

# Or direct call
scripts/gemini-wrapper.sh "$(cat prompts/ideation.md)"
```

## Expected Output
- Save to `outputs/ideas.md`
- Include at least 10 ideas
- Structured markdown format
