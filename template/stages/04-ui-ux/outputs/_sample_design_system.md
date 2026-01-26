# Design System Specification
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: W3C Design Tokens, IBM Carbon, Material Design 3 -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `design_system.md`.

---

## Metadata

| Field | Value |
|-------|-------|
| version | 1.0.0 |
| last_updated | YYYY-MM-DD |
| figma_link | [Figma File](https://figma.com/file/xxx) |
| moodboard_ref | `./moodboard/` |
| token_format | W3C DTCG JSON |

---

## Token Architecture (3-Tier System)

> Tokens follow the W3C Design Tokens Community Group specification.

### Tier 1: Global/Primitive Tokens

Raw values without semantic meaning. These are the foundation.

```json
{
  "color": {
    "neutral": {
      "0": { "$value": "#FFFFFF", "$type": "color" },
      "50": { "$value": "#F9FAFB", "$type": "color" },
      "100": { "$value": "#F3F4F6", "$type": "color" },
      "200": { "$value": "#E5E7EB", "$type": "color" },
      "300": { "$value": "#D1D5DB", "$type": "color" },
      "400": { "$value": "#9CA3AF", "$type": "color" },
      "500": { "$value": "#6B7280", "$type": "color" },
      "600": { "$value": "#4B5563", "$type": "color" },
      "700": { "$value": "#374151", "$type": "color" },
      "800": { "$value": "#1F2937", "$type": "color" },
      "900": { "$value": "#111827", "$type": "color" },
      "950": { "$value": "#030712", "$type": "color" }
    },
    "blue": {
      "50": { "$value": "#EFF6FF", "$type": "color" },
      "100": { "$value": "#DBEAFE", "$type": "color" },
      "200": { "$value": "#BFDBFE", "$type": "color" },
      "300": { "$value": "#93C5FD", "$type": "color" },
      "400": { "$value": "#60A5FA", "$type": "color" },
      "500": { "$value": "#3B82F6", "$type": "color" },
      "600": { "$value": "#2563EB", "$type": "color" },
      "700": { "$value": "#1D4ED8", "$type": "color" },
      "800": { "$value": "#1E40AF", "$type": "color" },
      "900": { "$value": "#1E3A8A", "$type": "color" }
    },
    "red": {
      "500": { "$value": "#EF4444", "$type": "color" },
      "600": { "$value": "#DC2626", "$type": "color" }
    },
    "green": {
      "500": { "$value": "#22C55E", "$type": "color" },
      "600": { "$value": "#16A34A", "$type": "color" }
    }
  },
  "spacing": {
    "0": { "$value": "0px", "$type": "dimension" },
    "1": { "$value": "4px", "$type": "dimension" },
    "2": { "$value": "8px", "$type": "dimension" },
    "3": { "$value": "12px", "$type": "dimension" },
    "4": { "$value": "16px", "$type": "dimension" },
    "5": { "$value": "20px", "$type": "dimension" },
    "6": { "$value": "24px", "$type": "dimension" },
    "8": { "$value": "32px", "$type": "dimension" },
    "10": { "$value": "40px", "$type": "dimension" },
    "12": { "$value": "48px", "$type": "dimension" },
    "16": { "$value": "64px", "$type": "dimension" }
  },
  "radius": {
    "none": { "$value": "0px", "$type": "dimension" },
    "sm": { "$value": "4px", "$type": "dimension" },
    "md": { "$value": "8px", "$type": "dimension" },
    "lg": { "$value": "12px", "$type": "dimension" },
    "xl": { "$value": "16px", "$type": "dimension" },
    "full": { "$value": "9999px", "$type": "dimension" }
  }
}
```

### Tier 2: Alias/Semantic Tokens

Purpose-driven tokens that reference primitives.

```json
{
  "color": {
    "background": {
      "default": { "$value": "{color.neutral.0}", "$type": "color" },
      "subtle": { "$value": "{color.neutral.50}", "$type": "color" },
      "muted": { "$value": "{color.neutral.100}", "$type": "color" },
      "inverse": { "$value": "{color.neutral.900}", "$type": "color" }
    },
    "foreground": {
      "default": { "$value": "{color.neutral.900}", "$type": "color" },
      "muted": { "$value": "{color.neutral.500}", "$type": "color" },
      "subtle": { "$value": "{color.neutral.400}", "$type": "color" },
      "inverse": { "$value": "{color.neutral.0}", "$type": "color" }
    },
    "border": {
      "default": { "$value": "{color.neutral.200}", "$type": "color" },
      "muted": { "$value": "{color.neutral.100}", "$type": "color" },
      "strong": { "$value": "{color.neutral.300}", "$type": "color" }
    },
    "interactive": {
      "default": { "$value": "{color.blue.500}", "$type": "color" },
      "hover": { "$value": "{color.blue.600}", "$type": "color" },
      "active": { "$value": "{color.blue.700}", "$type": "color" },
      "disabled": { "$value": "{color.neutral.300}", "$type": "color" }
    },
    "status": {
      "error": { "$value": "{color.red.500}", "$type": "color" },
      "success": { "$value": "{color.green.500}", "$type": "color" }
    }
  }
}
```

### Tier 3: Component Tokens

Component-specific tokens for fine-grained control.

```json
{
  "button": {
    "primary": {
      "background": { "$value": "{color.interactive.default}", "$type": "color" },
      "background-hover": { "$value": "{color.interactive.hover}", "$type": "color" },
      "background-active": { "$value": "{color.interactive.active}", "$type": "color" },
      "foreground": { "$value": "{color.foreground.inverse}", "$type": "color" },
      "border-radius": { "$value": "{radius.md}", "$type": "dimension" },
      "padding-x": { "$value": "{spacing.4}", "$type": "dimension" },
      "padding-y": { "$value": "{spacing.2}", "$type": "dimension" }
    },
    "secondary": {
      "background": { "$value": "transparent", "$type": "color" },
      "background-hover": { "$value": "{color.background.subtle}", "$type": "color" },
      "foreground": { "$value": "{color.foreground.default}", "$type": "color" },
      "border": { "$value": "{color.border.default}", "$type": "color" }
    }
  },
  "input": {
    "background": { "$value": "{color.background.default}", "$type": "color" },
    "border": { "$value": "{color.border.default}", "$type": "color" },
    "border-focus": { "$value": "{color.interactive.default}", "$type": "color" },
    "border-error": { "$value": "{color.status.error}", "$type": "color" },
    "border-radius": { "$value": "{radius.md}", "$type": "dimension" },
    "padding": { "$value": "{spacing.3}", "$type": "dimension" }
  }
}
```

---

## Accessibility Requirements

| Check | Target | Standard | Verification Tool |
|-------|--------|----------|-------------------|
| Text Contrast | 4.5:1 minimum | WCAG 2.1 AA | WebAIM Contrast Checker |
| Large Text Contrast | 3:1 minimum | WCAG 2.1 AA | WebAIM Contrast Checker |
| UI Component Contrast | 3:1 minimum | WCAG 2.1 AA | Manual |
| Focus Visible | 2px outline | WCAG 2.4.7 | Manual |
| Touch Target Size | 44x44px minimum | WCAG 2.5.5 | Manual |
| Color Independence | No color-only info | WCAG 1.4.1 | Manual |

### Contrast Verification

| Combination | Ratio | Status |
|-------------|-------|--------|
| foreground.default on background.default | 15.3:1 | Pass |
| foreground.muted on background.default | 7.1:1 | Pass |
| foreground.subtle on background.default | 4.6:1 | Pass |
| interactive.default on background.default | 4.5:1 | Pass |
| foreground.inverse on interactive.default | 4.7:1 | Pass |

---

## Typography Scale

Using a modular scale with ratio 1.25 (Major Third).

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px (0.75rem) | 1.5 | 400 | Caption, helper text |
| `text-sm` | 14px (0.875rem) | 1.5 | 400 | Secondary text, labels |
| `text-base` | 16px (1rem) | 1.5 | 400 | Body text |
| `text-lg` | 18px (1.125rem) | 1.5 | 500 | Large body, emphasis |
| `text-xl` | 20px (1.25rem) | 1.4 | 600 | H4, card titles |
| `text-2xl` | 24px (1.5rem) | 1.3 | 600 | H3, section headers |
| `text-3xl` | 30px (1.875rem) | 1.2 | 700 | H2, page sections |
| `text-4xl` | 36px (2.25rem) | 1.1 | 700 | H1, page titles |

### Font Stacks

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

---

## Component Specifications

### Button

#### TypeScript Interface

```typescript
interface ButtonProps {
  /** Visual style variant */
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size of the button */
  size: 'sm' | 'md' | 'lg';
  /** Current state (controlled internally) */
  state?: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading';
  /** Disable the button */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button content */
  children: React.ReactNode;
}
```

#### Token Mapping

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| primary | `button.primary.background` | `button.primary.foreground` | none |
| secondary | transparent | `foreground.default` | `border.default` |
| ghost | transparent | `foreground.default` | none |
| danger | `status.error` | `foreground.inverse` | none |

#### State Matrix

| State | Visual Change | Cursor | ARIA |
|-------|---------------|--------|------|
| default | Base styles | pointer | - |
| hover | background-hover | pointer | - |
| active | background-active + scale(0.98) | pointer | aria-pressed="true" |
| focus | 2px focus ring | - | - |
| disabled | opacity: 0.5 | not-allowed | aria-disabled="true" |
| loading | spinner + opacity: 0.7 | wait | aria-busy="true" |

#### Size Specifications

| Size | Height | Padding X | Padding Y | Font Size | Icon Size |
|------|--------|-----------|-----------|-----------|-----------|
| sm | 32px | 12px | 6px | 14px | 16px |
| md | 40px | 16px | 8px | 16px | 20px |
| lg | 48px | 20px | 12px | 18px | 24px |

---

### Input

#### TypeScript Interface

```typescript
interface InputProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state with message */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left addon (icon or text) */
  leftAddon?: React.ReactNode;
  /** Right addon (icon or text) */
  rightAddon?: React.ReactNode;
}
```

#### State Styles

| State | Border Color | Background | Ring |
|-------|--------------|------------|------|
| default | `input.border` | `input.background` | none |
| hover | `border.strong` | `input.background` | none |
| focus | `input.border-focus` | `input.background` | 2px blue |
| error | `input.border-error` | `input.background` | none |
| disabled | `border.muted` | `background.muted` | none |

---

### Card

#### TypeScript Interface

```typescript
interface CardProps {
  /** Visual variant */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Interactive (adds hover state) */
  interactive?: boolean;
  /** Card content */
  children: React.ReactNode;
}
```

#### Variant Styles

| Variant | Background | Border | Shadow |
|---------|------------|--------|--------|
| default | `background.default` | none | `shadow-sm` |
| outlined | `background.default` | `border.default` | none |
| elevated | `background.default` | none | `shadow-md` |

---

## Spacing System

Based on 4px base unit.

| Token | Value | Common Usage |
|-------|-------|--------------|
| `space-0` | 0 | Reset |
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Inline spacing |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large section spacing |
| `space-12` | 48px | Page section margins |
| `space-16` | 64px | Hero spacing |

---

## Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Dialogs |

---

## Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hovers, toggles |
| `duration-normal` | 200ms | Standard transitions |
| `duration-slow` | 300ms | Complex animations |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Enter animations |
| `easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |

---

## Dark Mode Tokens

> Semantic tokens automatically adapt in dark mode.

| Light Mode | Dark Mode |
|------------|-----------|
| `background.default` → white | `background.default` → neutral.900 |
| `foreground.default` → neutral.900 | `foreground.default` → neutral.100 |
| `border.default` → neutral.200 | `border.default` → neutral.700 |

---

## Usage Example (Tailwind CSS)

```tsx
// Button component using design tokens
function Button({ variant = 'primary', size = 'md', children }) {
  return (
    <button
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-fast',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',

        // Size variants
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-base',
        size === 'lg' && 'h-12 px-5 text-lg',

        // Variant styles
        variant === 'primary' && [
          'bg-blue-500 text-white',
          'hover:bg-blue-600',
          'active:bg-blue-700',
          'focus:ring-blue-500',
        ],
        variant === 'secondary' && [
          'bg-transparent text-neutral-900 border border-neutral-200',
          'hover:bg-neutral-50',
        ],
      )}
    >
      {children}
    </button>
  );
}
```
