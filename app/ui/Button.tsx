import type { ButtonHTMLAttributes, ReactNode, JSX } from 'react';

import { Link } from 'react-router';
import * as stylex from '@stylexjs/stylex';

import { color, radius } from '~/styles/tokens.stylex';

type Variant = 'contained' | 'outlined' | 'text';
type ButtonColor = 'primary' | 'error';
type Size = 'small' | 'medium' | 'large';

// StyleX replacement for MUI <Button>, faithful to the variants/colors/sizes the
// app uses. Tokens: color.accent = MUI primary (#1976d2), color.danger = MUI
// error (#d32f2f).
const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minWidth: '64px',
    border: 'none',
    borderRadius: radius.sm,
    fontFamily: 'inherit',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s',
  },

  small: { padding: '4px 10px', fontSize: '0.8125rem' },
  medium: { padding: '6px 16px', fontSize: '0.875rem' },
  large: { padding: '8px 22px', fontSize: '0.9375rem' },

  fullWidth: { width: '100%' },

  // contained
  containedPrimary: {
    color: color.onAccent,
    backgroundColor: { default: color.accent, ':hover': color.accentHover },
    boxShadow: {
      default: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      ':hover': '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    },
  },
  containedError: {
    color: color.onAccent,
    backgroundColor: { default: color.danger, ':hover': '#c62828' },
    boxShadow: {
      default: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      ':hover': '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    },
  },

  // outlined
  outlinedPrimary: {
    color: color.accent,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(25,118,210,0.04)' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: 'rgba(25,118,210,0.5)', ':hover': color.accent },
  },
  outlinedError: {
    color: color.danger,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(211,47,47,0.04)' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: 'rgba(211,47,47,0.5)', ':hover': color.danger },
  },

  // text
  textPrimary: {
    color: color.accent,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(25,118,210,0.04)' },
  },
  textError: {
    color: color.danger,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(211,47,47,0.04)' },
  },

  disabled: {
    color: 'rgba(0,0,0,0.26)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    boxShadow: 'none',
    borderColor: 'rgba(0,0,0,0.12)',
    cursor: 'default',
    pointerEvents: 'none',
  },
});

const sizeStyle = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
} as const;

const variantStyle = {
  contained: { primary: styles.containedPrimary, error: styles.containedError },
  outlined: { primary: styles.outlinedPrimary, error: styles.outlinedError },
  text: { primary: styles.textPrimary, error: styles.textError },
} as const;

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: Variant;
  color?: ButtonColor;
  size?: Size;
  fullWidth?: boolean;
  // When set, renders a React Router <Link> styled as a button (replaces the
  // former MUI `component={Link}` polymorphism).
  to?: string;
  children: ReactNode;
};

export default function Button({
  variant = 'text',
  color: buttonColor = 'primary',
  size = 'medium',
  fullWidth,
  to,
  disabled,
  className,
  style,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const sx = stylex.props(
    styles.base,
    sizeStyle[size],
    variantStyle[variant][buttonColor],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  );
  const merged = [sx.className, className].filter(Boolean).join(' ');
  const mergedStyle = { ...sx.style, ...style };

  if (to) {
    // External schemes (sms:, mailto:, tel:, http:) must be plain anchors;
    // React Router <Link> is only for in-app navigation.
    if (/^[a-z][a-z0-9+.-]*:/i.test(to)) {
      return (
        <a href={to} className={merged} style={mergedStyle}>
          {children}
        </a>
      );
    }
    return (
      <Link to={to} className={merged} style={mergedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} disabled={disabled} className={merged} style={mergedStyle}>
      {children}
    </button>
  );
}
