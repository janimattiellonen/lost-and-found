import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { loadSendMessageBatchPage } from '~/features/messaging/loadSendMessageBatchPage.server';
import { recordMessageSent } from '~/features/messaging/recordMessageSent.server';
import SendMessageBatchPage from '~/features/messaging/SendMessageBatchPage';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return loadSendMessageBatchPage(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return recordMessageSent(request, await request.formData());
}

export default function SendMessageBatchRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <SendMessageBatchPage {...loaderData} />;
}
