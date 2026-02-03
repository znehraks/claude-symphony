# Stage 02: UI/UX Design

## Objective
Design the user interface, component system, and design tokens based on requirements and architecture.

**SuperClaude Command**: `/sc:design --type component`

**Recommended MCP**: stitch, pencil

## Inputs
- `stages/01-planning/HANDOFF.md` — context from planning
- `stages/01-planning/outputs/requirements.md` — requirements and user stories
- `stages/01-planning/outputs/architecture.md` — system architecture
- `stages/01-planning/outputs/conventions.md` — UI/UX conventions
- `references/02-ui-ux/` — design references, wireframes, style guides

## Tasks

### 1. Design Token System
Define the visual foundation:

```json
{
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "background": "#...",
    "text": "#...",
    "error": "#...",
    "success": "#..."
  },
  "typography": {
    "fontFamily": "...",
    "sizes": { "xs": "...", "sm": "...", "md": "...", "lg": "...", "xl": "..." },
    "weights": { "normal": 400, "medium": 500, "bold": 700 }
  },
  "spacing": {
    "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px"
  },
  "breakpoints": {
    "mobile": "320px", "tablet": "768px", "desktop": "1024px"
  }
}
```

### 2. Component Specifications
For each UI component:
- Name and purpose
- Props/variants
- States (default, hover, active, disabled, loading, error)
- Accessibility requirements (ARIA, keyboard navigation)
- Responsive behavior

### 3. Wireframes
Create wireframes for each screen/page:
- Layout structure
- Component placement
- User flow annotations
- Responsive variations

### 4. User Flow Design
- Map user journeys for key features
- Define navigation patterns
- Document interaction patterns

### 5. Design System Documentation
- Component usage guidelines
- Pattern library
- Accessibility checklist

## MCP Integration (Recommended)

### Using Stitch MCP (if available)
```
mcp__stitch__generate_screen_from_text({
  "description": "Dashboard with sidebar navigation and data cards"
})
```

### Using Pencil MCP (if available)
```
mcp__pencil__batch_design({
  "operations": [
    { "type": "insert", "component": "Button", "props": {...} }
  ]
})
```

**Note**: MCP usage is recommended but not required. If unavailable, create specifications manually.

## Required Outputs

Save all files to `stages/02-ui-ux/outputs/`:

### `design_tokens.json` (required)
```json
{
  "colors": {...},
  "typography": {...},
  "spacing": {...},
  "breakpoints": {...},
  "shadows": {...},
  "borders": {...}
}
```

### `component_specs.md` (required)
For each component:
- Name, purpose, and category
- Props with types and defaults
- States and variants
- Usage examples
- Accessibility notes

Minimum 5 components required.

### `wireframes/` (required directory)
- Screen wireframes (text-based or exported images)
- At least one wireframe per major feature

### `user_flows.md` (optional)
- User journey maps
- Navigation flow diagrams

### `design_system.md` (optional)
- Component usage guidelines
- Pattern library documentation

## Convention Compliance
Reference `stages/01-planning/outputs/conventions.md` UI/UX conventions:
- Apply design token standards
- Follow component naming conventions
- Implement accessibility requirements
- Use defined layout patterns

## Quality Criteria
- Design tokens cover all visual aspects
- Components are reusable and consistent
- Wireframes cover all key screens
- Accessibility is addressed (WCAG compliance)
- Design aligns with conventions.md

## Quality Checks (Automated)
- `design_tokens`: design_tokens.json exists
- `component_count`: minimum 5 component specifications
- `wireframes_exist`: wireframes/ directory has content

## HANDOFF
Generate `stages/02-ui-ux/HANDOFF.md` summarizing:
- Design token summary
- Component inventory
- Key design decisions
- Accessibility considerations
- What implementation stage needs to know
