import type { ReactNode, JSX } from 'react';
import { createContext, useContext } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, size, space } from '~/styles/tokens.stylex';

// Native radios grouped by a shared `name` (provided via context, like MUI's
// RadioGroup). A change from any child bubbles up to the group, which reports
// the selected value -- callers never touch the event or the input.
//
// A group is uncontrolled by default: the browser owns the selection and a
// `<form>` submits it by name. Passing `value` makes it controlled instead, so
// the selection lives in one place rather than being mirrored.
const RadioGroupContext = createContext<{ name?: string; value?: string }>({});

type RadioGroupProps = {
  name?: string;
  /**
   * The selected radio's value. Supplying it makes the group controlled, and
   * the caller is then responsible for updating it from `onChange`.
   */
  value?: string;
  /** Lay the radios out horizontally, wrapping when they no longer fit. */
  row?: boolean;
  onChange?: (value: string) => void;
  children: ReactNode;
};

export function RadioGroup({ name, value, row, onChange, children }: RadioGroupProps): JSX.Element {
  return (
    <div
      role="radiogroup"
      onChange={(event) => onChange?.((event.target as HTMLInputElement).value)}
      {...stylex.props(styles.group, row && styles.groupRow)}
    >
      <RadioGroupContext.Provider value={{ name, value }}>{children}</RadioGroupContext.Provider>
    </div>
  );
}

type RadioProps = {
  value?: string;
  /** Ignored in a controlled group, which decides this from the group's value. */
  defaultChecked?: boolean;
};

export function Radio({ value, defaultChecked }: RadioProps): JSX.Element {
  const { name, value: groupValue } = useContext(RadioGroupContext);

  // `readOnly` is how React is told that an input carrying `checked` without
  // its own `onChange` is deliberate. It does nothing else: `readonly` is not a
  // valid attribute on a radio, so clicks land as usual and the group hears
  // them through the change event that bubbles up to it.
  const checkedProps =
    groupValue === undefined ? { defaultChecked } : { checked: groupValue === value, readOnly: true };

  return <input type="radio" name={name} value={value} {...checkedProps} {...stylex.props(styles.radio)} />;
}

const styles = stylex.create({
  group: {
    display: 'flex',
    flexDirection: 'column',
  },
  // Side by side, dropping onto further lines only when the row runs out of
  // room. nowrap keeps a multi-word option from breaking mid-label first.
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Matches a text field's height so a filter row lines up.
    alignItems: 'center',
    minHeight: size.control,
    columnGap: space.md,
    rowGap: space.xs,
    whiteSpace: 'nowrap',
  },
  radio: {
    accentColor: color.accent,
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
});
