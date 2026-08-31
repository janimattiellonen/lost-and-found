import { useState, type FormEvent, type JSX } from 'react';

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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 py-2">
      {/* The form opens inside the dark disc table, so its text has to be
          light, as in DateAndMethodForm. */}
      <p className="basis-full text-xs text-gray-300">
        Aseta rata: <b>{discName}</b>
      </p>

      <fieldset>
        <legend className="text-xs font-bold text-gray-300 mb-1">Rata</legend>
        <div className="flex flex-wrap items-center gap-4">
          {courses.map((name) => (
            <label key={name} className="inline-flex items-center gap-1">
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

          <label className="inline-flex items-center gap-1">
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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white rounded px-3 py-1"
        >
          {isSaving ? 'Tallennetaan...' : 'Tallenna rata'}
        </button>

        <button type="button" onClick={onCancel} className="border border-gray-300 hover:bg-white/10 rounded px-3 py-1">
          Peruuta
        </button>
      </div>

      {error && <p className="basis-full text-red-300">{error}</p>}
    </form>
  );
}
