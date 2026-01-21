# Output Validation Prompt - UI/UX Planning

## Validation Targets

| Output | Required Conditions | Validation Method |
|--------|---------------------|-------------------|
| `wireframes.md` | 5+ main screens | Count verification |
| `user_flows.md` | 3+ core flows | Count verification |
| `design_system.md` | Color/typography/spacing | Structure verification |
| `HANDOFF.md` | Component list | Item verification |

## Validation Command

```bash
/validate --stage 04-ui-ux
```

## Quality Criteria

### wireframes.md
- [ ] 5+ main screens
- [ ] Description for each screen
- [ ] Responsive breakpoint considerations
- [ ] Interaction descriptions

### user_flows.md
- [ ] 3+ core user flows
- [ ] Diagram for each flow
- [ ] Edge case handling
- [ ] Error state definitions

### design_system.md
- [ ] Color palette (Primary, Secondary, Neutral)
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component list and variants

### HANDOFF.md
- [ ] Components to implement list
- [ ] Priority assignments
- [ ] Technical considerations

## Automated Validation Script

```bash
# Check wireframe count
grep -c "^### " outputs/wireframes.md

# Check user flow count
grep -c "^## Flow" outputs/user_flows.md

# Check design system sections
grep -E "^## (Color|Typography|Spacing)" outputs/design_system.md
```
