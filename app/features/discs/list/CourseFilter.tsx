import type { JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { color } from '~/styles/tokens.stylex';
import FormControlLabel from '~/ui/FormControlLabel';
import { Radio, RadioGroup } from '~/ui/RadioGroup';

// The value the "all courses" option carries. Empty so it can never collide
// with a real course name coming from the data.
const ALL_COURSES = '';

type CourseFilterProps = {
  courses: string[];
  onChange: (course: string | null) => void;
};

const styles = stylex.create({
  label: { display: 'block', fontWeight: 700, marginBottom: '4px', color: color.textSecondary },
});

export default function CourseFilter({ courses, onChange }: CourseFilterProps): JSX.Element {
  return (
    <div>
      <span {...stylex.props(styles.label)}>Rata</span>
      <RadioGroup
        row
        name="course"
        onChange={(e) => {
          const { value } = e.target as HTMLInputElement;
          onChange(value === ALL_COURSES ? null : value);
        }}
      >
        <FormControlLabel control={<Radio defaultChecked />} value={ALL_COURSES} label="Kaikki radat" />
        {courses.map((course) => (
          <FormControlLabel key={course} control={<Radio />} value={course} label={course} />
        ))}
      </RadioGroup>
    </div>
  );
}
