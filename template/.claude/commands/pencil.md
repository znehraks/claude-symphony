# /pencil - Pencil.dev Browser-Automated UI Generation & Analysis

Generate UI designs and analyze visual references using Pencil.dev via browser automation.

## Usage

```
/pencil                          # Show status and connection check
/pencil generate "description"   # Generate UI from text description
/pencil analyze path/to/image    # Analyze image for design tokens
/pencil moodboard "description"  # Generate moodboard from text description
```

---

## Commands

### `/pencil` (Status)

Check Pencil.dev accessibility and browser MCP status.

**Output:**
- Pencil.dev connection status
- Browser MCP availability (Playwright / BrowserMCP)
- Current fallback chain status

### `/pencil generate "description"`

Generate UI from a text description using Pencil.dev.

**Example:**
```
/pencil generate "A modern dashboard with sidebar navigation, user avatar, and analytics cards"
```

**Process:**
1. Launch browser via Playwright (or BrowserMCP fallback)
2. Navigate to Pencil.dev
3. Input design description
4. Capture generated UI output
5. Save to `outputs/pencil_generated/`

**Output:**
- `outputs/pencil_generated/ui_[timestamp]/` - Generated UI screenshots and assets

### `/pencil analyze path/to/image`

Analyze an image or screenshot to extract design tokens and patterns.

**Example:**
```
/pencil analyze inputs/moodboard/ui-references/hero-section.png
```

**Extracts:**
- Color palette
- Typography patterns
- Layout structure
- Component identification
- Spacing rhythm

### `/pencil moodboard "description"`

Generate a moodboard from a text description (Path B workflow).

**Example:**
```
/pencil moodboard "Modern SaaS app with dark theme, glassmorphism, and gradient accents"
```

**Process:**
1. Generate multiple style references via Pencil.dev
2. Present to user for review
3. Extract design tokens from approved selections

---

## Browser MCP Priority

Pencil.dev is accessed via browser automation. The priority order:

```
1. Playwright MCP (primary)
   - Full browser control
   - Screenshot capture
   - Element interaction

2. BrowserMCP (fallback)
   - Alternative browser automation
   - Used when Playwright is unavailable
```

### Browser Configuration

```jsonc
{
  "browser_config": {
    "primary": "playwright",
    "fallback": "browsermcp",
    "timeout_ms": 30000,
    "retry_count": 2
  }
}
```

---

## Fallback Chain

When Pencil.dev is unavailable or browser automation fails:

```
Pencil.dev (via Playwright)
    |
    +-- Playwright failed? --------> Pencil.dev (via BrowserMCP)
    |
    +-- BrowserMCP failed? --------> Stitch MCP (text-to-UI)
    |
    +-- Stitch unavailable? -------> Figma MCP (design tokens only)
    |
    +-- Figma unavailable? --------> Claude Vision (analysis only)
    |
    +-- All failed? ---------------> Manual wireframes (ASCII/Mermaid)
```

Fallback configuration: `config/mcp_fallbacks.jsonc`

---

## Integration with Moodboard Workflow

### Path A (Existing References)
```
/moodboard              # Collect existing images
/pencil analyze ...     # Analyze with Pencil.dev
/moodboard export       # Export design tokens
```

### Path B (AI-Generated)
```
/pencil moodboard "..."  # Generate moodboard via Pencil.dev
[User reviews and approves]
/moodboard export        # Export design tokens
```

---

## Output Files

| File | Description |
|------|-------------|
| `outputs/pencil_generated/` | Generated UI files |
| `outputs/pencil_analysis/` | Analysis results |
| `outputs/design_dna.json` | Extracted Design DNA |

---

## Configuration

See `config/ui-ux.jsonc` for settings:
- `moodboard.analysis_provider.providers.pencil_dev` - Provider configuration
- `moodboard.moodboard_workflow` - Dual-path workflow settings

---

## Troubleshooting

### "Pencil.dev not accessible"
- Check internet connection
- Verify https://pencil.dev is available
- Fallback will auto-activate (Stitch MCP)

### "Browser MCP not available"
- Ensure Playwright or BrowserMCP is configured
- Run: `claude mcp list` to check available browser MCPs
- Install Playwright: see MCP server setup docs

### "Browser automation timeout"
- Default timeout: 30 seconds
- Retries: 2 attempts before fallback
- If persistent, use `/stitch` as alternative
