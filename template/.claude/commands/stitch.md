# /stitch - Google Stitch MCP UI Generation

Generate UI from text descriptions or sketches using Google Stitch MCP.

## Usage

```
/stitch                         # Show status and quota
/stitch dna                     # Extract Design DNA from moodboard
/stitch generate "description"  # Generate UI from text description
/stitch image path/to/file      # Convert sketch/image to UI
/stitch variants N              # Generate N design variants
/stitch export [format]         # Export (figma|html|both)
/stitch quota                   # Check quota usage
```

---

## Commands

### `/stitch` (Status)
Display Stitch MCP status and current quota usage.

**Output:**
- MCP connection status
- Standard quota: X/350
- Experimental quota: X/50
- Current Design DNA status

### `/stitch dna`
Extract Design DNA from collected moodboard images.

**Prerequisites:**
- Run `/moodboard` first to collect visual references
- Images in `inputs/moodboard/ui-references/` and `inputs/moodboard/brand-assets/`

**Output:**
- `outputs/design_dna.json` - Extracted style tokens

**What's Extracted:**
- Color schemes and palettes
- Typography patterns
- Spacing rhythms
- Component styles
- Visual hierarchy patterns

### `/stitch generate "description"`
Generate UI from a text description.

**Example:**
```
/stitch generate "A login page with email and password fields, forgot password link, and social login buttons for Google and Apple"
```

**Options:**
- Uses Design DNA if available
- Generates responsive layouts by default
- Creates 3 variants by default

**Output:**
- `outputs/stitch_generated/ui_[timestamp]/` - Generated UI files

### `/stitch image path/to/file`
Convert a sketch, wireframe, or screenshot to clean UI.

**Supported formats:** PNG, JPG, WEBP, SVG

**Example:**
```
/stitch image inputs/moodboard/sketches/login_sketch.png
```

**Output:**
- Clean UI based on the sketch
- Applies Design DNA if available

### `/stitch variants N`
Generate N design variants for the current UI.

**Example:**
```
/stitch variants 5
```

**Notes:**
- Each variant costs 1 standard quota
- Maximum 10 variants per request

### `/stitch export [format]`
Export generated UI to specified format.

**Formats:**
- `figma` - Export to Figma file
- `html` - Export to HTML/CSS
- `both` - Export to both formats (default)

**Example:**
```
/stitch export figma
/stitch export html
/stitch export both
```

**Output locations:**
- Figma: `outputs/stitch_exports/figma/`
- HTML: `outputs/stitch_exports/html/`

### `/stitch quota`
Display detailed quota usage and history.

**Output:**
- Current month usage
- Remaining quota
- Monthly history
- Warning if approaching limit

---

## Workflow Integration

> **Note**: Stitch is the **2nd priority** UI generation tool. Pencil.dev is 1st priority.
> Stitch auto-activates when Pencil.dev is unavailable or fails.

Recommended workflow for Stage 04 (UI/UX):

```
1. /moodboard                     # Collect design references (or /moodboard generate)
2. /pencil analyze ...            # Analyze with Pencil.dev (primary)
   └─ If Pencil.dev fails:
3. /stitch dna                    # Extract Design DNA from moodboard (fallback)
4. /stitch generate "..."         # Generate initial UI
5. /stitch variants 3             # Generate alternatives
6. [Select best variant]
7. /stitch export both            # Export to Figma + HTML
8. Continue with wireframes.md
```

---

## Quota Management

### Monthly Limits (Free Tier)
- **Standard requests:** 350/month
- **Experimental requests:** 50/month

### Quota Costs
| Operation | Standard | Experimental |
|-----------|----------|--------------|
| Design DNA | 1 | - |
| Text→UI | 1 | - |
| Image→UI | 1 | - |
| Per Variant | 1 | - |
| Export | 0 (included) | - |

### Monitoring
```bash
# Check quota status
./scripts/stitch-quota-monitor.sh

# Check remaining
./scripts/stitch-quota-monitor.sh remaining

# View JSON
./scripts/stitch-quota-monitor.sh json
```

### Warning Threshold
At 80% usage, a warning is displayed. Consider:
1. Using fallback tools (Figma MCP, Claude Vision)
2. Batching requests
3. Waiting for monthly reset

---

## Fallback Chain

Full fallback chain (Stitch is 2nd priority):

```
Pencil.dev (via Playwright)        ◀── 1st Priority
    │
    ├─ Browser failed? ────────▶ Pencil.dev (via BrowserMCP)
    │
    └─ All browsers failed? ───▶ Stitch MCP              ◀── 2nd Priority (this tool)
                                     │
                                     ├─ Quota exceeded? ──────▶ Figma MCP (design tokens only)
                                     │
                                     ├─ API error? ──────────▶ Retry 2x, then Figma MCP
                                     │
                                     ├─ Figma unavailable? ──▶ Claude Vision (analysis only)
                                     │
                                     └─ All failed? ─────────▶ Manual wireframes (ASCII/Mermaid)
```

Fallback configuration: `config/mcp_fallbacks.jsonc`

---

## Output Files

| File | Description |
|------|-------------|
| `outputs/design_dna.json` | Extracted Design DNA |
| `outputs/stitch_generated/` | Generated UI files |
| `outputs/stitch_exports/figma/` | Figma exports |
| `outputs/stitch_exports/html/` | HTML/CSS exports |
| `state/stitch_usage.json` | Quota tracking |

---

## Configuration

See `config/ui-ux.jsonc` for settings:
- `stitch_integration.enabled` - Enable/disable
- `stitch_integration.auto_invoke_on_moodboard` - Auto-run DNA extraction
- `stitch_integration.generation_options` - Default variants, formats

---

## Troubleshooting

### "Stitch MCP not configured"
Run the setup script:
```bash
./scripts/setup-stitch-mcp.sh
```

### "Google Cloud not authenticated"
```bash
gcloud auth login
gcloud auth application-default login
```

### "Quota exceeded"
- Wait for monthly reset (1st of month)
- Use fallback: Figma MCP or Claude Vision
- Check usage: `./scripts/stitch-quota-monitor.sh`

### "API timeout"
- Stitch will retry 2x automatically
- If still failing, check network and GCloud status
- Fallback to Figma MCP will be used

---

## Best Practices

1. **Collect moodboard first** - Better Design DNA = better generated UI
2. **Use Design DNA** - Always extract DNA before generating for consistency
3. **Generate variants** - 3-5 variants help find optimal design
4. **Monitor quota** - Check `/stitch quota` regularly
5. **Export early** - Export to Figma for iteration, HTML for prototyping
