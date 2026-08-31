import type { FormEventHandler, ReactNode, JSX } from 'react';
import { createContext, useContext } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, size, space } from '~/styles/tokens.stylex';

// Native radios grouped by a shared `name` (provided via context, like MUI's
// RadioGroup). Selection is handled natively; the group's onChange catches the
// bubbling change from any child radio.
const RadioGroupContext = createContext<{ name?: string }>({});

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

type RadioGroupProps = {
  name?: string;
  /** Lay the radios out horizontally, wrapping when they no longer fit. */
  row?: boolean;
  onChange?: FormEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export function RadioGroup({ name, row, onChange, children }: RadioGroupProps): JSX.Element {
  return (
    <div role="radiogroup" onChange={onChange} {...stylex.props(styles.group, row && styles.groupRow)}>
      <RadioGroupContext.Provider value={{ name }}>{children}</RadioGroupContext.Provider>
    </div>
  );
}

type RadioProps = {
  value?: string;
  defaultChecked?: boolean;
};

export function Radio({ value, defaultChecked }: RadioProps): JSX.Element {
  const { name } = useContext(RadioGroupContext);
  return (
    <input type="radio" name={name} value={value} defaultChecked={defaultChecked} {...stylex.props(styles.radio)} />
  );
}
