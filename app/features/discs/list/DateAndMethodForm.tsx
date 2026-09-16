import { useState, type FormEvent, type JSX } from 'react';

import { format } from 'date-fns';

import * as stylex from '@stylexjs/stylex';

import { color, dark, font, radius, space } from '~/styles/tokens.stylex';

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    const message = await onSubmit(date, method);

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
      {/* The form opens inside the dark disc table, so its text has to be
          light: the muted grey of a form on a white page all but disappeared
          against the row behind it. That is what `dark.text` names. */}
      <p {...stylex.props(styles.title)}>
        {title}: <b>{discName}</b>
      </p>

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

      <fieldset>
        <legend {...stylex.props(styles.legend)}>{methodLabel}</legend>
        <div {...stylex.props(styles.options)}>
          {options.map((option) => (
            <label key={option.value} {...stylex.props(styles.option)}>
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
              />
              {option.label}
            </label>
          ))}

          <button
            type="button"
            disabled={method === null}
            onClick={() => setMethod(null)}
            {...stylex.props(styles.clearButton)}
          >
            Tyhjennä
          </button>
        </div>
      </fieldset>

      <div {...stylex.props(styles.actions)}>
        <button type="submit" disabled={isSaving} {...stylex.props(styles.saveButton)}>
          {isSaving ? 'Tallennetaan...' : submitLabel}
        </button>

        <button type="button" onClick={onCancel} {...stylex.props(styles.cancelButton)}>
          Peruuta
        </button>
      </div>

      {error && <p {...stylex.props(styles.error)}>{error}</p>}
    </form>
  );
}

const styles = stylex.create({
  // Tailwind's smallest type step sets a line height as well as a size, and the
  // token set has a name only for the size, so every `font.sizeXs` here is
  // followed by the height that came with it. Dropping it would leave the text
  // on the browser's default leading, which is not the same box.
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: space.lg,
    paddingBlock: space.sm,
  },
  title: {
    flexBasis: '100%',
    fontSize: font.sizeXs,
    lineHeight: '1rem',
    color: dark.text,
  },
  label: {
    display: 'block',
    marginBottom: space.xs,
    fontSize: font.sizeXs,
    lineHeight: '1rem',
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
  legend: {
    marginBottom: space.xs,
    fontSize: font.sizeXs,
    lineHeight: '1rem',
    fontWeight: font.weightBold,
    color: dark.text,
  },
  options: { display: 'flex', alignItems: 'center', gap: space.md },
  option: { display: 'inline-flex', alignItems: 'center', gap: space.xs },
  clearButton: {
    fontSize: font.sizeXs,
    lineHeight: '1rem',
    color: dark.text,
    textDecorationLine: { default: 'underline', ':disabled': 'none' },
    opacity: { default: 1, ':disabled': 0.4 },
  },
  actions: { display: 'flex', alignItems: 'center', gap: space.sm },
  saveButton: {
    paddingBlock: space.xs,
    paddingInline: space.smd,
    color: color.onAccent,
    // `:disabled:hover` compiles to a higher priority than either `:hover`
    // (3130) or `:disabled` (3092), which is what stops a button that cannot be
    // pressed lighting up under the pointer. The two states sit on different
    // properties here, so nothing forced this — see the spec's scenario 12.
    backgroundColor: {
      default: color.success,
      ':hover': color.successHover,
      ':disabled:hover': color.success,
    },
    borderRadius: radius.sm,
    opacity: { default: 1, ':disabled': 0.4 },
  },
  // The cancel button's wash is neutral translucency and stays a literal: it is
  // white over whatever row is behind it, and nothing about it drifts when the
  // palette does.
  cancelButton: {
    paddingBlock: space.xs,
    paddingInline: space.smd,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(255,255,255,0.1)' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: dark.border,
    borderRadius: radius.sm,
  },
  error: { flexBasis: '100%', color: dark.dangerText },
});
