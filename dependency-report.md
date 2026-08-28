# Dependency Report — lost-and-found

_Generated: 2026-06-15 · Updated: 2026-06-16_

**Context:** Migrated from Remix to React Router 7 (Vite framework mode). Now on React 18, MUI 5, Tailwind 3, **Vite 8**, **Node 22**, **ESLint flat config**. No test suite, so upgrade risk is harder to catch automatically — favor caution on anything with runtime impact.

## ✅ Completed (this round)

- **`@supabase/auth-helpers-remix` → `@supabase/ssr`** (PR #35). Server auth layer moved to the `cookies.getAll`/`setAll` adapter; `@supabase/auth-helpers-remix` removed.
- **`@supabase/supabase-js` 2.26.0 → 2.108.2** (PR #35) — required peer of `@supabase/ssr`.
- **Node 20 → 22** (PR #35) — `supabase-js` 2.108 eagerly builds a `RealtimeClient` that needs a native `WebSocket`, absent on Node 20. `.nvmrc` + `engines.node` bumped. ✅ Vercel project Node.js Version set to 22.x — deployed runtime matches.
- **🟢 Easy batch** (PR #36) — `@emotion/react` 11.14.0, `@emotion/styled` 11.14.1, `@react-pdf/renderer` 4.5.1, `isbot` 5.1.43, `react`/`react-dom` 18.3.1, `@types/react(-dom)` 18.3, `typescript` 5.9.3, `prettier` 3.8.4.
- **Lint stack → flat config** (PR #37) — `eslint` 8 → **9.39.4**, `@typescript-eslint/*` 7 → `typescript-eslint` 8.61.1 (meta-package), `eslint-plugin-react-hooks` 4 → 7.1.1, added `@eslint/js` + `globals`. `.eslintrc.cjs`/`.eslintignore` → `eslint.config.js`.
- **Vite 7 → 8** (PR #38) — dropped `vite-tsconfig-paths` in favour of Vite 8's native `resolve.tsconfigPaths: true`.
- **supabase CLI 1.82.5 → 2.106.0** (PR #39) — dev-only. ⚠️ `config.toml` is from the 1.82 era; validate with `supabase start` / `supabase db diff` under v2 (may prompt to update deprecated fields).
- **date-fns 2.30.0 → 4.4.0** (PR #40) — two majors, but all 6 call sites use stable-signature functions; no source changes. Verified every call-site pattern at runtime.

## 🔴 Abandoned / Deprecated (act on these)

| Package                                | Status                                | Notes                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**`@supabase/auth-helpers-remix`**~~ | ✅ Resolved (PR #35)                  | Migrated to `@supabase/ssr`.                                                                                                                                                                               |
| **`react-data-grid` 7.0.0-beta.34**    | Perpetual beta (never shipped stable) | Still actively published (latest `7.0.0-beta.59`, Dec 2025) but has been in beta for years. Used only in `app/routes/DiscTable.tsx`. Not abandoned, but pin carefully — beta-to-beta bumps can break APIs. |
| **`lodash.debounce` 4.0.8**            | Stale (last published 2022)           | Not deprecated, but a single-purpose lodash micro-package that hasn't moved. Used in `_index.tsx` (and `_index_old.tsx`). Trivially replaceable with a ~10-line debounce if you want to drop the dep.      |

## 🟡 Moderate Effort — remaining

_All done. (supabase CLI #39; ts-eslint 7→8, react-hooks 4→7, vite-tsconfig-paths, vite 7→8 — see Completed.)_

## 🧊 Frozen — slated for replacement, do NOT upgrade

**Decision (2026-06-16):** MUI, Emotion, and Tailwind are being phased out in favour of **StyleX + Radix (or custom components)**. Upgrading them first would be wasted effort — absorbing breaking changes in code that's being removed. Keep them at current working versions until replaced.

| Package                                         | Why frozen instead of upgraded                                                                                                                                                                                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@mui/material` + `@mui/icons-material`** (5) | The 5→9 jump is four majors of breaking changes (theming, styled engine, Grid) — pointless for code slated for removal. Migrate components to StyleX/Radix instead, then delete. `vite.config.ts` MUI workarounds (icon ESM alias, `@mui/*` `noExternal`) go away with it. |
| **`@emotion/*`** (11)                           | Only present because MUI 5 renders through it. Leaves automatically when MUI is removed. The 11.11→11.14 minor bump (PR #36) was free maintenance; no major bump.                                                                                                          |
| **`tailwindcss`** (3)                           | The 3→4 rewrite (CSS-first config, new engine) isn't worth it for code being replaced by StyleX. Freeze at 3.                                                                                                                                                              |

## 🔴 Significant Work — remaining

| Package   | Jump        | Why it's hard                                                                                                                                                                                                                                                                            |
| --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React** | **18 → 19** | Ecosystem ripple: drags `@types/react` 19, react-data-grid. Previously blocked by MUI 5's lack of React-19 support — **removing MUI (via the StyleX migration) unblocks this**, so do React 19 _after_ the UI migration, not before (doing it first would force a wasteful MUI upgrade). |

## 🎨 UI migration: MUI/Tailwind/Emotion → StyleX (+ Radix / custom)

Reference: the **Harkkapankki** project runs the target stack in production — **React 19 + React Router 7 + StyleX**, no MUI/Tailwind/Emotion (uses StyleX + custom components + some SCSS; **not** Radix).

**Spike result (2026-06-16, throwaway branch, discarded):** StyleX + RR7 + **Vite 8** is viable.

- ✅ Compiles on Vite 8 via `@stylexjs/unplugin` (no `vite` peer pin — rides on `unplugin@2.x`, supports Vite 8). Tokens (`defineVars` via `~/` alias), static styles, `:hover` all work.
- ✅ Dev SSR works end-to-end (atomic classes in server HTML; `/virtual:stylex.css` served); coexists with MUI/Emotion/Tailwind, so migration can be incremental.
- ✅ typecheck / lint / build pass.

**Two wiring details to settle before the real migration** (NOT verbatim from Harkkapankki):

1. The `/virtual:stylex.css` `<link>` is **dev-only** — guard with `import.meta.env.DEV` (the reference hardcodes it; it 404s in a Vite 8 prod build).
2. **Production CSS delivery unconfirmed** — the unplugin appends StyleX CSS into an existing bundler asset, but in the spike it landed in a component chunk + the SSR bundle, **not** the global stylesheet. Must consolidate into a globally-loaded asset and verify on a **Vercel preview** (local prod serve is blocked by the Supabase env dependency in the root loader).

**Sequence:** wire StyleX (settle #1/#2) → migrate components incrementally → remove MUI/Tailwind/Emotion → **then React 18→19**.

Decide separately: **Radix primitives vs. hand-rolled components** — Harkkapankki proves hand-rolled is viable; Radix is low-risk but unproven in that reference.

## 🔧 Follow-ups (from this round)

- **`eslint` 9 → 10** — blocked: `eslint-plugin-jsx-a11y` (6.10.2) and `eslint-plugin-react` (7.37.5), both latest, still cap their eslint peer at `^9`. Revisit once those ship eslint-10 support.
- **`react-hooks/set-state-in-effect`** — new react-hooks v7 rule; currently set to `warn` (7 hits across `_index.tsx`, `_index_old.tsx`, `message-template.$id.edit.tsx`, `message.send.$discId.tsx`). Fix the effects, then promote the rule to `error`.

## Recommended Sequence

1. ~~Migrate `@supabase/auth-helpers-remix` → `@supabase/ssr`~~ ✅ (PR #35, incl. supabase-js 2.108 + Node 22)
2. ~~Batch the 🟢 easy set~~ ✅ (PR #36)
3. ~~Lint stack → flat config~~ ✅ (PR #37, eslint 9 — not 10, see follow-ups)
4. ~~Vite 7→8~~ ✅ (PR #38)
5. ~~supabase CLI~~ ✅ (PR #39)
6. ~~date-fns 2→4~~ ✅ (PR #40)
7. **UI migration: MUI/Tailwind/Emotion → StyleX (+ Radix/custom)** — see the 🎨 section. Replaces the former "Tailwind 3→4" and "MUI 5→9" upgrade steps (now frozen, not upgraded).
8. **React 18→19** — last, _after_ the UI migration removes MUI (which unblocks it).
