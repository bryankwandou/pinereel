# PineReel -- "Alpine Editorial Utility" Design System

Single source of truth for PineReel visual tokens, component behavior, accessibility baselines, and Web3 UX conventions. All CSS tokens live in `app/tokens.css`.

## 1. Visual Theme and Atmosphere

- **Direction**: Alpine Editorial Utility. Warm birch paper paired with crisp structural hairlines, a single deep-pine action accent, and calm monospace safety telemetry.
- **Core Product Thesis**: Inspect untrusted video links before a single frame loads, strip tracking and ad redirects, play cleanly without overlays, cache videos into a zero-signal mountain offline vault, and anchor SHA-256 safety receipts on Solana Devnet.
- **Never Reintroduce**:
  - Purple-to-blue hero gradients or gradient headline text
  - Colored glow box-shadows (`box-shadow: 0 0 40px ...`)
  - Glassmorphism panels (`backdrop-filter`) outside the sticky top bar
  - Uniform `2rem` card corner radii across unrelated surfaces
  - Emoji characters or unicode symbols inside production UI copy
  - Auto-opening wallet popups on initial page load

## 2. Color Palette and Roles

### Light Mode (Birch Paper)
| Token | Value | Role |
|---|---|---|
| `--pr-paper` | `#FAF8F4` | Page background ground |
| `--pr-raised` | `#FFFFFF` | Cards, player frame, controls |
| `--pr-sunken` | `#EFECE4` | Table headers, wells, inset strips |
| `--pr-rule` | `#DFDBD0` | 1px hairlines |
| `--pr-rule-2` | `#C8C2B3` | Interactive borders |
| `--pr-ink` | `#0E1311` | Primary text (17.68:1 on paper) |
| `--pr-ink-2` | `#313A36` | Secondary body copy (11.07:1 on paper) |
| `--pr-ink-3` | `#4F5A55` | Captions, table headers (6.08:1 on sunken) |
| `--pr-ink-4` | `#5E6964` | Muted placeholders and inactive controls (5.38:1 on paper) |
| `--pr-signal` | `#0E5A3E` | Single action accent (7.76:1 on paper, 8.23:1 vs white) |
| `--pr-signal-ink` | `#FFFFFF` | Text on signal surface |
| `--pr-signal-wash` | `#E4F0EA` | Active filter chip wash |

### Dark Mode (Alpine Slate)
| Token | Value | Role |
|---|---|---|
| `--pr-paper` | `#0B0F0E` | Deep slate ground (never pure `#000`) |
| `--pr-raised` | `#131917` | Elevated panels |
| `--pr-sunken` | `#18201D` | Table headers and recessed blocks |
| `--pr-rule` | `#242E2A` | 1px hairlines |
| `--pr-rule-2` | `#36443F` | Control borders |
| `--pr-ink` | `#F2F1EC` | Soft birch ink (17.05:1 on paper, avoids halation) |
| `--pr-ink-2` | `#C5CCC8` | Secondary copy (11.80:1 on paper) |
| `--pr-ink-3` | `#929E98` | Labels (5.99:1 on sunken) |
| `--pr-ink-4` | `#7A8680` | Disabled/placeholder |
| `--pr-signal` | `#33C288` | High-legibility alpine emerald (8.46:1 on paper) |
| `--pr-signal-ink` | `#08140F` | Text on signal button (8.25:1) |

### Semantic Status and Source Data Palette
- Status (`good`, `warn`, `bad`, `info`) is reserved strictly for threat verdicts (`SAFE`, `CAUTION`, `BLOCKED`, `ATTESTED`) and network state.
- Source category colors (`youtube` crimson, `x` cobalt, `instagram` plum, `vault` alpine teal) label source badges and charts only, never action buttons.

## 3. Typography Rules

- **Display**: `Lora` (serif editorial authority), `clamp(2.25rem, 4.6vw, 4.1rem)`, tight tracking `-0.025em`, `text-wrap: balance`.
- **UI Sans**: `Plus Jakarta Sans`, body `16px`, line height `1.58`, reading measure `65ch`.
- **Telemetry Mono**: `JetBrains Mono`, `font-variant-numeric: tabular-nums lining-nums` for URLs, byte counts, safety scores, and Solana signatures.
- **CJK Overrides**: `:lang(ja)` resets negative tracking to `0`, raises line-height to `1.2`, and disables synthetic italic (`font-synthesis: none`).

## 4. Component Stylings

- **Buttons**: Single primary solid `--pr-signal` per viewport area; secondary `--pr-raised` with `--pr-rule-2`; ghost transparent. Loading preserves button width.
- **Inputs**: Visible `<label>` above field; `font-size: 16px` to prevent mobile zoom; validation runs on blur/submit.
- **Radius by Role**: Pills/badges `999px`, inputs/buttons `6px`, panels `10px`, dialogs `14px`, tables `6px`.

## 5. Layout Principles

- Sticky header `z-index: 50`, reading progress `60`, skip link `70`, popovers `80`, dialogs `90`, toasts `100`.
- Never write universal child selectors (`.wrap > *`) setting `position` or `z-index`.
- Logical CSS properties (`inline-size`, `margin-inline`, `inset-inline-start`) for clean layout alignment.

## 6. Depth and Elevation

- Subtle paper grain (`opacity: 0.032` light / `0.022` dark, `pointer-events: none`) plus single viewport radial wash under `8%` accent opacity.
- Neutral two-layer warm ink shadows in light mode; surface luminance steps in dark mode.

## 7. Do's and Don'ts

- **Do**: Expose raw safety scan evidence (redirect hops, stripped trackers, SHA-256 hash) clearly.
- **Don't**: Auto-connect wallets, mask failed network requests as zero results, or place placeholder copy in production views.

## 8. Responsive Behavior

- Tested cleanly at `360px`, `390px`, `768px`, and `1440px` with zero horizontal overflow.
- `ResizeObserver` collapses desktop navigation into mobile drawer automatically when multilingual labels expand.
- `min-height: 100svh` for full-height bands; 3D canvas pauses `frameloop` outside viewport or hidden tabs and renders an informative static frame under `prefers-reduced-motion: reduce`.

## 9. Agent Prompt Guide

- Import tokens from `app/tokens.css`; never hardcode UI hex colors outside literal exceptions (`viewport.themeColor`, `global-error.tsx`, SVG `<mask>`, and walkthrough cursor).
- Run `npm run check:locales`, `npm run typecheck`, `npm run build`, and `npm run audit:design` after UI edits.

