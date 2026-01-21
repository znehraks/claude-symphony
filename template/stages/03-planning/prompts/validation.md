# Output Validation Prompt - Planning

## Validation Targets

| Output | Required Conditions | Validation Method |
|--------|---------------------|-------------------|
| `architecture.md` | 4 types of diagrams | Structure verification |
| `tech_stack.md` | Version/dependency specified | Item verification |
| `project_plan.md` | 3+ milestones | Count verification |
| `implementation.yaml` | Implementation rules defined | Schema validation |
| `HANDOFF.md` | Next step instructions | Item verification |

## Validation Command

```bash
/validate --stage 03-planning
```

## Quality Criteria

### architecture.md
- [ ] System context diagram
- [ ] Container diagram
- [ ] Component diagram
- [ ] Sequence diagram (core flows)
- [ ] Data flow description

### tech_stack.md
- [ ] Frontend stack specified
- [ ] Backend stack specified
- [ ] Database selection
- [ ] Version and dependency definition
- [ ] Selection rationale documented

### project_plan.md
- [ ] 3+ milestones
- [ ] Deliverables per milestone
- [ ] Sprint plan
- [ ] Resource allocation

### implementation.yaml
- [ ] Component type definition
- [ ] Styling approach definition
- [ ] State management pattern definition
- [ ] Naming convention definition
- [ ] Folder structure definition

## Automated Validation Script

```bash
# Check diagram count (mermaid blocks)
grep -c "```mermaid" outputs/architecture.md

# implementation.yaml validity
yq eval '.' outputs/implementation.yaml

# Check milestone count
grep -c "^## Milestone" outputs/project_plan.md
```
