import type { FormEventHandler, ReactNode, JSX } from 'react';
import { createContext, useContext } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';

// Native radios grouped by a shared `name` (provided via context, like MUI's
// RadioGroup). Selection is handled natively; the group's onChange catches the
// bubbling change from any child radio.
const RadioGroupContext = createContext<{ name?: string }>({});

const styles = stylex.create({
  group: {
    display: 'flex',
    flexDirection: 'column',
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
  onChange?: FormEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export function RadioGroup({ name, onChange, children }: RadioGroupProps): JSX.Element {
  return (
    <div role="radiogroup" onChange={onChange} {...stylex.props(styles.group)}>
      <RadioGroupContext.Provider value={{ name }}>{children}</RadioGroupContext.Provider>
    </div>
  );
}

type RadioProps = {
  value?: string;
};

export function Radio({ value }: RadioProps): JSX.Element {
  const { name } = useContext(RadioGroupContext);
  return <input type="radio" name={name} value={value} {...stylex.props(styles.radio)} />;
}
