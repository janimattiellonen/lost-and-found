import { useState, type FormEvent, type JSX, type ReactNode } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, dark, font, radius, space } from '~/styles/tokens.stylex';

type InlineFormProps = {
  /** The line above the fields. A node, so a caller can emphasise part of it. */
  title: ReactNode;
  /** The fields, between the title and the buttons. */
  children: ReactNode;
  /** What the save button says while it is idle. */
  submitLabel: string;
  /** False while there is nothing worth saving; the save button is then disabled. */
  canSubmit?: boolean;
  /** Resolves to null on success, or to the message to show under the form. */
  onSubmit: () => Promise<string | null>;
  onCancel: () => void;
};

/**
 * The shell of a small form that opens inside the dark disc table: a title
 * line, the caller's fields, a save and a cancel button, and the failure
 * message underneath.
 *
 * It owns the saving state and the error, because a caller that had to own
 * them would own the same six lines every time — the save button's label, its
 * disabled state and the error paragraph are all derived from the one promise
 * `onSubmit` returns. What it deliberately does not own is the fields: they are
 * children, so a form with a date and a clear button and a form with nothing but
 * radios are the same shell with different insides rather than one component
 * with a flag for each of them.
 */
export default function InlineForm({
  title,
  children,
  submitLabel,
  canSubmit = true,
  onSubmit,
  onCancel,
}: InlineFormProps): JSX.Element {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const message = await onSubmit();

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
      {/* The form opens inside the dark disc table, so its text has to be
          light: the muted grey of a form on a white page all but disappeared
          against the row behind it. That is what `dark.text` names. */}
      <p {...stylex.props(styles.title)}>{title}</p>

      {children}

      <div {...stylex.props(styles.actions)}>
        <button type="submit" disabled={isSaving || !canSubmit} {...stylex.props(styles.saveButton)}>
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

type InlineFormOptionsProps = {
  /** Names the choice, e.g. the question the radios answer. */
  legend: string;
  /** True when there can be more options than fit on one line. */
  wrap?: boolean;
  children: ReactNode;
};

/** A labelled row of choices inside an `InlineForm`. */
export function InlineFormOptions({ legend, wrap = false, children }: InlineFormOptionsProps): JSX.Element {
  return (
    <fieldset>
      <legend {...stylex.props(styles.legend)}>{legend}</legend>
      <div {...stylex.props(styles.options, wrap && styles.optionsWrap)}>{children}</div>
    </fieldset>
  );
}

/** One choice: its control and the text that labels it, kept on one line. */
export function InlineFormOption({ children }: { children: ReactNode }): JSX.Element {
  return <label {...stylex.props(styles.option)}>{children}</label>;
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
  // Kept apart from `options` rather than made a parameter of it: a club can
  // collect from more than a row's worth of courses, and only that list wraps.
  optionsWrap: { flexWrap: 'wrap' },
  option: { display: 'inline-flex', alignItems: 'center', gap: space.xs },
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
