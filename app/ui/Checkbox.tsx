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
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.4,
  },
});

type CheckboxProps = {
  name?: string;
  value?: string | boolean;
  checked?: boolean;
  disabled?: boolean;
  /** Some checked, some not — a select-all that would only select the rest. */
  indeterminate?: boolean;
  /** Required when the box has no visible <label>, as in a table header. */
  'aria-label'?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export default function Checkbox({
  name,
  value,
  checked,
  disabled,
  indeterminate,
  'aria-label': ariaLabel,
  onChange,
}: CheckboxProps): JSX.Element {
  return (
    <input
      type="checkbox"
      name={name}
      value={value === undefined ? undefined : String(value)}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      // indeterminate is a property, not an attribute, so it cannot be set in
      // JSX like the others.
      ref={(element) => {
        if (element) {
          element.indeterminate = indeterminate === true;
        }
      }}
      onChange={onChange}
      {...stylex.props(styles.checkbox, disabled && styles.disabled)}
    />
  );
}
