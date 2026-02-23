import { useState } from 'react';
import { Form, useActionData } from '@remix-run/react';

import { TextField, Button, Collapse, RadioGroup, FormControlLabel, Radio } from '@mui/material';

import H2 from './H2';
import Wrapper from './Wrapper';
import Label from './Label';

import { Course, courses } from '~/config/courses';

type NotifyFormProps = {
  course?: Course;
};

export default function NotifyForm({ course }: NotifyFormProps): JSX.Element {
  const actionData = useActionData();
  const [showDetails, setShowDetails] = useState(false);
  const [courseError, setCourseError] = useState('');

  if (actionData?.success) {
    return (
      <div className="mt-8 text-center">
        <H2 className="mb-4">Kiitos ilmoituksesta!</H2>
        <p className="text-gray-700 mb-6">
          Ilmoitus löydetystä kiekosta on vastaanotettu.
        </p>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
        >
          Lähetä uusi ilmoitus
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <H2 className="mb-4">Ilmoita löydetystä kiekosta</H2>

      {course && (
        <p className="text-gray-700 mb-2">
          <strong>Rata:</strong> {course.name}
        </p>
      )}

      <p className="text-gray-700 mb-6">
        Löysitkö kiekon ja jätit sen löytökiekkolaatikkoon? Ilmoita siitä painamalla alla olevaa nappia.
        Halutessasi voit myös jättää yhteystietosi ja lyhyen viestin.
      </p>

      <Form method="post" onSubmit={(e) => {
        if (!course) {
          const formData = new FormData(e.currentTarget);
          if (!formData.get('courseName')) {
            e.preventDefault();
            setCourseError('Valitse rata');
          } else {
            setCourseError('');
          }
        }
      }}>
        {course ? (
          <input type="hidden" name="courseName" value={course.name} />
        ) : (
          <Wrapper>
            <Label>Rata</Label>
            <RadioGroup name="courseName" onChange={() => setCourseError('')}>
              {courses.map((c) => (
                <FormControlLabel
                  key={c.slug}
                  value={c.name}
                  control={<Radio />}
                  label={c.name}
                />
              ))}
            </RadioGroup>
            {courseError && <p className="text-red-500 text-xs italic">{courseError}</p>}
          </Wrapper>
        )}

        <div className="mb-4">
          <Button
            variant="text"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Piilota lisätiedot' : 'Lisää yhteystiedot tai viesti (valinnainen)'}
          </Button>
        </div>

        <Collapse in={showDetails}>
          <Wrapper>
            <Label htmlFor="contactName">Nimi</Label>
            <TextField
              name="contactName"
              id="contactName"
              fullWidth
              size="small"
            />
          </Wrapper>

          <Wrapper>
            <Label htmlFor="contactPhone">Puhelinnumero</Label>
            <TextField
              name="contactPhone"
              id="contactPhone"
              fullWidth
              size="small"
            />
          </Wrapper>

          <Wrapper>
            <Label htmlFor="contactEmail">Sähköposti</Label>
            <TextField
              name="contactEmail"
              id="contactEmail"
              type="email"
              fullWidth
              size="small"
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
              size="small"
              placeholder="Esim. kiekon väri, tyyppi tai löytöpaikka"
            />
          </Wrapper>
        </Collapse>

        <Button
          variant="contained"
          type="submit"
          size="large"
        >
          Ilmoita löydetystä kiekosta
        </Button>
      </Form>
    </div>
  );
}
