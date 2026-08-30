import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleMessageTemplateAction } from '~/features/messaging/handleMessageTemplateAction.server';
import MessageTemplatesPage from '~/features/messaging/MessageTemplatesPage';
import { getMessageTemplates } from '~/models/messageTemplate.server';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return { messageTemplates: await getMessageTemplates(request) };
};

export async function action({ request }: ActionFunctionArgs) {
  return handleMessageTemplateAction(request, await request.formData());
}

export default function MessageTemplatesRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <MessageTemplatesPage {...loaderData} />;
}
