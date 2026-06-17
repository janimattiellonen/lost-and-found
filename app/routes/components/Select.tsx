import type { ChangeEventHandler, ReactNode } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, radius } from '~/styles/tokens.stylex';

// StyleX wrappers over native <select>/<option>, replacing MUI Select/MenuItem.
// Keeps the browser's native dropdown (and arrow); just themes the box.
const styles = stylex.create({
  select: {
    padding: '8px 12px',
    fontFamily: 'inherit',
    fontSize: '1rem',
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.accent },
    borderRadius: radius.sm,
    cursor: 'pointer',
    outline: 'none',
  },
  fullWidth: { width: '100%' },
});

type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
};

export default function Select({ fullWidth, className, children, ...rest }: SelectProps): JSX.Element {
  const sx = stylex.props(styles.select, fullWidth && styles.fullWidth);
  return (
    <select {...rest} className={[sx.className, className].filter(Boolean).join(' ')} style={sx.style}>
      {children}
    </select>
  );
}

type MenuItemProps = {
  value?: string | number;
  children: ReactNode;
};

export function MenuItem({ value, children }: MenuItemProps): JSX.Element {
  return <option value={value}>{children}</option>;
}
