import type { ChangeEventHandler, InputHTMLAttributes } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, radius } from '~/styles/tokens.stylex';

// StyleX text input / textarea. Replaces MUI <TextField> for the app's form
// fields (which use a separate <Label> above, not MUI's floating label). The
// base style reproduces the Tailwind input look the forms previously applied
// via className (shadow / border / rounded / padding / gray-700 text), so call
// sites no longer pass that className.
const styles = stylex.create({
  base: {
    width: 'auto',
    appearance: 'none',
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontFamily: 'inherit',
    fontSize: '1rem',
    lineHeight: 1.25,
    color: color.textSecondary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.accent },
    borderRadius: radius.sm,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    outline: 'none',
  },
  fullWidth: { width: '100%' },
});

type TextFieldProps = {
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  id?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export default function TextField({
  multiline,
  rows,
  fullWidth,
  className,
  inputProps,
  type,
  ...rest
}: TextFieldProps): JSX.Element {
  const sx = stylex.props(styles.base, fullWidth && styles.fullWidth);
  const merged = [sx.className, className].filter(Boolean).join(' ');

  if (multiline) {
    // `type` is input-only; not forwarded to <textarea>.
    return <textarea {...rest} rows={rows} className={merged} style={sx.style} />;
  }

  return <input {...rest} type={type} {...inputProps} className={merged} style={sx.style} />;
}
