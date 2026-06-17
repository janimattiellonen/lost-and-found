import { useState } from 'react';

import { useCombobox } from 'downshift';
import * as stylex from '@stylexjs/stylex';

import { color, radius } from '~/styles/tokens.stylex';

type DiscSelectorProps = {
  discNames: string[];
  onChange: (e: string | null) => void;
};

const styles = stylex.create({
  root: { position: 'relative', width: '300px' },
  label: { display: 'block', fontWeight: 700, marginBottom: '4px', color: color.textSecondary },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 36px 8px 12px',
    fontFamily: 'inherit',
    fontSize: '1rem',
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.accent },
    borderRadius: radius.sm,
    outline: 'none',
  },
  toggle: {
    position: 'absolute',
    right: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    background: 'none',
    color: color.textMuted,
    cursor: 'pointer',
  },
  chevron: {
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  },
  chevronOpen: { transform: 'rotate(180deg)' },
  menu: {
    position: 'absolute',
    zIndex: 10,
    left: 0,
    right: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    maxHeight: '240px',
    overflowY: 'auto',
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.sm,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  menuClosed: { display: 'none' },
  item: { padding: '8px 12px', cursor: 'pointer' },
  itemHighlighted: { backgroundColor: 'rgba(25,118,210,0.08)' },
});

export default function DiscSelector({ discNames, onChange }: DiscSelectorProps): JSX.Element {
  const [items, setItems] = useState<string[]>(discNames);

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getToggleButtonProps,
    getItemProps,
    highlightedIndex,
    openMenu,
  } = useCombobox({
    items,
    // Clicking the input always OPENS the list (never toggles it closed), so a
    // click reliably shows all options — matching the previous MUI Autocomplete.
    // The chevron toggle and blur still close it.
    stateReducer(state, { type, changes }) {
      if (type === useCombobox.stateChangeTypes.InputClick) {
        return { ...changes, isOpen: true };
      }
      return changes;
    },
    onInputValueChange({ inputValue }) {
      const filter = (inputValue ?? '').toLowerCase();
      setItems(discNames.filter((name) => name.toLowerCase().includes(filter)));
    },
    onSelectedItemChange({ selectedItem }) {
      onChange(selectedItem ?? null);
    },
  });

  return (
    <div {...stylex.props(styles.root)}>
      {/* getLabelProps() supplies htmlFor matching the input's id — the
          association is real but invisible to the static lint rule. */}
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label {...getLabelProps()} {...stylex.props(styles.label)}>
        Valitse kiekko
      </label>
      <div {...stylex.props(styles.inputWrap)}>
        {/* Open the full list on focus, matching the previous MUI Autocomplete. */}
        <input {...getInputProps({ onFocus: () => !isOpen && openMenu() })} {...stylex.props(styles.input)} />
        <button type="button" aria-label="Avaa lista" {...getToggleButtonProps()} {...stylex.props(styles.toggle)}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            {...stylex.props(styles.chevron, isOpen && styles.chevronOpen)}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </div>
      <ul {...getMenuProps()} {...stylex.props(styles.menu, !isOpen && styles.menuClosed)}>
        {isOpen &&
          items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              {...getItemProps({ item, index })}
              {...stylex.props(styles.item, highlightedIndex === index && styles.itemHighlighted)}
            >
              {item}
            </li>
          ))}
      </ul>
    </div>
  );
}
