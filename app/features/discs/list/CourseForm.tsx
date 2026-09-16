import { useState, type FormEvent, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color, dark, font, radius, space } from '~/styles/tokens.stylex';

/** The value the "no course" radio carries; empty so it cannot collide with a real name. */
const NO_COURSE = '';

type CourseFormProps = {
  discName: string;
  /** The course the disc is filed under now, or null when it has none. */
  current: string | null;
  /** The courses this club collects from. */
  courses: string[];
  /** Distinguishes this form's field ids and radio group from any other on the page. */
  idPrefix: string;
  /** Resolves to null on success, or to a message to show in the form. */
  onSubmit: (course: string | null) => Promise<string | null>;
  onCancel: () => void;
};

/**
 * Files a disc under one of the club's courses, inline under the row.
 *
 * Deliberately not the DateAndMethodForm the two marks share: there is no date
 * to record here, and the choice is one of a fixed list rather than an optional
 * extra. "Ei rataa" is offered as a real option, since clearing a course that
 * was set wrong is as much the point as setting one that was missed.
 */
export default function CourseForm({
  discName,
  current,
  courses,
  idPrefix,
  onSubmit,
  onCancel,
}: CourseFormProps): JSX.Element {
  const [course, setCourse] = useState<string>(current ?? NO_COURSE);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    const message = await onSubmit(course === NO_COURSE ? null : course);

    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
      {/* The form opens inside the dark disc table, so its text has to be
          light, as in DateAndMethodForm. That is what `dark.text` names. */}
      <p {...stylex.props(styles.title)}>
        Aseta rata: <b>{discName}</b>
      </p>

      <fieldset>
        <legend {...stylex.props(styles.legend)}>Rata</legend>
        <div {...stylex.props(styles.options)}>
          {courses.map((name) => (
            <label key={name} {...stylex.props(styles.option)}>
              <input
                type="radio"
                name={`${idPrefix}-course`}
                value={name}
                checked={course === name}
                onChange={() => setCourse(name)}
              />
              {name}
            </label>
          ))}

          <label {...stylex.props(styles.option)}>
            <input
              type="radio"
              name={`${idPrefix}-course`}
              value={NO_COURSE}
              checked={course === NO_COURSE}
              onChange={() => setCourse(NO_COURSE)}
            />
            Ei radan tietoa
          </label>
        </div>
      </fieldset>

      <div {...stylex.props(styles.actions)}>
        <button type="submit" disabled={isSaving} {...stylex.props(styles.saveButton)}>
          {isSaving ? 'Tallennetaan...' : 'Tallenna rata'}
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
  // A club can collect from more than a row's worth of courses, so unlike the
  // other two forms this list wraps.
  options: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
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
