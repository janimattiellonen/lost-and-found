import * as stylex from '@stylexjs/stylex';

// Layer 1 of the design system: raw colour values with no meaning attached,
// named after the Tailwind shade they came from. Only the shades the app
// actually shows are listed — this is an inventory of what is on screen, not a
// copy of Tailwind's palette. Values are Tailwind 3.3.3 defaults, read out of
// `tailwindcss/colors`.
//
// Components must not import this file. They import the semantic tokens in
// `tokens.stylex.ts`, which say what a colour is *for*; `palette.gray500` in a
// component leaves the next reader unable to tell muted text from a border.
//
// The same values are repeated in `tailwind.config.ts`, because StyleX hashes
// the CSS variable names it emits and rejects imported constants inside
// `defineVars`. `app/styles/palette.test.ts` is what keeps the two in step.
// See specs/15-design-system-tokens.md.
export const palette = stylex.defineVars({
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  black: '#000000',

  red50: '#fef2f2',
  red200: '#fecaca',
  red300: '#fca5a5',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red800: '#991b1b',

  // Not a Tailwind colour. The disc parser marks a value it is unsure of in this
  // dark olive, which is 27 ΔE from amber700 — a different colour, not a
  // different spelling of the same one, so it keeps its own entry rather than
  // being rounded into the palette's other warning shade.
  caution700: '#8a6100',

  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber700: '#b45309',

  green50: '#f0fdf4',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green700: '#15803d',
  green800: '#166534',

  blue50: '#eff6ff',
  blue200: '#bfdbfe',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  // Translucent accent and danger, for a tint over whatever is behind it: a
  // button's hover wash, a highlighted menu row, an outlined button's border.
  // Tailwind writes these as a `/nn` opacity suffix; StyleX needs the whole
  // value, so they are their own entries. The rgb triples are blue600 and
  // red500 — change one and its alphas change with it.
  blue600A04: 'rgba(37, 99, 235, 0.04)',
  blue600A08: 'rgba(37, 99, 235, 0.08)',
  blue600A50: 'rgba(37, 99, 235, 0.5)',
  red500A04: 'rgba(239, 68, 68, 0.04)',
  red500A50: 'rgba(239, 68, 68, 0.5)',

  sky300: '#7dd3fc',
  sky400: '#38bdf8',

  violet300: '#c4b5fd',
  violet400: '#a78bfa',

  orange300: '#fdba74',
  orange400: '#fb923c',

  // The disc table's dark surface, plus the two light greys it writes on that
  // surface. `dark200` is the table's body text and is NOT Tailwind's gray300
  // (#d1d5db) — the two are three points apart and both appear on this one
  // table, which is recorded as a gap rather than quietly unified.
  // These are not Tailwind colours and never
  // were — they were hardcoded in DiscTable.tsx. Higher number is darker.
  // dark500 keeps `rgb(63, 60, 60)` character for character: it is the only
  // non-neutral in the app and the reason for it is not recorded, so tidying it
  // into a grey would be a design decision taken by accident.
  // Written `rgb(63, 60, 60)` in DiscTable; StyleX normalises both spellings
  // to the same value. Kept as hex here so every palette entry reads alike.
  dark200: '#dddddd',
  dark500: '#3f3c3c',
  dark600: '#383838',
  dark700: '#333333',
  dark800: '#292929',
  dark900: '#212121',
});
