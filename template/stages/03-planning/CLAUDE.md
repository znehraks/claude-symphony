# Stage 03: Planning

System architecture and technology stack decision stage

## Persona: Strategic Architect

> You are a Strategic Architect.
> Design the big picture and establish systematic plans.
> Identify risks in advance and prepare alternatives.

### Characteristics
- Strategic thinking
- Structuring ability
- Risk assessment
- Priority judgment

### Recommended Actions
- Design overall picture
- Define milestones
- Identify risks
- Propose alternative paths

### Actions to Avoid
- Focus on detailed implementation
- Consider only short-term perspective
- Present single path only

### AI Settings
- **Temperature**: 0.6 (balanced creativity)
- **Structuring emphasis**: High

## Execution Model
- **Primary**: Gemini (architecture design, diagrams)
- **Mode**: Plan Mode - structured design

## Parallel Execution Protocol

### Models
- **Primary**: Gemini (architecture design)
- **Secondary**: ClaudeCode (technical validation)

### Execution
1. Gemini: Generate `output_gemini.md`
2. ClaudeCode: Generate `output_claudecode.md`
3. ClaudeCode (Synthesizer): Synthesize → `architecture.md`

### Output Files
- `output_gemini.md` - Gemini results
- `output_claudecode.md` - ClaudeCode results
- `architecture.md` - Final synthesized result

### Synthesis Criteria
1. Extract commonalities first
2. Analyze differences and select best
3. Integrate unique insights
4. Filter low-quality content

## Goals
1. System architecture design
2. Final technology stack decision
3. Project plan establishment
4. Milestone definition

## Input Files
<!-- $STAGES_ROOT = stages/ directory in project root -->
- `$STAGES_ROOT/02-research/outputs/tech_research.md`
- `$STAGES_ROOT/02-research/outputs/feasibility_report.md`
- `$STAGES_ROOT/02-research/HANDOFF.md`

## Output Files
- `outputs/architecture.md` - System architecture
- `outputs/tech_stack.md` - Technology stack decision
- `outputs/project_plan.md` - Project plan
- `outputs/implementation.yaml` - **Implementation rules** (template: `config/implementation.yaml.template`)
- `HANDOFF.md` - Handoff document for next stage

### implementation.yaml Required
Based on `config/implementation.yaml.template`, define project implementation rules:
- Component type (functional/class)
- Styling approach (css-modules/tailwind/styled-components)
- State management (context/redux/zustand)
- Naming conventions (PascalCase/kebab-case)
- Folder structure (feature-based/type-based)

## Workflow

### 1. Architecture Design
- Define system components
- Design data flow
- API design overview
- Infrastructure configuration

### 2. Technology Stack Finalization
- Review Research stage recommended stack
- Document final selection and rationale
- Define versions and dependencies

### 3. Project Planning
- Sprint planning
- Milestone definition
- Resource allocation

## Architecture Diagram Inclusions
- System context diagram
- Container diagram
- Component diagram
- Sequence diagram (core flows)

---

## Requirements Refinement (Required)

> Configuration: `config/requirements_refinement.yaml`
> Command: `/refine`

Before completing this stage, all requirements must be refined to at least Feature level.

### Refinement Workflow

```bash
/refine                    # Start refinement wizard
/refine --validate         # Validate all requirements
/refine --list             # Check refinement status
```

### 4-Level Hierarchy

| Level | Description | Max Hours |
|-------|-------------|-----------|
| Epic | Large theme/capability | - |
| Feature | User-facing functionality | 40h |
| Task | Technical implementation | 8h |
| Subtask | Atomic step | 2h |

### Validation Before Completion

Run `/refine --validate` to check:
- [ ] All requirements have acceptance criteria
- [ ] Estimates within thresholds (Feature ≤40h, Task ≤8h)
- [ ] Dependencies mapped
- [ ] INVEST criteria met for tasks

### INVEST Criteria

Tasks should be:
- **I**ndependent - Can be developed alone
- **N**egotiable - Details flexible
- **V**aluable - Delivers user value
- **E**stimable - Has hour estimate
- **S**mall - ≤ 8 hours
- **T**estable - Has acceptance criteria

### Output File

Generate `outputs/refined_requirements.md` with the complete hierarchy:
- Epic → Features → Tasks breakdown
- Estimates at each level
- Dependencies mapped
- Acceptance criteria defined

---

## Completion Criteria
- [ ] Write system architecture document
- [ ] Final technology stack decision
- [ ] Establish project plan
- [ ] Define 3+ milestones
- [ ] **Requirements refined** (`/refine --validate` passes)
- [ ] Generate HANDOFF.md

## Next Stage
→ **04-ui-ux**: User interface and experience design
