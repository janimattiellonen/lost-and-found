import * as stylex from '@stylexjs/stylex';

import { color, font, radius, space } from '~/styles/tokens.stylex';

import type { JSX, ReactNode } from 'react';

/** Did the thing work or not — the only difference between the two boxes. */
type Variant = 'success' | 'error';

type Props = {
  variant: Variant;
  children: ReactNode;
  /** Applied to the live region, which is where a caller's spacing belongs. */
  className?: string;
};

/**
 * "It worked" or "it failed" after a form post. One box, two colour sets: the
 * metrics — padding, radius, border, size — are the component's, so a page only
 * says which of the two outcomes it is reporting.
 *
 * The wrapper is always rendered, empty or not, so the live region is in the
 * page before the message lands and a screen reader announces it rather than
 * missing an element that appeared at the same moment as its text.
 */
export default function StatusNote({ variant, children, className }: Props): JSX.Element {
  return (
    <div role="status" aria-live="polite" className={className}>
      {children && <p {...stylex.props(styles.note, styles[variant])}>{children}</p>}
    </div>
  );
}

const styles = stylex.create({
  note: {
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: font.sizeSm,
  },
  // Each variant is one of the token triads: surface, border and text move as a
  // unit, which is what keeps a green box from wearing another palette's border.
  success: {
    color: color.successText,
    backgroundColor: color.successSurface,
    borderColor: color.successBorder,
  },
  error: {
    color: color.dangerText,
    backgroundColor: color.dangerSurface,
    borderColor: color.dangerBorder,
  },
});
