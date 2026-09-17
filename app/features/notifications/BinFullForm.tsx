import { Form, useActionData } from 'react-router';

import Button from '~/ui/Button';

import H2 from '~/ui/H2';

import type { Course } from '~/config/courses';

import type { JSX } from 'react';

type BinFullFormProps = {
  course: Course;
  alreadySubmitted?: boolean;
};

export default function BinFullForm({ course, alreadySubmitted }: BinFullFormProps): JSX.Element {
  const actionData = useActionData<{ success?: boolean }>();

  if (actionData?.success || alreadySubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-5xl mb-6">&#9989;</div>
        <H2 className="mb-4">Kiitos ilmoituksesta!</H2>
        <p className="text-fg-body text-center text-lg">Ilmoitus täydestä löytökiekkolaatikosta on vastaanotettu.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <H2 className="mb-2">Löytökiekkolaatikko täynnä?</H2>

      <p className="text-fg-strong font-bold mb-4 text-sm">{course.name}</p>

      <p className="text-fg-secondary mb-8 text-base leading-relaxed">
        Onko löytökiekkolaatikko täynnä niin, että kiekkoja ei enää mahdu sisään? Ilmoita siitä painamalla alla olevaa
        nappia.
      </p>

      <Form method="post">
        <Button variant="contained" type="submit" size="large" fullWidth>
          Laatikko on täynnä
        </Button>
      </Form>
    </div>
  );
}
