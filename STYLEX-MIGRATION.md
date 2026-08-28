# UI Migration Plan — MUI / Tailwind / Emotion → StyleX

_Created: 2026-06-16_

## Goal

Phase out **MUI**, **Tailwind**, and **Emotion** in favour of **StyleX** + (Radix primitives or hand-rolled components), then upgrade **React 18 → 19** (which removing MUI unblocks). These libraries are **frozen — do not upgrade** them in the meantime (see `dependency-report.md`).

## Reference & feasibility

- **Harkkapankki** (sibling project) runs the target stack in production: **React 19 + React Router 7 + StyleX**, no MUI/Tailwind/Emotion (StyleX + custom components + some SCSS; **not** Radix).
- **Spike (2026-06-16, discarded branch):** StyleX + RR7 + **Vite 8** confirmed viable — compiles via `@stylexjs/unplugin`, dev SSR works, coexists with the current stack, typecheck/lint/build pass.
- **Two production wiring details to settle first** (not verbatim from Harkkapankki):
  1. The `/virtual:stylex.css` `<link>` is **dev-only** — guard with `import.meta.env.DEV` (the reference hardcodes it; 404s in a Vite 8 prod build).
  2. **Production CSS delivery** — the unplugin appends StyleX CSS into an existing bundler asset, but in the spike it landed in a component chunk + the SSR bundle, **not** the global stylesheet. Must consolidate into a globally-loaded asset and verify on a **Vercel preview** (local prod serve is blocked by the Supabase env dependency in the root loader).

## Inventory (69 `.ts/.tsx` files in `app/`)

| System                     | Files         | Notes                                                                                                                       |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Tailwind** (`className`) | 31            | Utility classes only; `app.css` = 3 directives + ~4 base rules; **no `@apply`**                                             |
| **Emotion** (`styled`)     | 13 (+3 infra) | ~29 `styled` defs; infra files `createEmotionCache.ts`, `entry.client.tsx`, `entry.server.tsx` get **deleted** with Emotion |
| **MUI**                    | 22            | Components + 5 icons; **no theming** (0 `ThemeProvider`/`createTheme`), only 3 `sx=`                                        |

Most files use 2–3 systems; real work unit ≈ the 31 Tailwind files.

### MUI components to replace

- **Trivial** (style a native element): `Button` (~15), `Paper` (5), `TextField` (6), `InputLabel`, `MenuItem`, `CircularProgress`, `FormControlLabel`
- **Medium**: `Checkbox`, `Radio`/`RadioGroup`, `Collapse`
- **Hard (Radix-vs-custom decision)**: `Autocomplete` (typeahead in `DiscSelector`), `Select` dropdowns
- **Icons (5)**: `Warning`, `Textsms`, `Close`, `ArrowUpward`, `ArrowDownward` → inline SVG or a light icon set

## Decisions to make

- **Radix primitives vs. hand-rolled** for `Autocomplete` + `Select` (everything else is trivially hand-rollable; Harkkapankki proves hand-rolled is viable).
- **Icon strategy** — inline SVGs vs. an icon package.
- **Token system** — define StyleX `defineVars` tokens (colors, spacing, type) up front; Harkkapankki's `*.stylex.ts` token files are a good template.

## Suggested sequence

0. **Pre-steps (cheap surface reduction):**
   - Delete `_index_old.tsx` — dead (no path, no refs); removes MUI(4)+Emotion(2)+Tailwind for free. _Pending confirmation._
   - Settle the two spike wiring gotchas; confirm StyleX CSS loads on a Vercel preview.
   - Establish StyleX token files.
1. **Leaf components** — `H2`, `H3`, `Wrapper`, `Label`, `InfoBox`, `PaperItem`, `Button`/`Paper` usages. Mechanical; proves the pipeline.
2. **Forms** — `NotifyForm`, `BinFullForm`, `sign-in`, `message-template.*` (TextField/Select/Checkbox/Radio).
3. **Charts** — `BarChart` (5 styled), `HorizontaBarChart` (4 styled); emotion-heavy but self-contained.
4. **`DiscTable.tsx`** (last, alone) — 4 MUI + 3 Emotion styled + Tailwind + `react-data-grid` in one file. The hairball.
5. **Remove** MUI/Tailwind/Emotion deps + `tailwind.config.ts` + emotion infra files + `vite.config.ts` MUI workarounds (icon ESM alias, `@mui/*` `noExternal`).
6. **React 18 → 19** — now unblocked.

## Notes / non-goals

- `react-data-grid` **stays** (it's the data grid, not part of this removal) — but it's the most entangled file.
- No test suite → every migrated component needs **visual** verification (dev + Vercel preview), not just a green build.
- Migration is incremental: StyleX coexists with MUI/Tailwind/Emotion, so this can land component-by-component over many small PRs.
