import type { JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';
import { WarningIcon } from '~/ui/icons';

type OverdueMarkerProps = {
  // The legend sets a gap between the marker and the sentence explaining it;
  // in the table the marker stands on its own.
  style?: stylex.StyleXStyles;
};

// The marker shown beside the date of a disc the club has held for more than
// three months. It lives in one place because it is drawn twice: once in the
// table beside the disc's date, and once in the legend above the table that
// explains what it means. Those two must not drift apart — the legend is only
// useful while it describes the marker the reader can actually see.
export default function OverdueMarker({ style }: OverdueMarkerProps): JSX.Element {
  return <WarningIcon title={TITLE} {...stylex.props(styles.marker, style)} />;
}

const TITLE = 'Kiekko on ollut seuran hallussa yli 3kk ja se saatetaan pian myydä tai lahjoittaa';

const styles = stylex.create({
  marker: {
    color: color.danger,
  },
});
