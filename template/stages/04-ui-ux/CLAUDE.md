# Stage 04: UI/UX Design

## Objective
Design the user interface, component structure, and user experience flow.

## Inputs
- `stages/03-planning/HANDOFF.md` — context from planning
- `stages/03-planning/outputs/` — architecture and tech stack
- `stages/03-planning/outputs/conventions.md` — project conventions (MUST follow UI/UX section)
- `stages/01-brainstorm/outputs/` — user stories and requirements
- `references/04-ui-ux/` — design references, wireframes, style guides

## Tasks

1. **Page/screen inventory** — list all pages/screens needed based on features
2. **Wireframe descriptions** — describe layout and content for each page
3. **Component tree** — define reusable UI components and their props
4. **Navigation flow** — map user journeys through the application
5. **Design tokens** — define colors, typography, spacing, and breakpoints
6. **Convention compliance check** — verify all design decisions align with UI/UX conventions from Stage 03

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

## MCP Design Tools: Stitch & Pencil.dev (Strongly Recommended)

If Stitch MCP and/or Pencil.dev MCP servers are available, you MUST use them actively for design work:

### Stitch MCP
- Use `stitch__generate_screen_from_text` to generate screen designs from text descriptions
- Use `stitch__list_screens` and `stitch__get_screen` to manage and retrieve designs
- Generate screens for ALL key pages identified in the wireframe task

### Pencil.dev MCP
- Use `pencil__batch_design` to create detailed UI designs
- Use `pencil__get_screenshot` to validate designs visually
- Use `pencil__get_style_guide` for design system consistency
- Use `pencil__get_variables` to extract design tokens

### Developer-Friendly Output (REQUIRED)
After using MCP design tools, save outputs in formats that Stage 05 (Task Management) and Stage 06 (Implementation) can directly use:

Save to `stages/04-ui-ux/outputs/design_assets/`:
- `screen_inventory.md` — list of all screens with Stitch/Pencil references
- `component_specs.json` — structured component data (name, props, variants, dimensions)
- `design_tokens.json` — extracted design tokens (colors, spacing, typography as JSON)
- `screen_screenshots/` — visual references exported from design tools
- `layout_specs.md` — layout details per screen (grid, spacing, responsive breakpoints)

These files MUST be structured enough for a developer to implement without re-interpreting vague descriptions.

If MCP tools are NOT available, document the designs in the standard markdown format (wireframes.md, components.md) with maximum detail.

## Design Asset Versioning

All JSON design assets must include version metadata:

```json
{
  "version": "1.0",
  "last_updated": "YYYY-MM-DD",
  "changelog": []
}
```

- v1.0: Initial design (Stage 04)
- v1.1+: Updates during Stage 06 (non-breaking)
- v2.0+: Major redesign (breaking)

Maintain changelog in `screen_inventory.md` under "Design Asset Changelog" heading.

## Quality Criteria
- Every user story from Stage 01 maps to at least one page/screen
- Components are reusable and follow DRY principles
- Navigation flow covers all primary user journeys
- Design tokens are consistent and complete
- All design tokens match conventions.md specifications
- Component naming follows the convention rules
- Accessibility requirements from conventions are met

### Web Interface Guidelines Compliance
- Reference Vercel Web Interface Guidelines for accessibility, forms, animation, and interaction patterns
- Source: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- Key checks: aria-label on icon buttons, keyboard handlers on interactive elements, semantic HTML, focus-visible states
- Anti-pattern detection: `user-scalable=no`, `transition: all`, `outline-none` without replacement, div/span click handlers, images without dimensions

## Research When Needed

If design decisions require additional UX research, accessibility standards lookup, or design pattern investigation beyond Stage 02's findings, conduct targeted research.

## Debate Emphasis

This stage uses FULL-INTENSITY multi-agent debate with these rules:

### Decision Owner
- **UX Designer** is the decision owner
- When consensus is NOT reached after max rounds, UX Designer makes the final call
- Final decisions must include documented rationale

### Timebox
- Debate is timeboxed (see debate.jsonc `timebox_minutes`)
- If exceeded, the decision owner decides immediately

### Completion Criteria
1. Consensus reached → proceed
2. Max rounds without consensus → decision owner decides, document minority opinions
3. Timebox exceeded → decision owner decides immediately

UI/UX decisions must be thoroughly challenged and validated against Stage 03 conventions before finalization.

## Convention Compliance & Amendment
- All design decisions MUST align with conventions.md
- If a convention proves impractical: follow the Convention Amendment Protocol (Stage 03)
- Document all amendments in `stages/03-planning/outputs/conventions-changelog.md`
- DO NOT silently ignore conventions

## HANDOFF
Generate `stages/04-ui-ux/HANDOFF.md` summarizing:
- Page inventory with descriptions
- Component architecture
- Design decisions (layout, color, typography)
- Implementation notes for developers
