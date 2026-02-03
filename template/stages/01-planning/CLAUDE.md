# Stage 01: Planning & Architecture

## Objective
Transform project requirements into structured architecture, tech stack decisions, and comprehensive conventions.

**SuperClaude Commands**: `/sc:workflow` + `/sc:design --type architecture`

## Inputs
- `stages/01-planning/inputs/project_brief.md` — the user's project description
- `config/tech_preferences.jsonc` — user's tech stack preferences
- `state/discovery/discovery_state.json` — discovery phase results
- `state/research/combined_patterns.json` — tech research patterns
- `references/01-planning/` — architecture examples, API specs

## Tasks

### 1. Requirements Analysis
- Analyze the project brief — understand the core problem, target users, and constraints
- Generate feature ideas (15-25 features, prioritized: must-have, should-have, nice-to-have)
- Define user stories (5-10 key stories in "As a [user], I want [action] so that [benefit]" format)
- Separate functional and non-functional requirements
- Define project scope (IN and OUT of scope for v1.0)

### 2. Technical Research Integration
- Reference `state/research/combined_patterns.json` for best practices
- Apply researched patterns to architecture decisions
- Document any deviations from research recommendations

### 3. System Architecture
- Design high-level architecture (monolith/microservices, client-server topology)
- Create architecture diagram (text-based)
- Define component responsibilities and data flow
- Specify infrastructure requirements

### 4. Data Modeling
- Define database schema, entities, and relationships
- Document data flow between components

### 5. API Design
- Define endpoints, request/response formats
- Design authentication flow
- Document API contracts

### 6. Tech Stack Finalization
- Confirm framework, database, hosting, and key libraries
- Reference `config/tech_preferences.jsonc` — respect user preferences unless research documented reasons to diverge
- Document tech stack selections with versions

### 7. Project Planning
- Create milestone-based plan with deliverables per milestone
- Define dependencies between components
- Create risk mitigation plan

### 8. Convention Definitions
Define comprehensive conventions for ALL subsequent stages:

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
- File/folder structure and naming
- Coding style (formatting, linting rules, import ordering)
- Function/variable naming rules
- Error handling patterns
- Logging conventions
- Test naming and structure
- Git commit message format
- Comment and documentation style

## Required Outputs

Save all files to `stages/01-planning/outputs/`:

### `requirements.md` (required)
- Feature list with priority levels
- User stories
- Functional requirements
- Non-functional requirements
- Project scope (included/excluded)
- Unique value proposition

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

### `conventions.md` (required)
- Planning conventions
- UI/UX conventions
- Code conventions
- Each convention must be specific and enforceable

### `project_plan.md` (optional)
- Milestone breakdown (3-5 milestones)
- Deliverables per milestone
- Dependencies between components

## Quality Criteria
- Features are specific and actionable
- Requirements are testable
- Architecture supports all must-have features
- Data model covers all entities without redundancy
- API design follows RESTful conventions
- Conventions are specific enough to verify compliance
- Scope is realistic for MVP

## Quality Checks (Automated)
- `sections_exist`: Overview, Requirements, Architecture sections in docs
- `tech_stack_defined`: tech_stack.md exists
- `conventions_defined`: conventions.md exists

## HANDOFF
Generate `stages/01-planning/HANDOFF.md` summarizing:
- Key ideas selected for implementation
- Architecture decisions and trade-offs
- Tech stack selections
- Convention highlights (key rules for immediate reference)
- What the next stage (02-ui-ux) needs to know
