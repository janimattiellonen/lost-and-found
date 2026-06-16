import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { useLoaderData } from 'react-router';

import Paper from '~/routes/components/Paper';
import Button from '~/routes/components/Button';

import { getMessageTemplates, deleteMessageTemplate, markAsDefault } from '~/models/messageTemplate.server';

import type { MessageTemplateDTO } from '~/types';
import { isUserLoggedIn } from '~/models/utils';

import H2 from './components/H2';
import Wrapper from './components/Wrapper';

import MessageTemplateItem from '~/routes/components/admin/MessageTemplateItem';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const action = formData.get('action');

  if (action === 'delete') {
    await deleteMessageTemplate(id, request);
  } else if (action === 'default') {
    await markAsDefault(id, request);
  }

  return { ok: true };
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const messageTemplates: MessageTemplateDTO[] = await getMessageTemplates(request);

  return { messageTemplates };
};

export default function MessageTemplatesPage(): JSX.Element {
  const { messageTemplates } = useLoaderData();

  return (
    <div>
      <H2 className="mt-8 mb-4">Viestipohjat</H2>

      <Button to="/message-template/create" variant="contained">
        Luo uusi viestipohja
      </Button>

      <Wrapper>
        {messageTemplates.map((messageTemplate: MessageTemplateDTO) => {
          return (
            <Paper
              key={messageTemplate.id}
              className={messageTemplate.isDefault ? 'mb-8 mt-8' : 'mt-8'}
              style={messageTemplate.isDefault ? { border: 'solid rgba(2, 208, 232, 0.85) 4px' } : undefined}
              elevation={messageTemplate.isDefault ? 7 : 1}
              children={<MessageTemplateItem messageTemplate={messageTemplate} />}
            />
          );
        })}
      </Wrapper>
    </div>
  );
}
