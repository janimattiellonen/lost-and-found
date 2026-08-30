import type { ReactNode, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

// StyleX replacement for MUI <Collapse in={...}>. Animates to content height
// via the grid-template-rows 0fr<->1fr technique — smooth, no height
// measurement, SSR-safe. Children stay mounted (clipped) when collapsed, like
// MUI.
const styles = stylex.create({
  root: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transitionProperty: 'grid-template-rows',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease',
  },
  open: {
    gridTemplateRows: '1fr',
  },
  inner: {
    overflow: 'hidden',
    minHeight: 0,
  },
});

type CollapseProps = {
  in?: boolean;
  children: ReactNode;
};

export default function Collapse({ in: inProp = false, children }: CollapseProps): JSX.Element {
  return (
    <div {...stylex.props(styles.root, inProp && styles.open)}>
      <div {...stylex.props(styles.inner)}>{children}</div>
    </div>
  );
}
