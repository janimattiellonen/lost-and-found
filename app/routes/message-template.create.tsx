import { Form, useActionData } from 'react-router';

import type { ActionFunctionArgs } from 'react-router';
import { data, redirect } from 'react-router';

import { Checkbox, FormControlLabel } from '@mui/material';
import TextField from '~/routes/components/TextField';
import Button from '~/routes/components/Button';

import H2 from './components/H2';
import Label from './components/Label';
import Wrapper from './components/Wrapper';

import { createMessageTemplate } from '~/models/messageTemplate.server';

type MessageTemplateErrors = {
  content?: string | null | undefined;
};

export async function action({ request }: ActionFunctionArgs) {
  const errors: MessageTemplateErrors = {};

  const form = await request.formData();
  const content = form.get('content')!;

  const isDefault = form.get('is-default')!;

  if (typeof content !== 'string' || content.length === 0) {
    errors.content = 'Sisältö on pakollinen';
  }

  if (Object.keys(errors).length) {
    return data({ errors, data: null }, { status: 422 });
  }

  const messageTemplateId = await createMessageTemplate(
    content.toString(),
    isDefault ? Boolean(isDefault.toString()) : false,
    request,
  );

  return redirect(`/message-template/${messageTemplateId}/edit`, {
    status: 302,
  });
}
export default function CreateMessageTemplate(): JSX.Element {
  const response = useActionData();

  const { errors } = response || {};

  return (
    <div>
      <H2 className="mt-8 mb-4">Luo uusi viestipohja</H2>

      <Form method="post">
        <Wrapper>
          <Label htmlFor="content">Sisältö</Label>
          <TextField name="content" id="content" multiline rows={9} fullWidth />

          {errors?.content && <p className="text-red-500 text-xs italic">{errors.content}</p>}
        </Wrapper>

        <Wrapper>
          <FormControlLabel control={<Checkbox name="is-default" />} label="Oletusviestipohja" />
        </Wrapper>

        <Button variant="contained" type="submit">
          Luo
        </Button>
      </Form>
    </div>
  );
}
