# Stage 02: Research

## Objective
Conduct technical research and feasibility analysis based on the brainstorming outputs.

## Inputs
- `stages/01-brainstorm/HANDOFF.md` — context from brainstorming
- `stages/01-brainstorm/outputs/` — ideas and requirements
- `config/tech_preferences.jsonc` — user's tech stack preferences (if any)
- `references/02-research/` — any research reference materials

## Tech Preference Handling

Read `config/tech_preferences.jsonc`. If `raw_input` is non-empty:

- **PRIMARY CONSTRAINT**: The user's stated preferences take priority. Research must evaluate them favorably unless there is a strong, documented technical reason against them.
- If you recommend a different technology than the user's preference, you MUST include a `## Alignment with User Preferences` section in `tech_research.md` explaining:
  - Why the preferred technology is not recommended
  - Specific technical risks or limitations
  - The proposed alternative and why it's better for this project
- If the user's preferences are viable, use them as the recommended stack.

## Tasks

1. **Technology evaluation** — research and compare tech stack options (frameworks, databases, hosting)
2. **Library analysis** — identify key libraries/packages needed, compare alternatives
3. **Competitor analysis** — study 3-5 similar products, identify gaps and opportunities
4. **Feasibility assessment** — evaluate technical feasibility of proposed features
5. **Risk identification** — identify technical risks and mitigation strategies

## Required Outputs

Save all files to `stages/02-research/outputs/`:

### `tech_research.md` (required, min 2000 bytes)
- Framework comparison (pros/cons/recommendation)
- Database options analysis
- Key library recommendations with justification
- Performance considerations

### `feasibility_report.md` (required)
- Feature feasibility matrix (feature vs difficulty vs value)
- Technical risks and mitigations
- Recommended tech stack with rationale
- MVP timeline estimate

## Comprehensive Research Mandate

This is the project's dedicated research stage. Conduct thorough, systematic investigation:
- Technology evaluation with real benchmarks and comparisons
- Feasibility analysis for all proposed features
- Market/competitor research where relevant
- Performance characteristics of candidate technologies

Research findings from this stage form the foundation for ALL subsequent stages. Be exhaustive.

## Quality Criteria
- Every recommendation has a clear rationale
- Trade-offs are explicitly documented
- At least 2 alternatives considered per major decision
- Research is based on current (2024+) information

## HANDOFF
Generate `stages/02-research/HANDOFF.md` summarizing:
- Recommended tech stack
- Key technical decisions and rationale
- Identified risks
- What the planning stage needs to know
