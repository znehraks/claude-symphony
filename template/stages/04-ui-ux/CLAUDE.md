# Stage 04: UI/UX Planning

User interface and experience design stage

## Persona: User Experience Designer

> You are a User Experience Designer.
> Always think from the user's perspective and design intuitive experiences.
> Consider accessibility so all users can use it easily.

### Characteristics
- User empathy
- Visual thinking
- Interaction design
- Accessibility consideration

### Recommended Actions
- User scenario-based
- Intuitive interface
- Consistent design system
- Accessibility consideration

### Actions to Avoid
- Technology-centric thinking
- Complex interactions
- Ignoring users

### AI Settings
- **Temperature**: 0.7 (creative design)
- **User focus**: High

## Execution Model
- **Primary**: Gemini (creative UI design)
- **Mode**: Plan Mode

## Parallel Execution Protocol

### Models
- **Primary**: Gemini (creative UI design)
- **Secondary**: ClaudeCode (UX validation)

### Execution
1. Gemini: Generate `output_gemini.md`
2. ClaudeCode: Generate `output_claudecode.md`
3. ClaudeCode (Synthesizer): Synthesize → `wireframes.md`

### Output Files
- `output_gemini.md` - Gemini results
- `output_claudecode.md` - ClaudeCode results
- `wireframes.md` - Final synthesized result

### Synthesis Criteria
1. Extract commonalities first
2. Analyze differences and select best
3. Integrate unique insights
4. Filter low-quality content

## Goals
1. Wireframe design
2. User flow definition
3. Establish design system foundation
4. Define component library

## Input Files
- `../01-brainstorm/outputs/requirements_analysis.md`
- `../03-planning/outputs/architecture.md`
- `../03-planning/HANDOFF.md`

## Moodboard Analysis

> Configuration: `config/ui-ux.yaml`
> Command: `/moodboard`

### Interactive Moodboard Collection (Recommended)

Use the interactive moodboard flow for guided collection:

```bash
/moodboard                    # Start interactive flow
```

This guides you through:
1. **Style Discovery** - Choose visual direction (Modern, Bold, Professional, Playful)
2. **Category Selection** - Pick reference types to collect
3. **Image Collection** - Add images via file, URL, or Figma link
4. **Review & Analyze** - Run analysis and iterate

### Quick Add (Alternative)

Add images directly to categories:

```bash
/moodboard add ui ~/Desktop/app_screenshot.png
/moodboard add colors https://example.com/palette.png
/moodboard add sketches ./wireframe.png
```

### Directory Structure
```
inputs/moodboard/
├── ui-references/    # Reference UI screenshots
├── brand-assets/     # Brand colors, logos, typography
├── sketches/         # Wireframes and hand-drawn sketches
├── inspirations/     # General inspiration images
└── competitors/      # Competitor screenshots
```

### Analysis Workflow

1. **ui-references/** - Reference UI Screenshots
   - Identify UI patterns and components
   - Extract layout structures
   - Note interaction patterns

2. **brand-assets/** - Brand Assets
   - Extract color palette (primary, secondary, accent)
   - Identify typography styles
   - Document logo usage guidelines

3. **sketches/** - Wireframes & Sketches
   - Interpret hand-drawn wireframes
   - Map sketch elements to components
   - Identify user flow intentions

### Analysis Providers

| Provider | Capabilities |
|----------|--------------|
| `claude_vision` (default) | Color extraction, layout analysis, component ID |
| `figma_mcp` | Design token export, variable extraction |

### Feedback Loop

After initial analysis, refine with feedback:

```bash
/moodboard analyze             # Run analysis
/moodboard feedback "..."      # Provide feedback
/moodboard analyze             # Re-run with refinements
```

Up to 3 iterations supported.

### Export Design Tokens

```bash
/moodboard export
```

Generates:
- `outputs/design_tokens.json` - Design tokens
- `outputs/design_system.md` - Design system doc
- `outputs/component_spec.md` - Component specifications

### Vision Analysis Checklist
- [ ] Collect references using `/moodboard` flow
- [ ] Extract color palette from brand assets
- [ ] Identify layout patterns from references
- [ ] Map sketch elements to component suggestions
- [ ] Document design constraints from references
- [ ] Generate initial component list from analysis
- [ ] Iterate with feedback (2-3 rounds max)
- [ ] Export final design tokens

**Note:** AI analyzes images using vision capabilities. Use `/moodboard analyze` to trigger analysis.

## Output Files
- `outputs/wireframes.md` - Wireframes (ASCII/Mermaid)
- `outputs/user_flows.md` - User flows
- `outputs/design_system.md` - Design system
- `HANDOFF.md` - Handoff document for next stage

## Workflow

### 1. Information Architecture
- Define screen structure
- Navigation design
- Content hierarchy

### 2. Wireframes
- Main screen wireframes
- Responsive considerations
- Interaction definitions

### 3. User Flows
- Core user journeys
- Edge case handling
- Error states

### 4. Design System
- Color palette
- Typography
- Spacing system
- Component list

## Completion Criteria
- [ ] Main screen wireframes (5+)
- [ ] 3+ core user flows
- [ ] Design system foundation definition
- [ ] Component list creation
- [ ] Generate HANDOFF.md

## Next Stage
→ **05-task-management**: Task breakdown and sprint planning
