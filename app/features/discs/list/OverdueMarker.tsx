import type { JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';
import { WarningIcon } from '~/ui/icons';

// The marker shown beside the date of a disc the club has held for more than
// three months. It lives in one place because it is drawn twice: once in the
// table beside the disc's date, and once in the legend above the table that
// explains what it means. Those two must not drift apart — the legend is only
// useful while it describes the marker the reader can actually see.
const TITLE = 'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa';

type OverdueMarkerProps = {
  // The legend sets a gap between the marker and the sentence explaining it;
  // in the table the marker stands on its own.
  className?: string;
  style?: React.CSSProperties;
};

export default function OverdueMarker({ className, style }: OverdueMarkerProps): JSX.Element {
  const sx = stylex.props(styles.marker);
  return (
    <WarningIcon
      title={TITLE}
      className={[sx.className, className].filter(Boolean).join(' ')}
      style={{ ...sx.style, ...style }}
    />
  );
}

const styles = stylex.create({
  marker: {
    color: color.danger,
  },
});
