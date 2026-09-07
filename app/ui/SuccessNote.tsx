import * as stylex from '@stylexjs/stylex';

import { font, radius, space } from '~/styles/tokens.stylex';

import type { JSX, ReactNode } from 'react';

const styles = stylex.create({
  note: {
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: font.sizeSm,
    color: '#1b5e20',
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
});

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * "It worked" after a form post. Always rendered, empty or not, so the live
 * region is in the page before the message lands and a screen reader announces
 * it — the same shape the disc-entry page uses for its own saved/failed box.
 */
export default function SuccessNote({ children, className }: Props): JSX.Element {
  return (
    <div role="status" aria-live="polite" className={className}>
      {children && <p {...stylex.props(styles.note)}>{children}</p>}
    </div>
  );
}
