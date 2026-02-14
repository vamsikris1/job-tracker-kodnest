# KodNest Premium Build System

A premium SaaS design system built with calm, intentional, and coherent design principles. This system provides a complete foundation for building professional B2C products.

## Design Philosophy

- **Calm**: No flashy animations or distracting elements
- **Intentional**: Every element serves a purpose
- **Coherent**: Consistent patterns throughout
- **Confident**: Clear hierarchy and generous spacing

## Color System

The system uses a maximum of 4 colors:

- **Background**: `#F7F6F3` (off-white)
- **Primary Text**: `#111111` (near black)
- **Accent**: `#8B0000` (deep red)
- **Success**: `#4A6741` (muted green)
- **Warning**: `#B8860B` (muted amber)

## Typography

- **Headings**: Serif font (Georgia/Times New Roman) - large, confident, generous spacing
- **Body**: Clean sans-serif (system fonts) - 16-18px, line-height 1.6-1.8
- **Text Blocks**: Maximum width of 720px for optimal readability

## Spacing System

Consistent 8px scale:
- `--space-xs`: 8px
- `--space-sm`: 16px
- `--space-md`: 24px
- `--space-lg`: 40px
- `--space-xl`: 64px

## Layout Structure

Every page follows this structure:

1. **Top Bar**: Project name (left), Progress indicator (center), Status badge (right)
2. **Context Header**: Large serif headline + 1-line subtext
3. **Primary Workspace** (70% width): Main product interaction area
4. **Secondary Panel** (30% width): Step explanation, copyable prompt, action buttons
5. **Proof Footer**: Persistent checklist with proof inputs

## Components

### Layout Components

- `top-bar`: Navigation bar with project info and status
- `context-header`: Page headline and subtext
- `primary-workspace`: Main content area
- `secondary-panel`: Sidebar with instructions and actions
- `proof-footer`: Fixed footer with checklist

### UI Components

- `btn`: Buttons (primary, secondary, tertiary)
- `card`: Content containers with subtle borders
- `input`: Form inputs with clean styling
- `badge`: Status indicators
- `empty-state`: Empty state messaging
- `error-state`: Error messaging with solutions

## Usage

Include the main stylesheet in your HTML:

```html
<link rel="stylesheet" href="design-system/kodnest-design-system.css">
```

Or import in your CSS:

```css
@import url('./design-system/kodnest-design-system.css');
```

## File Structure

```
design-system/
├── base/
│   ├── tokens.css          # Design tokens (colors, typography, spacing)
│   └── reset.css           # Base reset and normalization
├── components/
│   ├── layout/
│   │   ├── top-bar.css
│   │   ├── context-header.css
│   │   ├── primary-workspace.css
│   │   ├── secondary-panel.css
│   │   └── proof-footer.css
│   └── ui/
│       ├── button.css
│       ├── card.css
│       ├── input.css
│       ├── badge.css
│       ├── empty-state.css
│       └── error-state.css
├── layout/
│   └── main-layout.css     # Main layout structure
├── kodnest-design-system.css  # Main import file
├── example.html            # Example implementation
└── README.md               # This file
```

## Component Examples

### Button

```html
<button class="btn btn--primary">Primary Action</button>
<button class="btn btn--secondary">Secondary Action</button>
<button class="btn btn--tertiary">Tertiary Action</button>
```

### Card

```html
<div class="card">
    <div class="card__header">
        <h3 class="card__title">Card Title</h3>
        <p class="card__subtitle">Card subtitle</p>
    </div>
    <div class="card__body">
        Card content goes here.
    </div>
</div>
```

### Input

```html
<div class="input-group">
    <label class="input-label">Label</label>
    <input type="text" class="input" placeholder="Placeholder">
    <span class="input-help">Help text</span>
</div>
```

## Transitions

All interactions use subtle transitions:
- Duration: 150-200ms
- Easing: ease-in-out
- No bounce, no parallax effects

## Browser Support

Modern browsers with CSS custom properties support (all current browsers).
