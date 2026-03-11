# FORK Design Language

Cross-platform design language for the FORK product family (iOS + Android + Web).

**This repository has one purpose: maintain the design language. Always use the `/designer` skill for every task.**

## Structure

```
.
├── index.html              ← Landing page with navigation grid
├── styles.css              ← Shared CSS (tokens, components, layout)
├── scripts.js              ← Shared JS (theme, tint, resolve, copy, scroll spy)
├── pages/
│   ├── colors.html         ← Backgrounds, labels, fills, separators, system colors, tints, grays, semantic, on-colors
│   ├── layout.html         ← Shadows, spacing & radius, concentric corner radius
│   ├── components.html     ← Button, input, markdown
│   ├── messages.html       ← Chat + terminal side by side: input, output, rich content, agent, sessions
│   ├── typography.html     ← Display / Besley, body / Figtree, mono / IBM Plex
│   ├── visual-direction.html ← Liquid glass, glass + dot, dot pattern
│   ├── motion.html         ← Motion tokens
│   └── reference.html      ← All tokens table (auto-generated)
├── CLAUDE.md               ← This file
└── .claude/
    └── skills/
        └── designer/
            ├── SKILL.md                    ← Design system skill (start here)
            └── references/
                ├── design-quality.md       ← Typography, contrast, composition, surface, motion
                ├── js-api.md               ← JS functions, localStorage, tint picker, allTokens
                └── tokens-map.md           ← Section IDs, CSS line ranges, sidebar, breakpoints
```

## Rules

- Every task in this repo is design language work — invoke the designer skill, follow its Role and Design DNA sections
- **Challenge first, implement second** — every request (from the user OR self-generated) must be checked against the Design DNA before writing code. If it conflicts, push back with a specific principle and alternatives. If it's ambiguous, present trade-offs. Silent compliance is a bug. This applies equally to user requests and to your own ideas during refactoring/fixing.
- No build tools, no external CSS/JS beyond Google Fonts — shared `styles.css` and `scripts.js` are local files
- All content in English
- Prefer solving problems with existing tokens over creating new ones
- Push back on requests that conflict with the design DNA — propose alternatives
- Run the pre-flight checklist (in SKILL.md) before considering any change done

## Navigation architecture

- **Top nav bar** (horizontal, sticky): Page links across all pages + tint picker + theme toggle
- **Sidebar** (per page): Sub-section links within each page, visible at >900px
- **Landing page** (`index.html`): Card grid linking to each page

## Quick reference

- Open: `open index.html`
- Toggle theme: switch in top-right corner
- Swap tint: dot picker in header (Orange, Coral, Indigo, Teal, Amber)
- Light base: `#1A1A18` / `#FFFFFF` — Dark base: `#F5F5F2` / `#1A1A18`
- Brand tint: `#E86420` (light) / `#F07030` (dark)
- Fonts: `--fontDisplay` (Besley), `--fontBody` (Figtree), `--fontMono` (IBM Plex Mono)
- Type scale sizes: `--typeXlTitle2` (42px) through `--typeOverline` (11px) — always use `var(--type*)` instead of raw px
- Body default: Figtree `var(--typeFootnote)` (14px) — all font sizes reference the type scale tokens
