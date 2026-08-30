import type { CSSProperties, ReactNode, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, radius } from '~/styles/tokens.stylex';

// StyleX replacement for MUI <Paper>. Shadows are MUI's exact elevation values;
// radius matches MUI's default (4px). Only the elevations actually used in the
// app are provided.
const styles = stylex.create({
  base: {
    backgroundColor: color.surface,
    color: color.textPrimary,
    borderRadius: radius.sm,
  },
  e1: {
    boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  },
  e3: {
    boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  },
  e7: {
    boxShadow: '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  },
});

const shadowByElevation = { 1: styles.e1, 3: styles.e3, 7: styles.e7 };

type Elevation = keyof typeof shadowByElevation;

type PaperProps = {
  elevation?: Elevation;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function Paper({ elevation = 1, className, style, children }: PaperProps): JSX.Element {
  const props = stylex.props(styles.base, shadowByElevation[elevation]);
  return (
    <div className={[props.className, className].filter(Boolean).join(' ')} style={{ ...props.style, ...style }}>
      {children}
    </div>
  );
}
