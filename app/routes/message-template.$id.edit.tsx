import { useEffect, useState } from 'react';
import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node';
import { Button, Checkbox, FormControlLabel, TextField } from '@mui/material';

import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { getMessageTemplate, editMessageTemplate } from '~/models/messageTemplate.server';

import { isUserLoggedIn } from '~/models/utils';
import { MessageTemplateDTO } from '~/types';

import H2 from './components/H2';
import Wrapper from '~/routes/components/Wrapper';
import Label from '~/routes/components/Label';

type MessageTemplateErrors = {
  content?: string | null | undefined;
};

export async function action({ request, params }: ActionArgs) {
  const errors: MessageTemplateErrors = {};

  const id = parseInt(params.id || '', 10);
  const form = await request.formData();
  const content = form.get('content')!;

  const isDefault = form.get('is-default')!;

  if (typeof content !== 'string' || content.length === 0) {
    errors.content = 'Sisältö on pakollinen';
  }

  if (Object.keys(errors).length) {
    return json({ errors, ok: null }, { status: 422 });
  }

  await editMessageTemplate(id, content.toString(), isDefault ? Boolean(isDefault.toString()) : false, request);

  return json({ errors: null, ok: true }, { status: 201 });
}

export const loader = async ({ params, request }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const id = parseInt(params.id || '', 10);

  const messageTemplate: MessageTemplateDTO | null = await getMessageTemplate(id, request);

  return json({ messageTemplate, ok: null });
};

export default function EditMessageTemplate(): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);

  const response = useActionData();
  const { messageTemplate } = useLoaderData();

  const { errors } = response || {};

  useEffect(() => {
    if (messageTemplate) {
      setMessage(messageTemplate.content);
      setIsDefault(messageTemplate.isDefault);
    }
  }, []);

  return (
    <div>
      <H2 className="mt-8 mb-4">Muokkaa viestipohjaa</H2>

      <Form method="post">
        <Wrapper>
          <Label htmlFor="content">Sisältö</Label>
          <TextField
            name="content"
            id="content"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            multiline
            rows={9}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />

          {errors?.content && <p className="text-red-500 text-xs italic">{errors.content}</p>}
        </Wrapper>

        <Wrapper>
          <FormControlLabel
            control={
              <Checkbox
                name="is-default"
                value={isDefault}
                checked={isDefault}
                onChange={(e) => {
                  setIsDefault(e.target.checked);
                }}
              />
            }
            label="Oletusviestipohja"
          />
        </Wrapper>

        <div className="flex justify-start gap-4">
          <Button color="error" variant="contained" component={Link} to={`/message-templates`}>
            Peru
          </Button>

          <Button name="action" value="create" variant="contained" type="submit">
            Päivitä
          </Button>
        </div>
      </Form>
    </div>
  );
}
