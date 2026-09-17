import type { Config } from 'tailwindcss';

// Layer 3 of the design system: the same names the StyleX tokens use, available
// as Tailwind classes, so a page that has not been converted yet can say
// `text-fg-muted` instead of `text-gray-500`. A page written that way converts
// to StyleX by renaming the class to `color.textMuted`, with no judgement call
// about what the grey was for.
//
// Every name is grouped by what the colour paints — `fg` for text, `surface` for
// a background, `line` for a border — with the solid brand fills (`accent`,
// `danger`, `success`) as their own groups. Keep new entries in that shape, or a
// class stops mapping onto exactly one token.
//
// Most values are Tailwind 3.3.3 defaults; the `dark*` greys and `caution700`
// are not, and are commented as such in `palette.stylex.ts`.
//
// The values below repeat `app/styles/palette.stylex.ts`. They have to: StyleX
// hashes the CSS variable names it emits (`palette.gray500` becomes
// `--x1jb24h0`), so a config cannot write `var(--gray500)`, and StyleX rejects
// imported constants inside `defineVars`, so the two cannot share one module.
// `app/styles/palette.test.ts` fails the build when the copies drift apart.
//
// `theme.colors` is replaced rather than extended, so Tailwind's stock palette is
// gone and a semantic name is the only way to say a colour here. That was only
// safe once every component had been converted; the details are at the `theme`
// key below. See specs/15-design-system-tokens.md.
const palette = {
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

  // Not Tailwind: the parser's 'unsure about this value' olive. See
  // palette.stylex.ts for why it was not rounded to amber700.
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

  dark200: '#dddddd',
  dark500: '#3f3c3c',
  dark600: '#383838',
  dark700: '#333333',
  dark800: '#292929',
  dark900: '#212121',
} as const;

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // `colors` outright, not `extend.colors`: the stock palette is gone, so
    // `text-gray-500` no longer compiles and a semantic name is the only way to
    // say a colour. Every component was converted first — see the spec's "Rules
    // & constraints" — so this closes a hole rather than breaking anything.
    // Tailwind's own defaults that pointed into the stock palette are carried
    // over explicitly below.
    colors: {
      // Not colours so much as the absence of one; Preflight and several
      // utilities expect these to exist.
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      fg: {
        primary: palette.gray900,
        secondary: palette.gray700,
        body: palette.gray600,
        muted: palette.gray500,
        subtle: palette.gray400,
        strong: palette.black,
        'on-accent': palette.white,
        link: palette.blue700,
        danger: palette.red800,
        success: palette.green800,
      },
      surface: {
        DEFAULT: palette.white,
        muted: palette.gray100,
        accent: palette.blue50,
        'accent-hover': palette.blue600A04,
        'accent-selected': palette.blue600A08,
        'danger-hover': palette.red500A04,
        danger: palette.red50,
        success: palette.green50,
      },
      line: {
        DEFAULT: palette.gray300,
        subtle: palette.gray200,
        success: palette.green200,
        danger: palette.red200,
        accent: palette.blue600,
        'accent-subtle': palette.blue200,
        'accent-translucent': palette.blue600A50,
        'danger-translucent': palette.red500A50,
      },
      accent: {
        DEFAULT: palette.blue600,
        hover: palette.blue700,
      },
      danger: {
        DEFAULT: palette.red500,
        hover: palette.red600,
        strong: palette.red600,
      },
      warning: palette.amber700,
      caution: palette.caution700,
      success: {
        DEFAULT: palette.green700,
        hover: palette.green800,
      },
      // The disc table's dark island. `text-gray-300` is a faint grey on the
      // light pages but the normal text colour here, which is why these are
      // their own names rather than the stock greys.
      dark: {
        surface: palette.dark900,
        cell: palette.dark800,
        'cell-hover': palette.dark700,
        'cell-sorted': palette.dark600,
        'row-alt': palette.dark500,
        'heading-text': palette.white,
        'body-text': palette.dark200,
        text: palette.gray300,
        'text-subtle': palette.gray400,
        'text-hover': palette.white,
        border: palette.gray300,
        'danger-text': palette.red300,
      },
      // The disc table's row actions are colour-coded so an admin can hit the
      // right one at a glance, which makes the hue part of the label.
      icon: {
        delete: palette.red400,
        'delete-hover': palette.red300,
        edit: palette.gray300,
        'edit-hover': palette.white,
        returned: palette.green400,
        'returned-hover': palette.green300,
        sellable: palette.sky400,
        'sellable-hover': palette.sky300,
        retrieval: palette.orange400,
        'retrieval-hover': palette.orange300,
        course: palette.violet400,
        'course-hover': palette.violet300,
        info: palette.amber400,
        'info-hover': palette.amber300,
        disabled: palette.gray500,
      },
    },
    // Preflight and the bare `border` utility read `borderColor.DEFAULT`, which
    // in Tailwind's own theme is `gray200`. That name no longer exists here, so
    // the value is carried over by hand — it is the same `gray200` the eight
    // bare `border` utilities in this app have always drawn. Spreading `colors`
    // keeps `border-line` and the rest working.
    borderColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: palette.gray200,
    }),
    extend: {},
  },
  plugins: [],
} satisfies Config;
