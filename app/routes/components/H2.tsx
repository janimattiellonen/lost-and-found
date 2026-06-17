import * as stylex from '@stylexjs/stylex';

import { font } from '~/styles/tokens.stylex';

import type { JSX } from "react";

const styles = stylex.create({
  h2: {
    fontWeight: font.weightBold,
    fontSize: {
      default: font.sizeLg,
      '@media (min-width: 600px)': font.sizeXl,
    },
  },
});

type H2Props = {
  children: JSX.Element | string;
  className?: string;
};

export default function H2({ children, className }: H2Props): JSX.Element {
  // Merge StyleX's generated className with any caller-supplied className
  // (callers still pass Tailwind utilities during the migration).
  const { className: sxClassName, style } = stylex.props(styles.h2);
  return (
    <h2 className={[sxClassName, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </h2>
  );
}
