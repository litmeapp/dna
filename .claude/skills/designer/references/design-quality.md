# Design Quality Guidelines

Detailed rules for maintaining visual quality across the FORK design system.
Read this when adding or modifying tokens, components, or demos.

## Table of Contents

- [Typography Quality](#typography-quality)
- [Contrast & Accessibility](#contrast--accessibility)
- [Color Discipline](#color-discipline)
- [Composition & Layout](#composition--layout)
- [Surface & Depth](#surface--depth)
- [Motion Quality](#motion-quality)

---

## Typography Quality

### Font role boundaries

Each family has a strict role. Never cross them:

| Family | Role | Allowed contexts |
|--------|------|-----------------|
| **Besley** (serif) | Display, titles, headlines | Section titles, card headers, hero text, navigation labels |
| **Figtree** (sans) | Body, UI, interactive | Paragraphs, buttons, inputs, lists, descriptions, captions |
| **IBM Plex Mono** | Code, data, labels | Code blocks, token names, overline labels, numeric data, mono inputs |

Anti-patterns:
- Figtree for a section title (too light, no authority)
- Besley for body text (too heavy for sustained reading)
- Mono for anything longer than a label

### Optical sizing

The type scale already encodes optical compensation — respect it:

- **Large text (≥22px)**: Negative letter-spacing (-0.01em to -0.02em). Characters are large enough that default spacing feels loose.
- **Body text (15–18px)**: Zero or near-zero tracking. Default metrics work.
- **Small text (≤14px)**: Positive letter-spacing (+0.01em to +0.02em). Characters need air to stay legible.

Never override these values per-component. If a size feels wrong, use a different token from the scale.

### Vertical rhythm

All spacing between typographic elements should relate to the body line-height (18px × 1.6 = 28.8px ≈ 28px base unit).

Practical rules:
- Paragraph spacing: 1× base (28px → `--space24` or `--space32`)
- Section gap: 2–3× base (56–84px → `--space48` / `--space64`)
- Tight stacking (label + value): 0.25–0.5× base (8–14px → `--space8` / `--space12`)

Use spacing tokens, never magic numbers. If no token fits exactly, round to the nearest.

### Weight pairing

Allowed weight combinations within a single view:

| Context | Title weight | Body weight | Label weight |
|---------|-------------|-------------|-------------|
| Default | Besley 700 | Figtree 400 | Mono 600 |
| Emphasis | Besley 700 | Figtree 600 (bodySemi) | Mono 700 |

Avoid more than 3 distinct weights visible simultaneously — it fragments hierarchy.

---

## Contrast & Accessibility

### Minimum ratios (WCAG AA)

| Element | Min ratio | Tokens to check |
|---------|-----------|----------------|
| Body text (≤18px) | **4.5:1** | `--label` on `--systemBackground` |
| Large text (≥18px bold or ≥24px) | **3:1** | Title tokens on backgrounds |
| UI components (borders, icons) | **3:1** | `--separator`, `--systemGray*` on backgrounds |
| Disabled text | Exempt | `--disabledLabel` — intentionally low contrast |

### Warm palette risk

FORK's warm neutrals are close in hue to each other. Combinations that look distinct on a calibrated display may fail on cheap monitors:

- Always verify `--secondaryLabel` (#737371) on `--secondarySystemBackground` (#F5F5F2) — this is the tightest passing pair
- `--tertiaryLabel` (#BDBDBA) is below AA for body text — use only for decorative/supplementary content
- `--quaternaryLabel` (#D6D6D4) is intentionally invisible for body — use for placeholder text, ghost states only

### Dark mode gotchas

- Dark backgrounds make saturated colors feel brighter — `--tint` shifts from #E86420 → #F07030 to compensate
- `--onLight` / `--onDark` exist specifically for text on filled (colored) surfaces — never use `--label` on a tinted background

### Checking contrast

When adding or modifying color tokens:
1. Compute contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L = relative luminance
2. Check both light AND dark theme
3. Check against all background levels the token may appear on (base, elevated, grouped)

---

## Color Discipline

### Semantic > Aesthetic

Every color in FORK carries meaning:

| Token | Meaning | When to use |
|-------|---------|-------------|
| `--tint` | Primary action, brand | CTA buttons, active states, links (if not `--link`) |
| `--link` | Navigation, reference | Inline links, breadcrumbs |
| `--destructive` | Danger, deletion | Delete buttons, error states, warnings |
| `--success` | Confirmation, positive | Success messages, completed states |
| `--warning` | Caution, attention | Warning banners, validation hints |

Never use system colors (systemRed, systemBlue) directly for semantic purposes — use the semantic aliases.

### Tint vs system colors

- `--tint` = brand action color, user-swappable (5 presets)
- `--systemOrange`, `--systemBlue`, etc. = fixed reference palette, not for UI actions
- Tint alternatives (`--tintCoral`, `--tintIndigo`, etc.) = for multi-brand or feature differentiation, not interchangeable with semantic tokens

### Alpha-based tokens

Fills (`--systemFill` through `--quaternarySystemFill`) use `rgba()` with the base label color. This means:
- They automatically adapt to any background
- They must be layered on solid backgrounds (not on other alpha tokens)
- Stacking alpha fills compounds opacity — avoid nesting fills

---

## Composition & Layout

### Spatial hierarchy

Three levels of spacing create structure:

| Level | Tokens | Use |
|-------|--------|-----|
| **Macro** | `--space48`, `--space64` | Between sections, page-level breathing room |
| **Meso** | `--space16`, `--space24`, `--space32` | Between related groups (card content, form fields) |
| **Micro** | `--space4`, `--space8`, `--space12` | Within elements (icon-to-label, badge padding) |

Skipping a level creates visual tension (intentional emphasis). Mixing adjacent levels creates mud (unintentional confusion).

### Grid & alignment

- Body content: max-width 1120px, centered
- Card grids: use CSS grid or flexbox with token-based gaps
- Align text baselines, not bounding boxes — optical alignment > mathematical alignment
- Left-align body text. Center only headlines and hero content.

### One focal point

Each section should have one clear dominant element:
- A color swatch grid → the colors themselves are the focus
- A button showcase → the buttons in their default state
- A typography scale → the size progression

Supporting elements (specs, platform notes, usage lists) recede via smaller type, lower contrast (`--secondaryLabel`), and more compact spacing.

### Density calibration

- Desktop (>900px): comfortable spacing, 2-column layouts, full specs visible
- Tablet (≤900px): sidebar collapses, content fills width, maintain spacing
- Compact (≤720px): single column, reduce macro spacing by one step, stack horizontal layouts

---

## Surface & Depth

### Light model

FORK uses a top-down ambient light source:

- **Shadows** go downward, progressively larger with elevation
- **shadowSmall**: resting on surface (cards, chips)
- **shadowMedium**: lifted slightly (dropdowns, popovers)
- **shadowLarge**: floating (modals, dialogs)
- Never use shadow without context — the element must be visually "above" something

### Glass surfaces

Glass requires something behind it to refract/blur. Rules:
- Glass cards need a textured or colored background beneath them (dot grid, image, gradient)
- Glass on a flat solid background is just a semi-transparent card — no glass effect visible
- Specular highlights assume the same top-down light source as shadows
- Glass elements that overlap must share a `GlassEffectContainer` (iOS) or stack `z-index` correctly (Web)

### Fill hierarchy

Fills create subtle depth without elevation:
- `--systemFill` (9% opacity): interactive surface hover, pressed state
- `--secondarySystemFill` (6.5%): input backgrounds, secondary surfaces
- `--tertiarySystemFill` (4%): subtle grouping, divider fills
- `--quaternarySystemFill` (2%): near-invisible differentiation

Each step should be visually distinguishable on its intended background.

---

## Motion Quality

### Physics over math

- Prefer spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`) over linear or ease-in-out
- Objects accelerate naturally and overshoot slightly before settling
- Heavy objects (modals, sheets) move slower than light objects (buttons, toggles)

### Asymmetric timing

- Press: fast (0.18s) — instant feedback
- Release: slower (0.25s) — graceful return
- Enter: decelerating — arrives with confidence
- Exit: accelerating — leaves quickly, doesn't linger

### Gracetime (loading delay)

Not all loaders should appear instantly:
- **Light** tasks (< 1.2s expected): delay spinner by 1.2s, most complete before it shows
- **Regular** tasks: delay 0.28s, brief flash acceptable
- **Heavy** tasks: show immediately (0s delay)

### What not to animate

- Color theme transitions (instant swap, no crossfade)
- Token value resolution (data display, not decoration)
- First paint (content appears, doesn't fly in)
