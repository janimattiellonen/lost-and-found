import type { ChangeEventHandler, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';

// Native checkbox themed with accent-color. Replaces MUI <Checkbox>.
const styles = stylex.create({
  checkbox: {
    accentColor: color.accent,
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
});

type CheckboxProps = {
  name?: string;
  value?: string | boolean;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export default function Checkbox({ name, value, checked, onChange }: CheckboxProps): JSX.Element {
  return (
    <input
      type="checkbox"
      name={name}
      value={value === undefined ? undefined : String(value)}
      checked={checked}
      onChange={onChange}
      {...stylex.props(styles.checkbox)}
    />
  );
}
