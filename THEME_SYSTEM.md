# Multi-Theme System Documentation

## Overview
AthenaV2 now supports multiple color themes, each with both light and dark mode variants. Users can select their preferred color theme and toggle between light/dark modes independently.

## Available Themes
1. **Green (Default)** - The original AthenaV2 theme with green accent colors
2. **Blue** - Professional blue color scheme
3. **Purple** - Modern purple/violet theme
4. **Rose** - Warm rose/pink theme
5. **Orange** - Energetic orange theme

## How It Works

### Theme Configuration
Themes are defined in individual CSS files located in `src/app/themes/`:
- `green.css` - Green theme (default)
- `blue.css` - Blue theme
- `purple.css` - Purple theme
- `rose.css` - Rose theme
- `orange.css` - Orange theme

Each CSS file contains complete color definitions for both light and dark modes using the `data-theme` attribute selector.

Theme metadata (name and label) is defined in `src/lib/theme-config.ts` for the UI.

### Theme Selector Component
Located at `src/components/theme-selector.tsx`, this component provides:
- A dropdown menu with all available color themes
- Light/Dark/System mode toggle
- Persistent theme selection (stored in localStorage)
- Dynamic theme application by setting the `data-theme` attribute

### Usage
Users can access the theme selector from the user menu dropdown in the sidebar:
1. Click on your user avatar in the sidebar footer
2. Click on the "Theme" option
3. Select your preferred color theme
4. Toggle between Light/Dark/System modes

### CSS Implementation
The themes work using CSS attribute selectors:
- `[data-theme="green"]` for green theme
- `[data-theme="blue"]` for blue theme
- etc.

Combined with the `.dark` class from next-themes for light/dark mode switching. All theme CSS files are imported in `src/app/globals.css`.

## Adding New Themes

To add a new theme:

1. **Create a new CSS file** in `src/app/themes/your-theme.css`:

```css
/* Your Theme - Light Mode */
:root[data-theme="your-theme"] {
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... define all color tokens ... */
}

/* Your Theme - Dark Mode */
:root[data-theme="your-theme"].dark {
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... define all color tokens ... */
}
```

2. **Import the CSS file** in `src/app/globals.css`:
```css
@import "./themes/your-theme.css";
```

3. **Add theme metadata** to `src/lib/theme-config.ts`:
```typescript
{ name: "your-theme", label: "Your Theme Display Name" }
```

4. Use OKLCH color space for consistent, perceptually uniform colors
5. Ensure all required color tokens are defined for both modes

## Color Tokens
Each theme must define these color tokens for both light and dark modes:
- `background`, `foreground`
- `card`, `cardForeground`
- `popover`, `popoverForeground`
- `primary`, `primaryForeground`
- `secondary`, `secondaryForeground`
- `muted`, `mutedForeground`
- `accent`, `accentForeground`
- `destructive`
- `border`, `input`, `ring`
- `chart1` through `chart5`
- `sidebar*` variants (sidebar, sidebarForeground, etc.)

## Technical Details

### Color Space
All themes use OKLCH (Oklab Lightness Chroma Hue) color space for:
- Perceptually uniform color manipulation
- Better color gradients
- Consistent lightness across hues
- Modern CSS support

### State Management
- Color theme preference: localStorage (`color-theme`) → sets `data-theme` attribute on `<html>`
- Light/Dark mode: next-themes (localStorage `theme`) → adds/removes `.dark` class on `<html>`
- Changes apply immediately via CSS attribute and class selectors

### Browser Compatibility
The theme system works in all modern browsers that support:
- CSS custom properties (CSS variables)
- OKLCH color space (with fallbacks)
- localStorage API
