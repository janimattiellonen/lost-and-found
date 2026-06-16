import * as stylex from '@stylexjs/stylex';

// Base design tokens for the StyleX migration. Extend these as components move
// off MUI/Tailwind/Emotion. Keep values aligned with the current visual design
// so migrated components look unchanged.
export const color = stylex.defineVars({
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  accent: '#1976d2', // matches the current MUI primary
  accentHover: '#1565c0',
  onAccent: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',
  border: '#d1d5db',
  danger: '#d32f2f',
});

export const space = stylex.defineVars({
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
});

export const font = stylex.defineVars({
  family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  sizeSm: '0.875rem',
  sizeMd: '1rem',
  sizeLg: '1.25rem',
  sizeXl: '1.75rem',
  weightRegular: '400',
  weightBold: '700',
});

export const radius = stylex.defineVars({
  sm: '4px',
  md: '8px',
  lg: '12px',
});
