# Tokens Map — Pages & CSS Architecture

Quick reference for locating sections across the multi-page design system.

## Page Structure

| Page | File | Sections |
|------|------|----------|
| Landing | `index.html` | Navigation grid, hero, footer |
| Colors | `pages/colors.html` | Backgrounds, Labels, Fills, Separators, System Colors, Tint Alternatives, Grays, Semantic, On-Colors |
| Layout | `pages/layout.html` | Shadows, Spacing & Radius, Concentric Corner Radius |
| Components | `pages/components.html` | Button, Input, Markdown |
| Typography | `pages/typography.html` | Display / Besley, Body / Figtree, Mono / IBM Plex |
| Visual Direction | `pages/visual-direction.html` | Liquid Glass, Glass + Dot, Dot Pattern |
| Motion | `pages/motion.html` | Motion Tokens, Live Demos |
| Reference | `pages/reference.html` | All Tokens (auto-generated table) |

## CSS Architecture — `styles.css`

| Block | Contents |
|-------|----------|
| `:root` / `[data-theme="light"]` | Light theme tokens: colors, spacing, radius, motion, fonts, type scale sizes, text shadow |
| `[data-theme="dark"]` | Dark theme overrides: colors, shadows, glass, text shadow |
| Typography utilities | `.text-overline` — reusable type scale class |
| Tags | `.tag` variants (iOS, Android, Web, All, tint, destructive, fill, outline) |
| Layout | `.page-layout`, `.container`, `.sidebar`, responsive breakpoints |
| Cards & containers | `.card`, `.context-card`, `.glass-card` |
| Color swatches | `.swatch-row`, `.color-chip`, `.gray-strip` |
| Prose / markdown | `.prose` element styles |
| Glass effects | `.glass-card`, `.glass-stage`, `.glass-glow` |
| Dot pattern | `.dot-grid`, `.dot-stage`, `.dot-state-*`, `.planar-stage`, `.planar-modes` |
| Buttons | `.btn` variants, sizes, states |
| Footer | `.footer` |
| Landing page | `.landing-container`, `.landing-card`, `.landing-grid` |
| Motion demos | `.motion-demo-card`, `.motion-spring-*`, `.motion-curve-*` |
| Type samples | `.type-sample-*` (one class per scale step) |

## Shared Assets

All pages share:
- `styles.css` — all CSS (tokens + components)
- `scripts.js` — theme toggle, tint picker, token resolution, copy/toast, scroll spy
- `planarkit.js` — PlanarKit Canvas 2D engine (Scene class, physics, rendering, animation loop)
- Google Fonts link — Besley, Figtree, IBM Plex Mono

Page-specific inline scripts:
- `index.html` — PlanarKit full-screen background (hover field + ambient)
- `pages/visual-direction.html` — PlanarKit interactive demo (mode selector, field demos, glass+dot canvas)
- `pages/motion.html` — PlanarKit state cycle demo (idle → tap → field)

## Sidebar Navigation

Each page (except landing and reference) has a sidebar with section links.
Links use `<a class="sidebar-link" href="#section-id">Label</a>` inside `<div class="sidebar-group">`.

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `max-width: 900px` | Sidebar hides, full-width layout |
| `max-width: 720px` | Grids collapse from 2-col to 1-col |
| Container | `max-width: var(--containerMaxWidth)` (1120px) with auto margins |
