# FORK Design System

Cross-platform design reference for the FORK product family — iOS, Android, and Web.

**Live reference** — open `index.html` in a browser. No build tools, no dependencies beyond Google Fonts.

## What this is

A single-source-of-truth design system documenting every token, component, and interaction pattern used across FORK products. Engineers on any platform open this reference and get exact values: hex colors, pixel sizes, spring constants, corner radii.

## Structure

```
index.html              Landing page — navigation grid + PlanarKit dot pattern
styles.css              All CSS: tokens (light + dark), components, layout, prose
scripts.js              Theme toggle, tint picker, token resolution, copy, scroll spy
planarkit.js            Dot pattern physics engine (Canvas 2D)
pages/
  colors.html           Backgrounds, labels, fills, separators, system colors, tints, grays, semantic, on-colors
  layout.html           Shadows, spacing & radius, concentric corner radius
  components.html       Button, input, switch, dropdown, avatar, badge, tag, tabs, list, card, modal, empty state, skeleton, markdown
  chat.html             Message bubbles, rich content, typing indicators, conversation patterns
  typography.html       Display / Besley, body / Figtree, mono / IBM Plex — full type scale
  visual-direction.html Liquid Glass, frosted fallback, glass + dot interaction, PlanarKit dot pattern
  motion.html           Spring presets, press/release asymmetry, rubber banding, dot effects
  reference.html        Auto-generated all-tokens table with live-resolved values
```

## Quick start

```bash
open index.html
# or
python3 -m http.server 8000 && open http://localhost:8000
```

Toggle theme with the switch in the top-right. Swap tint with the color dots next to it.

## Design DNA

FORK sits at the intersection of four traditions:

- **Braun / Dieter Rams** — warm neutrals (#1A1A18, not #000), minimal decoration
- **Apple HIG** — material honesty, semantic color, glass tiers
- **Teenage Engineering** — mono overline labels, dot grid texture, orange tint
- **Industrial design** — spring motion, rubber banding, haptic feedback

## Key tokens

| Token | Light | Dark |
|-------|-------|------|
| `--label` | `#1A1A18` | `#F5F5F2` |
| `--systemBackground` | `#FFFFFF` | `#1A1A18` |
| `--tint` | `#E86420` | `#F07030` |
| `--fontDisplay` | Besley | Besley |
| `--fontBody` | Figtree | Figtree |
| `--fontMono` | IBM Plex Mono | IBM Plex Mono |

Full token table: open `pages/reference.html` or see `styles.css` `:root` block.

## Contributing

See [commit and PR conventions](#commit-conventions) below.

### Commit conventions

Every commit must clearly describe **what changed, where, and why**.

**Format:**

```
<type>(<scope>): <short summary>

<body — what changed and why>

<affected files>
```

**Types:**

| Type | Use |
|------|-----|
| `token` | Adding, changing, or removing a design token |
| `component` | New component or changes to an existing one |
| `fix` | Bug fix — broken layout, wrong value, missing state |
| `docs` | Documentation, usage notes, platform notes |
| `refactor` | Code restructuring without visual changes |

**Scope** = the area affected: `colors`, `typography`, `button`, `card`, `tag`, `motion`, `glass`, `layout`, `reference`, `landing`, `chat`, etc.

**Examples:**

```
token(colors): add --systemIndigo for new profile themes

Added --systemIndigo to both light (#5856D6) and dark (#7B79FF) themes.
Updated allTokens array in scripts.js.
Added swatch in colors.html system-colors section.

Files: styles.css, scripts.js, pages/colors.html
```

```
component(tag): formalize tag component, migrate from platform-badge

Renamed .platform-badge → .tag across all files.
Added semantic variants: --tint, --destructive, --fill, --outline.
Added Tag section to components.html with demo, specs, usage, platform notes.

Files: styles.css, scripts.js, pages/*.html, SKILL.md, tokens-map.md
```

```
fix(button): restore focus-visible ring for keyboard accessibility

.btn:focus-visible had outline:none with no replacement.
Added tint-colored box-shadow ring matching input focus pattern.

Files: styles.css
```

### Pull request conventions

PR title: same format as commit — `<type>(<scope>): <summary>`

PR body must include:

```markdown
## What changed
- Bullet list of every change, grouped by file or area

## Why
- What problem this solves or what it improves

## Checklist
- [ ] Both themes tested (light + dark)
- [ ] Tint swap tested (switch to Indigo)
- [ ] Responsive tested (900px + 720px breakpoints)
- [ ] No hardcoded hex/px values — uses tokens
- [ ] Every new/changed section has: demo, usage, platform notes
- [ ] New tokens added to allTokens array in scripts.js
- [ ] Sidebar links updated for new sections
```

### Rules

- One logical change per commit. Don't mix a token change with a component refactor.
- Body is mandatory for anything beyond trivial typo fixes.
- List affected files at the end of the body.
- If a commit changes tokens: specify old → new values.
- If a commit changes a component: list which states/variants were affected.
- PR description must explain **why**, not just **what**. "Updated padding" is not enough. "Reduced card-header padding from 24px to 16px because icon felt disconnected from card edge at previous spacing" is.
