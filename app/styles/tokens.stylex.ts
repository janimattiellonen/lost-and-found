import * as stylex from '@stylexjs/stylex';

import { palette } from './palette.stylex';

// Layer 2 of the design system: what a colour, space or size is *for*. This is
// the layer components import; `palette.stylex.ts` holds the raw values and
// should not be imported anywhere else.
//
// Every value is the colour the running site already showed before the token
// existed, so converting a component from Tailwind classes to these tokens does
// not move any pixels. The eight deliberate exceptions are listed as numbered
// scenarios under "User-facing behaviour" in specs/15-design-system-tokens.md.
export const color = stylex.defineVars({
  textPrimary: palette.gray900,
  textSecondary: palette.gray700,
  textBody: palette.gray600,
  textMuted: palette.gray500,
  textSubtle: palette.gray400,
  textStrong: palette.black,

  surface: palette.white,
  surfaceMuted: palette.gray100,
  border: palette.gray300,
  borderSubtle: palette.gray200,

  accent: palette.blue600,
  accentHover: palette.blue700,
  accentSurface: palette.blue50,
  accentSurfaceHover: palette.blue600A04,
  accentSurfaceSelected: palette.blue600A08,
  accentBorderSubtle: palette.blue200,
  accentBorderTranslucent: palette.blue600A50,
  onAccent: palette.white,
  link: palette.blue700,

  danger: palette.red500,
  dangerHover: palette.red600,
  // The three parts of an error box. They move as a unit; splitting them is how
  // the app ended up with a green box whose border belonged to another palette.
  dangerSurface: palette.red50,
  dangerBorder: palette.red200,
  dangerText: palette.red800,
  // Error text outside a box, on a white page — the owner link page's failure
  // line. It is `red600` like `dangerHover` and not `red800` like `dangerText`,
  // because a lone red sentence needs less weight than one carried on a red
  // surface. Two names for one value, because the two roles can move apart.
  dangerStrong: palette.red600,
  dangerSurfaceHover: palette.red500A04,
  dangerBorderTranslucent: palette.red500A50,
  warning: palette.amber700,
  success: palette.green700,
  // The hover of a green button. It shares `green800` with `successText`
  // below by coincidence, not by rule: one is a background under white text,
  // the other is text on a pale green surface.
  successHover: palette.green800,
  successSurface: palette.green50,
  successBorder: palette.green200,
  successText: palette.green800,
  // A second, dimmer warning colour, for a value the disc parser guessed at
  // rather than something the reader must act on. Deliberately not `warning`.
  caution: palette.caution700,
});

// The disc list's table is a dark island in an otherwise light app, and the
// inline forms that open inside it share its surface. These exist as their own
// group because the same Tailwind class means two different things either side
// of that line: `text-gray-300` is a faint grey on the light pages but the
// normal text colour here.
export const dark = stylex.defineVars({
  surface: palette.dark900,
  cell: palette.dark800,
  cellHover: palette.dark700,
  cellSorted: palette.dark600,
  rowAlt: palette.dark500,
  // Three light greys live on this one surface and are deliberately kept apart,
  // because unifying them would change what is on screen: the column headings
  // are white, the table body is #ddd, and the inline forms and row icons use
  // Tailwind's gray300.
  headingText: palette.white,
  bodyText: palette.dark200,
  text: palette.gray300,
  textHover: palette.white,
  border: palette.gray300,
});

// The disc table's row actions are colour-coded so an admin can hit the right
// one at a glance on a phone, which makes the hue part of the label rather than
// decoration. Each action has a resting and a hovered value.
export const icon = stylex.defineVars({
  delete: palette.red400,
  deleteHover: palette.red300,
  edit: palette.gray300,
  editHover: palette.white,
  returned: palette.green400,
  returnedHover: palette.green300,
  sellable: palette.sky400,
  sellableHover: palette.sky300,
  retrieval: palette.orange400,
  retrievalHover: palette.orange300,
  course: palette.violet400,
  courseHover: palette.violet300,
  info: palette.amber400,
  infoHover: palette.amber300,
  disabled: palette.gray500,
});

// Tailwind's spacing step is 0.25rem, so `mb-4` is 16px. These names map onto
// the steps the pages actually use.
export const space = stylex.defineVars({
  xs: '4px', // 1
  sm: '8px', // 2
  smd: '12px', // 3 — sits between `sm` and `md`, which is what the name means
  md: '16px', // 4
  lg: '24px', // 6
  xl: '32px', // 8
  xxl: '48px', // 12
});

// Sizes match Tailwind's type scale. `sizeLg` used to hold 1.25rem, which is
// Tailwind's `text-xl` rather than its `text-lg` — the name was wrong, so the
// scale is shifted one step and `sizeXxl` keeps the old `sizeXl` value.
export const font = stylex.defineVars({
  family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  sizeXs: '0.75rem', // text-xs
  sizeSm: '0.875rem', // text-sm
  sizeMd: '1rem', // text-base
  sizeLg: '1.125rem', // text-lg
  sizeXl: '1.25rem', // text-xl
  sizeXxl: '1.75rem', // no Tailwind step; the page headings' size
  weightRegular: '400',
  weightBold: '700',
});

// Shared control metrics, so a text field, a combobox and a row of radios line
// up to the same height when they sit side by side in a filter row.
export const size = stylex.defineVars({
  control: '40px',
});

export const radius = stylex.defineVars({
  sm: '4px', // Tailwind's `rounded`
  md: '8px',
  lg: '12px',
});
