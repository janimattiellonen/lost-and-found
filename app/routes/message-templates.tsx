import { json, LoaderArgs, redirect } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

import { getMessageTemplates } from '~/models/messageTemplate.server';

import { MessageTemplateDTO } from '~/types';
import { isUserLoggedIn } from '~/models/utils';

import H2 from './components/H2';
import Wrapper from './components/Wrapper';

import MessageTemplateItem from '~/routes/components/admin/MessageTemplateItem';

import { deleteMessageTemplate, markAsDefault } from '~/models/messageTemplate.server';

export async function action({ request }) {
  const formData = await request.formData();
  const id = formData.get('id');
  const action = formData.get('action');

  if (action === 'delete') {
    await deleteMessageTemplate(id, request);
  } else if (action === 'default') {
    await markAsDefault(id, request);
  }

  return { ok: true };
}

export const loader = async ({ params, request }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const messageTemplates: MessageTemplateDTO[] = await getMessageTemplates(request);

  return json({ messageTemplates });
};

export default function MessageTemplatesPage(): JSX.Element {
  const { messageTemplates } = useLoaderData();

  return (
    <div>
      <H2 className="mt-8 mb-4">Viestipohjat</H2>

      <Button component={Link} to="/message-template/create" variant="contained">
        Luo uusi viestipohja
      </Button>

      <Wrapper>
        {messageTemplates.map((messageTemplate: MessageTemplateDTO) => {
          return (
            <Paper
              className={messageTemplate.isDefault ? 'mb-8 mt-8' : 'mt-8'}
              sx={messageTemplate.isDefault ? { border: 'solid rgba(2, 208, 232, 0.85) 4px' } : {}}
              elevation={messageTemplate.isDefault ? 7 : 1}
              children={<MessageTemplateItem messageTemplate={messageTemplate} />}
            />
          );
        })}
      </Wrapper>
    </div>
  );
}
