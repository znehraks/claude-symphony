# /moodboard - Interactive Moodboard Collection & Analysis

Collect visual references and analyze them to generate design tokens and design system recommendations.

## Usage

```
/moodboard                       # Start interactive moodboard flow
/moodboard generate              # Generate moodboard from text description (Path B)
/moodboard add [category]        # Add images to a category
/moodboard analyze               # Run analysis on collected images
/moodboard feedback "..."        # Provide feedback on analysis
/moodboard export                # Export design tokens
/moodboard status                # Show collection status
```

---

## Interactive Flow

### `/moodboard` (Start Flow)

Starts the interactive moodboard collection process with 4 steps:

#### Step 1: Style Discovery
```
What visual style are you aiming for?

1. Modern/Minimal - Clean lines, whitespace, subtle colors
2. Bold/Colorful - Vibrant colors, strong contrasts, dynamic
3. Professional/Corporate - Trust, stability, formal, structured
4. Playful/Creative - Fun, creative, unconventional, expressive
5. Custom - Describe your own style
```

#### Step 2: Category Selection
```
What types of references do you want to collect? (Select multiple)

[ ] UI Screenshots - Screenshots of apps/websites you like
[ ] Color Palettes - Color schemes and palettes
[ ] Typography - Font pairings and text styles
[ ] Brand Assets - Logos, icons, brand elements
[ ] Wireframes/Sketches - Rough layouts and sketches
[ ] Competitor Analysis - Competitor app/website screenshots
[ ] General Inspirations - Any inspiring images
```

#### Step 3: Image Collection
For each selected category, collect images via:
- **Local file**: Upload from computer
- **URL**: Paste image URL
- **Figma link**: Link to Figma frame (requires Figma MCP)
- **Screenshot**: Take a screenshot

Recommended: 3 images per category

#### Step 4: Review & Analyze
Review collected images and run initial analysis.

---

## Dual-Path Workflow

The moodboard supports two paths based on your pre-start intake answers:

### Path A: Analyze Existing References
If you already have design references, use the standard interactive flow:
```
/moodboard          # Collect and analyze existing images
```

### Path B: AI-Generated Moodboard
If you have no references, generate a moodboard from text descriptions:
```
/moodboard generate # Generate moodboard via AI
```

---

## Subcommands

### `/moodboard generate` (Path B: AI-Generated Moodboard)

Generate a moodboard from text descriptions when no existing references are available.

**Flow:**
1. **Description Collection** - Describe your desired visual style
2. **AI Generation** - Generate visual references using provider chain
3. **User Review** - Review and approve/reject generated references
4. **Token Extraction** - Extract design tokens from approved selections

**Generation Provider Priority:**
1. **Pencil.dev** (via Playwright/BrowserMCP) - Text-to-UI generation
2. **Stitch MCP** - Google Stitch text-to-UI fallback
3. **Claude Vision** - AI-described design concepts

**Example:**
```
/moodboard generate
> Describe your desired visual style:
> "Modern SaaS dashboard with dark theme, glassmorphism cards, and gradient accents"

Generating via Pencil.dev...
[Generated 3 style references]

Review:
1. [Dark glassmorphism variant] - love_it / tweak / different / discard
2. [Gradient accent variant]    - love_it / tweak / different / discard
3. [Minimal dark variant]       - love_it / tweak / different / discard

Extracting design tokens from approved selections...
```

### `/moodboard add [category]`
Add images to a specific category without going through full flow.

**Categories:**
- `ui` - UI screenshots (→ ui-references/)
- `colors` - Color palettes (→ brand-assets/)
- `typography` - Typography samples (→ brand-assets/)
- `brand` - Brand assets (→ brand-assets/)
- `sketches` - Wireframes/sketches (→ sketches/)
- `competitors` - Competitor screenshots (→ competitors/)
- `inspirations` - General inspirations (→ inspirations/)

**Example:**
```
/moodboard add ui
> Provide image path or URL for UI reference:
```

### `/moodboard analyze`
Run analysis on all collected images using configured provider.

**Analysis Outputs:**
- Color palette extraction
- Typography suggestions
- Layout pattern identification
- Component recommendations
- Spacing/rhythm analysis

**Analysis Providers (priority order):**
1. `pencil_dev` - Pencil.dev browser-automated analysis (via Playwright/BrowserMCP)
2. `stitch` - Google Stitch MCP analysis
3. `figma_mcp` - Figma MCP for design token export
4. `claude_vision` - Claude's native vision capabilities

