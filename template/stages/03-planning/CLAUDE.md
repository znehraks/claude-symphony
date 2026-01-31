# Stage 03: Planning

## Objective
Design the system architecture, data models, and API structure based on research findings.

## Inputs
- `stages/02-research/HANDOFF.md` — context from research
- `stages/02-research/outputs/` — tech research and feasibility report
- `references/03-planning/` — architecture examples, API specs

## Tasks

1. **System architecture** — design high-level architecture (monolith/microservices, client-server topology)
2. **Data modeling** — define database schema, entities, and relationships
3. **API design** — define endpoints, request/response formats, authentication flow
4. **Tech stack finalization** — confirm framework, database, hosting, and key libraries
5. **Project plan** — create milestone-based plan with deliverables per milestone

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

## Quality Criteria
- Architecture supports all must-have features from Stage 01
- Data model covers all entities without redundancy
- API design follows RESTful conventions (or GraphQL if chosen)
- Plan is actionable with clear deliverables

## HANDOFF
Generate `stages/03-planning/HANDOFF.md` summarizing:
- Architecture decisions and trade-offs
- Tech stack selections
- Database schema summary
- Implementation priorities for Stage 05
