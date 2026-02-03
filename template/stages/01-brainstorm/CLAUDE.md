# Stage 01: Brainstorming

## Objective
Transform the project brief into structured ideas, features, and requirements.

## Inputs
- `stages/01-brainstorm/inputs/project_brief.md` — the user's project description
- `config/tech_preferences.jsonc` — user's tech stack preferences (if any)
- `references/01-brainstorm/` — any reference materials

> **Tech Preferences**: If `config/tech_preferences.jsonc` has a non-empty `raw_input`, factor those preferences into feature ideation and requirements. Do not override them — treat them as user constraints.

## Tasks

1. **Analyze the project brief** — understand the core problem, target users, and constraints
2. **Generate feature ideas** — brainstorm 15-25 features organized by priority (must-have, should-have, nice-to-have)
3. **Define user stories** — write 5-10 key user stories in "As a [user], I want [action] so that [benefit]" format
4. **Analyze requirements** — separate functional and non-functional requirements
5. **Define project scope** — clearly state what is IN scope and OUT of scope for v1.0

## Required Outputs

Save all files to `stages/01-brainstorm/outputs/`:

### `ideas.md` (required, min 500 bytes)
- Feature list with priority levels (must-have / should-have / nice-to-have)
- User stories
- Unique value proposition

### `requirements_analysis.md` (required)
Must contain these sections:
- `## Functional Requirements` — what the system must do
- `## Non-functional Requirements` — performance, security, scalability constraints
- `## Scope` — what's included and excluded in v1.0

## Quality Criteria
- Features are specific and actionable, not vague
- Requirements are testable (can be verified as met/unmet)
- Scope is realistic for an MVP

## HANDOFF
After completing all outputs, generate `stages/01-brainstorm/HANDOFF.md` summarizing:
- Key ideas selected for implementation
- Core requirements identified
- Decisions made and rationale
- What the next stage (02-research) needs to know
