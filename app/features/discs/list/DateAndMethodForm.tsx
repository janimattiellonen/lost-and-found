import { useState, type JSX } from 'react';

import { format } from 'date-fns';

import * as stylex from '@stylexjs/stylex';

import { color, dark, font, leading, radius, space } from '~/styles/tokens.stylex';
import InlineForm, { InlineFormOption, InlineFormOptions } from '../InlineForm';

/** One radio option: the value that gets persisted, and its Finnish label. */
export type MethodOption<V extends number = number> = { value: V; label: string };

// Generic over the method's own value type, so a caller passing
// returnMethodOptions gets a ReturnMethodValue back rather than a bare number.
type DateAndMethodFormProps<V extends number> = {
  /** Names the disc the form is acting on, e.g. "Merkitse palautetuksi". */
  title: string;
  discName: string;
  /** Distinguishes this form's field ids and radio group from any other on the page. */
  idPrefix: string;
  dateLabel: string;
  methodLabel: string;
  options: MethodOption<V>[];
  submitLabel: string;
  /** Resolves to null on success, or to a message to show in the form. */
  onSubmit: (date: string, method: V | null) => Promise<string | null>;
  onCancel: () => void;
};

/**
 * The shape both admin marks share: a date defaulting to today, an optional
 * method picked from radios, and Submit/Cancel.
 *
 * The method is nullable in the database, so it can be cleared back to
 * unanswered after a radio has been picked.
 */
export default function DateAndMethodForm<V extends number>({
  title,
  discName,
  idPrefix,
  dateLabel,
  methodLabel,
  options,
  submitLabel,
  onSubmit,
  onCancel,
}: DateAndMethodFormProps<V>): JSX.Element {
  const [date, setDate] = useState(() => format(new Date(), 'y-MM-dd'));
  const [method, setMethod] = useState<V | null>(null);

  return (
    <InlineForm
      title={
        <>
          {title}: <b>{discName}</b>
        </>
      }
      submitLabel={submitLabel}
      onSubmit={() => onSubmit(date, method)}
      onCancel={onCancel}
    >
      <div>
        <label htmlFor={`${idPrefix}-date`} {...stylex.props(styles.label)}>
          {dateLabel}
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.currentTarget.value)}
          {...stylex.props(styles.dateInput)}
        />
      </div>

      <InlineFormOptions legend={methodLabel}>
        {options.map((option) => (
          <InlineFormOption key={option.value}>
            <input
              type="radio"
              name={`${idPrefix}-method`}
              value={option.value}
              checked={method === option.value}
              onChange={() => setMethod(option.value)}
            />
            {option.label}
          </InlineFormOption>
        ))}

        <button
          type="button"
          disabled={method === null}
          onClick={() => setMethod(null)}
          {...stylex.props(styles.clearButton)}
        >
          Tyhjennä
        </button>
      </InlineFormOptions>
    </InlineForm>
  );
}

// Only the three styles this form does not share with the other two: the date
// field and its label, which no other inline form has, and the clear button
// that goes with the nullable method. The shell lives in `ui/InlineForm`.
const styles = stylex.create({
  label: {
    display: 'block',
    marginBottom: space.xs,
    fontSize: font.sizeXs,
    lineHeight: leading.xs,
    fontWeight: font.weightBold,
    color: dark.text,
  },
  // A white field sitting on the dark island, so its border is the light
  // surface's `color.border` rather than the dark group's — the same grey, but
  // the role that explains why it is there.
  dateInput: {
    paddingBlock: space.xs,
    paddingInline: space.sm,
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.sm,
  },
  clearButton: {
    fontSize: font.sizeXs,
    lineHeight: leading.xs,
    color: dark.text,
    textDecorationLine: { default: 'underline', ':disabled': 'none' },
    opacity: { default: 1, ':disabled': 0.4 },
  },
});
