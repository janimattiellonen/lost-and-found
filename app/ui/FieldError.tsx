import * as stylex from '@stylexjs/stylex';

import { color, font, leading } from '~/styles/tokens.stylex';

import type { JSX, ReactNode } from 'react';

/**
 * The red line under a field that failed validation.
 *
 * It owns the "there is nothing wrong" case, so a caller hands over whatever it
 * has rather than guarding first — the guard was the other half of what this
 * markup kept repeating.
 *
 * The red is `color.dangerStrong`, which is the name for an error sentence on a
 * light page. See the spec's scenario 11 for why one role gets one name.
 */
export default function FieldError({ children }: { children: ReactNode }): JSX.Element | null {
  if (!children) {
    return null;
  }

  return <p {...stylex.props(styles.message)}>{children}</p>;
}

const styles = stylex.create({
  message: {
    color: color.dangerStrong,
    fontSize: font.sizeXs,
    lineHeight: leading.xs,
    fontStyle: 'italic',
  },
});
