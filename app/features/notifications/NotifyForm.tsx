import { useState, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';
import { Form, useActionData } from 'react-router';

import FieldError from '~/ui/FieldError';
import Collapse from '~/ui/Collapse';
import { RadioGroup, Radio } from '~/ui/RadioGroup';
import FormControlLabel from '~/ui/FormControlLabel';
import TextField from '~/ui/TextField';
import Button from '~/ui/Button';

import H2 from '~/ui/H2';
import Wrapper from '~/ui/Wrapper';
import Label from '~/ui/Label';

import type { Course } from '~/config/courses';
import { courses } from '~/config/courses';

type NotifyFormProps = {
  course?: Course;
};

export default function NotifyForm({ course }: NotifyFormProps): JSX.Element {
  const actionData = useActionData();
  const [showDetails, setShowDetails] = useState(false);
  const [courseError, setCourseError] = useState('');

  if (actionData?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-5xl mb-6">&#9989;</div>
        <H2 className="mb-4">Kiitos ilmoituksesta!</H2>
        <p className="text-fg-body mb-8 text-center text-lg">Ilmoitus löydetystä kiekosta on vastaanotettu.</p>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          {...stylex.props(styles.confirmationButton)}
          onClick={() => window.location.reload()}
        >
          Lähetä uusi ilmoitus
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <H2 className="mb-2">Ilmoita kiekosta</H2>

      {course && <p className="text-fg-strong font-bold mb-4 text-sm">{course.name}</p>}

      <p className="text-fg-secondary mb-8 text-base leading-relaxed">
        Löysitkö kiekon ja jätit sen löytökiekkolaatikkoon? Ilmoita siitä painamalla alla olevaa nappia. Halutessasi
        voit myös jättää yhteystietosi ja lyhyen viestin.
      </p>

      <Form
        method="post"
        onSubmit={(e) => {
          if (!course) {
            const formData = new FormData(e.currentTarget);
            if (!formData.get('courseName')) {
              e.preventDefault();
              setCourseError('Valitse rata');
            } else {
              setCourseError('');
            }
          }
        }}
      >
        {course ? (
          <input type="hidden" name="courseName" value={course.name} />
        ) : (
          <Wrapper>
            <Label>Rata</Label>
            <RadioGroup name="courseName" onChange={() => setCourseError('')}>
              {courses.map((c) => (
                <FormControlLabel key={c.slug} value={c.name} control={<Radio />} label={c.name} />
              ))}
            </RadioGroup>
            <FieldError>{courseError}</FieldError>
          </Wrapper>
        )}

        <div className="mb-6">
          <Button variant="text" size="small" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Piilota lisätiedot' : 'Lisää yhteystiedot'}
          </Button>
        </div>

        <Collapse in={showDetails}>
          <Wrapper>
            <Label htmlFor="contactName">Nimi</Label>
            <TextField name="contactName" id="contactName" fullWidth />
          </Wrapper>

          <Wrapper>
            <Label htmlFor="contactPhone">Puhelinnumero</Label>
            <TextField name="contactPhone" id="contactPhone" fullWidth inputProps={{ inputMode: 'tel' }} />
          </Wrapper>

          <Wrapper>
            <Label htmlFor="contactEmail">Sähköposti</Label>
            <TextField
              name="contactEmail"
              id="contactEmail"
              type="email"
              fullWidth
              inputProps={{ inputMode: 'email' }}
            />
          </Wrapper>

          <Wrapper>
            <Label htmlFor="message">Viesti</Label>
            <TextField
              name="message"
              id="message"
              multiline
              rows={3}
              fullWidth
              placeholder="Esim. kiekon väri, tyyppi tai löytöpaikka"
            />
          </Wrapper>
        </Collapse>

        <Button variant="contained" type="submit" size="large" fullWidth>
          Ilmoita kiekosta
        </Button>
      </Form>
    </div>
  );
}

const styles = stylex.create({
  // fullWidth on a phone, but capped so it does not stretch across a desktop.
  confirmationButton: {
    maxWidth: '20rem',
  },
});
