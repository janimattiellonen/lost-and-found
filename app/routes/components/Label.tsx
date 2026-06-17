import type { LabelHTMLAttributes, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, font } from '~/styles/tokens.stylex';

const styles = stylex.create({
  // Replaces MUI InputLabel: block label, bold, gray-700 text (the only styles
  // the previous component actually set; the rest were MUI defaults).
  label: {
    display: 'block',
    fontWeight: font.weightBold,
    fontSize: font.sizeMd,
    color: color.textSecondary,
  },
});

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: JSX.Element | string;
};

export default function Label({ children, className, style, ...rest }: LabelProps): JSX.Element {
  const props = stylex.props(styles.label);
  return (
    <label
      {...rest}
      className={[props.className, className].filter(Boolean).join(' ')}
      style={{ ...props.style, ...style }}
    >
      {children}
    </label>
  );
}
