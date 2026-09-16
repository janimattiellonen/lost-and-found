import { useState, type FormEvent, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, dark, font, radius, space } from '~/styles/tokens.stylex';

import { retrievalMethodOptions, type RetrievalMethodValue } from './retrievalMethod';

type Props = {
  discName: string;
  /** Distinguishes this form's radio group from any other on the page. */
  idPrefix: string;
  /** Whether the disc is already on the list, whatever it is down for. */
  isOnList: boolean;
  /**
   * What the disc is already down for. Null when it is not on the list, and
   * also when it is on it because the club is keeping it — there is no method
   * to preselect, and picking one here is what turns it back into a return.
   */
  current: RetrievalMethodValue | null;
  /** Resolves to null on success, or to a message to show in the form. */
  onSubmit: (retrievalMethod: RetrievalMethodValue) => Promise<string | null>;
  onCancel: () => void;
};

/**
 * Puts one disc on the retrieval list, from inside the disc table.
 *
 * Asks for the method and nothing else: the date is now, and the disc's own
 * details are already in the row above. Unlike the return and disposal forms
 * the method cannot be left unanswered — a line on the list that does not say
 * post or hand-over is one the admin would have to go back to the messages for
 * — so there is no Submit until a radio is picked.
 *
 * A disc already on the list opens the same form with its method preselected,
 * which is how a "he'd rather collect it after all" is corrected.
 */
export default function RetrievalMethodForm({
  discName,
  idPrefix,
  isOnList,
  current,
  onSubmit,
  onCancel,
}: Props): JSX.Element {
  const [retrievalMethod, setRetrievalMethod] = useState<RetrievalMethodValue | null>(current);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (retrievalMethod === null) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const message = await onSubmit(retrievalMethod);

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
      {/* Light text: the form opens inside the dark disc table, which is what
          `dark.text` names. */}
      <p {...stylex.props(styles.title)}>
        {isOnList ? 'Muuta noutotapaa' : 'Lisää noutolistalle'}: <b>{discName}</b>
      </p>

      <fieldset>
        <legend {...stylex.props(styles.legend)}>Omistaja haluaa kiekon</legend>
        <div {...stylex.props(styles.options)}>
          {retrievalMethodOptions.map((option) => (
            <label key={option.value} {...stylex.props(styles.option)}>
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={retrievalMethod === option.value}
                onChange={() => setRetrievalMethod(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div {...stylex.props(styles.actions)}>
        <button type="submit" disabled={isSaving || retrievalMethod === null} {...stylex.props(styles.saveButton)}>
          {isSaving ? 'Tallennetaan...' : current === null ? 'Lisää noutolistalle' : 'Tallenna noutotapa'}
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
  legend: {
    marginBottom: space.xs,
    fontSize: font.sizeXs,
    lineHeight: '1rem',
    fontWeight: font.weightBold,
    color: dark.text,
  },
  options: { display: 'flex', alignItems: 'center', gap: space.md },
  option: { display: 'inline-flex', alignItems: 'center', gap: space.xs },
  actions: { display: 'flex', alignItems: 'center', gap: space.sm },
  saveButton: {
    paddingBlock: space.xs,
    paddingInline: space.smd,
    color: color.onAccent,
    backgroundColor: { default: color.success, ':hover': color.successHover },
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
