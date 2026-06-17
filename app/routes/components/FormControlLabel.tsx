import type { ReactElement, ReactNode, JSX } from 'react';
import { cloneElement } from 'react';

import * as stylex from '@stylexjs/stylex';

import { space } from '~/styles/tokens.stylex';

// Pairs a control (Checkbox/Radio) with a label. When `value` is set (radio
// case), it is injected into the control — mirroring MUI's FormControlLabel.
const styles = stylex.create({
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.sm,
    cursor: 'pointer',
  },
});

type FormControlLabelProps = {
  control: ReactElement<{ value?: string }>;
  label: ReactNode;
  value?: string;
};

export default function FormControlLabel({ control, label, value }: FormControlLabelProps): JSX.Element {
  const renderedControl = value !== undefined ? cloneElement(control, { value }) : control;
  return (
    <label {...stylex.props(styles.label)}>
      {renderedControl}
      <span>{label}</span>
    </label>
  );
}
