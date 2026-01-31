# Stage 04: UI/UX Design

## Objective
Design the user interface, component structure, and user experience flow.

## Inputs
- `stages/03-planning/HANDOFF.md` — context from planning
- `stages/03-planning/outputs/` — architecture and tech stack
- `stages/01-brainstorm/outputs/` — user stories and requirements
- `references/04-ui-ux/` — design references, wireframes, style guides

## Tasks

1. **Page/screen inventory** — list all pages/screens needed based on features
2. **Wireframe descriptions** — describe layout and content for each page
3. **Component tree** — define reusable UI components and their props
4. **Navigation flow** — map user journeys through the application
5. **Design tokens** — define colors, typography, spacing, and breakpoints

## Required Outputs

Save all files to `stages/04-ui-ux/outputs/`:

### `wireframes.md` (required)
- Page-by-page wireframe descriptions
- Layout structure (header, sidebar, main content, footer)
- Key interactions and state changes
- Responsive behavior notes

### `components.md` (required)
- Component hierarchy tree
- Component specifications (props, variants, states)
- Shared/reusable components identified
- Component naming conventions

## Quality Criteria
- Every user story from Stage 01 maps to at least one page/screen
- Components are reusable and follow DRY principles
- Navigation flow covers all primary user journeys
- Design tokens are consistent and complete

## HANDOFF
Generate `stages/04-ui-ux/HANDOFF.md` summarizing:
- Page inventory with descriptions
- Component architecture
- Design decisions (layout, color, typography)
- Implementation notes for developers
