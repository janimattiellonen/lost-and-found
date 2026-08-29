import type { CSSProperties, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';

// StyleX loading spinner replacing MUI <CircularProgress>: a rotating ring.
const spin = stylex.keyframes({
  to: { transform: 'rotate(360deg)' },
});

const styles = stylex.create({
  spinner: {
    display: 'inline-block',
    boxSizing: 'border-box',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    borderWidth: '4px',
    borderStyle: 'solid',
    borderColor: 'rgba(0,0,0,0.1)',
    borderTopColor: color.accent,
    animationName: spin,
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});

type CircularProgressProps = {
  className?: string;
  style?: CSSProperties;
};

export default function CircularProgress({ className, style }: CircularProgressProps): JSX.Element {
  const sx = stylex.props(styles.spinner);
  return (
    <span
      role="progressbar"
      aria-label="Ladataan"
      className={[sx.className, className].filter(Boolean).join(' ')}
      style={{ ...sx.style, ...style }}
    />
  );
}
