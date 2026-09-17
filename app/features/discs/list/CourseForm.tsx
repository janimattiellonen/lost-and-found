import { useState, type JSX } from 'react';

import InlineForm, { InlineFormOption, InlineFormOptions } from '~/ui/InlineForm';

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

  return (
    <InlineForm
      title={
        <>
          Aseta rata: <b>{discName}</b>
        </>
      }
      submitLabel="Tallenna rata"
      onSubmit={() => onSubmit(course === NO_COURSE ? null : course)}
      onCancel={onCancel}
    >
      <InlineFormOptions legend="Rata" wrap>
        {courses.map((name) => (
          <InlineFormOption key={name}>
            <input
              type="radio"
              name={`${idPrefix}-course`}
              value={name}
              checked={course === name}
              onChange={() => setCourse(name)}
            />
            {name}
          </InlineFormOption>
        ))}

        <InlineFormOption>
          <input
            type="radio"
            name={`${idPrefix}-course`}
            value={NO_COURSE}
            checked={course === NO_COURSE}
            onChange={() => setCourse(NO_COURSE)}
          />
          Ei radan tietoa
        </InlineFormOption>
      </InlineFormOptions>
    </InlineForm>
  );
}
