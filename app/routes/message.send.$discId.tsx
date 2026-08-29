import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { loadSendMessagePage } from '~/features/messaging/loadSendMessagePage.server';
import { recordMessageSent } from '~/features/messaging/recordMessageSent.server';
import SendMessagePage from '~/features/messaging/SendMessagePage';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return loadSendMessagePage(request, parseInt(params.discId || '', 10));
};

export async function action({ request }: ActionFunctionArgs) {
  return recordMessageSent(request, await request.formData());
}

export default function SendMessageRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <SendMessagePage {...loaderData} />;
}
