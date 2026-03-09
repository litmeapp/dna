# JavaScript API & Interactive Systems

All JS lives in `scripts.js`, loaded by every page via `<script src="scripts.js">`.
No frameworks, no build tools.

## localStorage Keys

| Key | Values | Purpose |
|-----|--------|---------|
| `te-theme` | `"light"` / `"dark"` | Persisted theme choice |
| `te-tint` | Preset name (e.g. `"Orange"`) | Persisted tint choice |

## Tint Picker System

Five swappable brand tints. Each preset has light/dark hex pairs:

```js
const tintPresets = [
  { name: 'Orange',  light: '#E86420', dark: '#F07030' },  // default
  { name: 'Coral',   light: '#E05248', dark: '#F06060' },
  { name: 'Indigo',  light: '#5856D6', dark: '#7B79FF' },
  { name: 'Teal',    light: '#2CA898', dark: '#38C8B8' },
  { name: 'Amber',   light: '#CC8510', dark: '#E8A028' },
];
```

### Functions

| Function | Purpose |
|----------|---------|
| `buildTintPicker()` | Renders `.tint-dot` elements into `#tint-picker` container in header |
| `setTint(name)` | Updates `--tint` and `--selection` on `:root`, saves to localStorage, refreshes dots |
| `hexToRgb(hex)` | Converts `#RRGGBB` → `"r, g, b"` string for `rgba()` construction |

### Adding a New Tint Preset

1. Add entry to `tintPresets` array with `name`, `light`, `dark` hex values
2. Add matching CSS token in `:root` and `[data-theme="dark"]` (e.g. `--tintNewName`)
3. Add swatch in the Tint Alternatives section (`#tint-alternatives`)

### Selection Token Update

When tint changes, `--selection` is recalculated:
- Light: `rgba(r, g, b, 0.14)`
- Dark: `rgba(r, g, b, 0.18)`

## Theme Toggle

| Function | Purpose |
|----------|---------|
| `toggleTheme()` | Flips `data-theme` attribute on `<html>`, saves to localStorage, rebuilds tint picker, resolves all tokens |

## Token Resolution

Elements with `data-resolve="--tokenName"` get their `textContent` auto-filled with the resolved CSS value.

| Function | Purpose |
|----------|---------|
| `resolveVar(name)` | Reads computed CSS value. Returns `rgba(...)` as-is, converts `rgb()` to hex, uppercases hex |
| `rgbToHex(rgb)` | Converts `rgb(r, g, b)` → `#RRGGBB` |
| `resolveAll()` | Iterates all `[data-resolve]` elements, updates their text content |

### Usage in HTML

```html
<span class="swatch-value" data-resolve="--systemBackground"></span>
<!-- Renders as: #FFFFFF (light) or #1A1A18 (dark) -->
```

## Copy & Toast

| Function | Purpose |
|----------|---------|
| `copyColor(el, varName)` | Resolves token value, copies to clipboard, shows toast |
| `showToast(val)` | Shows `#toast` element with "Copied {val}", auto-hides after 1500ms |

### Usage in HTML

```html
<div class="swatch-row" onclick="copyColor(this, '--systemRed')">
```

## All Tokens Table

Generated dynamically by `buildTable()` from the `allTokens` array.

### `allTokens` Structure

```js
const allTokens = [
  { section: 'Section Name', tokens: ['--tokenA', '--tokenB'] },
  // ...
];
```

Current groups: Backgrounds (Base, Elevated, Grouped, Grouped Elevated), Labels, Fills, System Colors, Grays, Tint, Tint Alternatives, Semantic, On-Colors, Border & Separators, Dot Pattern, Shadows, Spacing, Radius, Motion, Glass, Typography.

### Adding a Token to the Table

1. Find the matching group in `allTokens` by `section` name
2. Append token name to the `tokens` array
3. If new group needed, add a new `{ section, tokens }` object

### Alpha Detection

Tokens containing `Fill`, or named `--separator`, `--border`, `--selection`, `--skeleton`, or starting with `--dot` get a `.checkerboard` background in the table to visualize transparency.

## Scroll Spy

IIFE at bottom of script. Watches scroll position, highlights matching `.sidebar-link`.

- Uses `requestAnimationFrame` for throttling
- Offset: `scrollY + 100` for early activation
- Smooth scroll on sidebar link click via `scrollIntoView({ behavior: 'smooth' })`

## Initialization Order

```
1. Restore saved theme from localStorage
2. buildTintPicker()
3. Apply saved tint (if any)
4. buildTable()         — generate All Tokens table
5. resolveAll()         — fill data-resolve elements
6. Initialize scroll spy + smooth scroll handlers
```
