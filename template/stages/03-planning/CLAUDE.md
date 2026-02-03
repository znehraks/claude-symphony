# Stage 03: Planning

## Objective
Design the system architecture, data models, and API structure based on research findings.

## Inputs
- `stages/02-research/HANDOFF.md` — context from research
- `stages/02-research/outputs/` — tech research and feasibility report
- `config/tech_preferences.jsonc` — user's tech stack preferences (if any)
- `references/03-planning/` — architecture examples, API specs

## Tech Preference Respect

Read `config/tech_preferences.jsonc`. If `raw_input` is non-empty:

- The tech stack finalization (Task 4) must align with the user's stated preferences unless Stage 02 research explicitly documented reasons to diverge.
- If the research recommended alternatives, acknowledge the user's original preferences in `tech_stack.md` and explain the deviation.
- When preferences are viable, they MUST be the chosen stack — do not silently replace them.

## Tasks

1. **System architecture** — design high-level architecture (monolith/microservices, client-server topology)
2. **Data modeling** — define database schema, entities, and relationships
3. **API design** — define endpoints, request/response formats, authentication flow
4. **Tech stack finalization** — confirm framework, database, hosting, and key libraries
5. **Project plan** — create milestone-based plan with deliverables per milestone
6. **Convention definitions** — define project-wide conventions that ALL subsequent stages must follow. Save to `stages/03-planning/outputs/conventions.md`.

#### Planning Conventions
- Terminology glossary (domain terms, abbreviations)
- Document naming and structure rules
- Feature naming conventions
- Version numbering strategy

#### UI/UX Conventions
- Design token standards (colors, typography, spacing, breakpoints)
- Component naming conventions (PascalCase, BEM, etc.)
- Layout patterns (grid system, container widths, responsive rules)
- Accessibility requirements (WCAG level, ARIA rules)
- Icon and asset naming conventions
- State representation (loading, error, empty states)

#### Code Conventions
- File/folder structure and naming (kebab-case, PascalCase, etc.)
- Coding style (formatting, linting rules, import ordering)
- Function/variable naming rules
- Error handling patterns
- Logging conventions
- Test naming and structure (describe/it pattern, file naming)
- Git commit message format
- Comment and documentation style

## Required Outputs

Save all files to `stages/03-planning/outputs/`:

### `architecture.md` (required)
- System architecture diagram (text-based)
- Component descriptions and responsibilities
- Data flow between components
- Infrastructure requirements

### `tech_stack.md` (required)
- Final tech stack selections with versions
- Database schema (tables, fields, relationships)
- API endpoint list with methods and paths
- Authentication/authorization strategy

### `project_plan.md` (required)
- Milestone breakdown (3-5 milestones)
- Deliverables per milestone
- Dependencies between components
- Risk mitigation plan

### `conventions.md` (required)
- Planning conventions (terminology, naming, documentation rules)
- UI/UX conventions (design tokens, components, layout, accessibility)
- Code conventions (file structure, style, testing, git)
- Each convention must be specific and enforceable (not vague guidelines)

## Quality Criteria
- Architecture supports all must-have features from Stage 01
- Data model covers all entities without redundancy
- API design follows RESTful conventions (or GraphQL if chosen)
- Plan is actionable with clear deliverables
- Conventions are specific enough to verify compliance (not vague like "write clean code")
- UI/UX conventions cover design tokens, component patterns, and accessibility
- Code conventions cover file structure, naming, testing patterns, and git workflow

## Debate Emphasis

This stage uses FULL-INTENSITY multi-agent debate. Convention definitions (Task 6) are especially critical — they affect ALL subsequent stages. The debate must:
- Challenge every convention choice (is it specific enough? enforceable? practical?)
- Consider alternative approaches for each convention
- Ensure conventions don't conflict with each other
- Validate that conventions are testable/verifiable in later stages

## Research When Needed

If architectural decisions require additional research beyond Stage 02's findings, conduct targeted research. This is encouraged — better to research now than to discover issues during implementation.

## HANDOFF
Generate `stages/03-planning/HANDOFF.md` summarizing:
- Architecture decisions and trade-offs
- Tech stack selections
- Database schema summary
- Implementation priorities for Stage 05
- Convention highlights (key rules for immediate reference)