**Action:**
```bash
./scripts/moodboard-manager.sh analyze
```

### `/moodboard feedback "..."`
Provide feedback on the current analysis to refine results.

**Feedback Types:**
- `love_it` - Keep as is
- `tweak` - Minor adjustment needed
- `different` - Try different approach
- `discard` - Remove from consideration

**Examples:**
```
/moodboard feedback "colors are too muted, make them more vibrant"
/moodboard feedback "typography is too formal, try something more playful"
/moodboard feedback "love the layout suggestions, keep them"
```

**Feedback Loop:**
1. Initial analysis → User feedback → Refinement
2. Up to 3 iterations
3. Final lock-in of design tokens

### `/moodboard export`
Export final design tokens and design system documentation.

**Outputs:**
- `outputs/design_tokens.json` - Design tokens in JSON format
- `outputs/design_system.md` - Design system documentation
- `outputs/component_spec.md` - Component specifications

**Export Formats:**
- JSON (default)
- CSS custom properties
- SCSS variables
- Tailwind config

### `/moodboard status`
Display current moodboard collection status.

**Shows:**
- Collection progress (step X of 4)
- Images per category
- Analysis status
- Feedback iterations

---

## Directory Structure

```
stages/04-ui-ux/inputs/moodboard/
├── ui-references/       # UI screenshots
├── brand-assets/        # Colors, typography, logos
├── sketches/            # Wireframes and hand-drawn
├── inspirations/        # General inspiration images
└── competitors/         # Competitor analysis
```

---

## Analysis Flow

### Using Pencil.dev (Primary)

1. **Browser Launch**: Open Pencil.dev via Playwright (or BrowserMCP fallback)
2. **Image Upload**: Upload moodboard images for analysis
3. **AI Analysis**: Pencil.dev extracts design patterns
4. **Token Generation**: Color, typography, spacing, component tokens

### Using Stitch MCP (Fallback 1)

When Pencil.dev is unavailable:
1. **Design DNA Extraction**: Extract style tokens from images
2. **Pattern Analysis**: Identify layout and component patterns
3. **Export**: Generate design tokens

### Using Claude Vision (Fallback 3)

1. **Image Reading**: Claude reads all images in moodboard directories
2. **Color Extraction**: Identifies dominant and accent colors
3. **Typography Analysis**: Detects font styles and hierarchies
4. **Layout Patterns**: Identifies grid systems and spacing patterns
5. **Component Identification**: Suggests UI component patterns

### Using Figma MCP (Fallback 2)

When Figma links are provided:
1. **Variable Extraction**: Get design variables from Figma
2. **Component Inspection**: Analyze Figma components
3. **Code Generation**: Generate code from Figma designs

---

## Feedback Loop Process

```
┌─────────────────────────────────────────────┐
│  Initial Analysis                            │
│  - Color palette draft                       │
│  - Typography suggestions                    │
│  - Layout patterns                           │
│  - Component recommendations                 │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  User Feedback                               │
│  "Colors too muted, typography too formal"   │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Refinement (Iteration 1)                    │
│  - Adjusted colors (more vibrant)            │
│  - Updated typography (more casual)          │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
         (Repeat up to 3 times)
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Finalization                                │
│  - design_tokens.json                        │
│  - design_system.md                          │
│  - component_library_spec.md                 │
└─────────────────────────────────────────────┘
```

---

## State Tracking

Moodboard state is tracked in `state/progress.json`:

```json
{
  "moodboard": {
    "collection_active": true,
    "current_step": 3,
    "selected_style": "modern_minimal",
    "selected_categories": ["ui_screenshots", "color_palettes"],
    "analysis_iterations": 1,
    "feedback_history": [
      {
        "iteration": 1,
        "feedback": "colors too muted",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## Configuration

See `config/ui-ux.jsonc` for detailed settings:
- Collection flow steps
- Analysis providers
- Feedback loop settings
- Output formats

---

## Best Practices

1. **Collect diverse references** - Include multiple perspectives
2. **Use high-quality images** - Better analysis results
3. **Provide specific feedback** - "More vibrant blue" vs "different colors"
4. **Iterate thoughtfully** - Don't over-refine (2-3 iterations usually enough)
5. **Export early** - Generate tokens even if not perfect, iterate on code
