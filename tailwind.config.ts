import type { Config } from 'tailwindcss';

// Layer 3 of the design system: the same names the StyleX tokens use, available
// as Tailwind classes, so a page that has not been converted yet can say
// `text-fg-muted` instead of `text-gray-500`. A page written that way converts
// to StyleX by renaming the class to `color.textMuted`, with no judgement call
// about what the grey was for.
//
// The values below repeat `app/styles/palette.stylex.ts`. They have to: StyleX
// hashes the CSS variable names it emits (`palette.gray500` becomes
// `--x1jb24h0`), so a config cannot write `var(--gray500)`, and StyleX rejects
// imported constants inside `defineVars`, so the two cannot share one module.
// `app/styles/palette.test.ts` fails the build when the copies drift apart.
//
// `extend` rather than a replacement for `theme.colors`: the stock palette stays
// reachable, because removing it would move all 37 unconverted components at
// once. See specs/15-design-system-tokens.md.
const palette = {
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  black: '#000000',

  red300: '#fca5a5',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',

  amber300: '#fcd34d',
  amber400: '#fbbf24',
  amber700: '#b45309',

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
    extend: {
      colors: {
        fg: {
          primary: palette.gray900,
          secondary: palette.gray700,
          body: palette.gray600,
          muted: palette.gray500,
          subtle: palette.gray400,
          strong: palette.black,
          'on-accent': palette.white,
          link: palette.blue700,
        },
        surface: {
          DEFAULT: palette.white,
          muted: palette.gray100,
          accent: palette.blue50,
          'accent-hover': palette.blue600A04,
          'accent-selected': palette.blue600A08,
          'danger-hover': palette.red500A04,
        },
        line: {
          DEFAULT: palette.gray300,
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
          'text-hover': palette.white,
          border: palette.gray300,
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
    },
  },
  plugins: [],
} satisfies Config;
