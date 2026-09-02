import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { loadSendMessagePage } from '~/features/messaging/loadSendMessagePage.server';
import { recordMessageSent } from '~/features/messaging/recordMessageSent.server';
import SendMessagePage from '~/features/messaging/SendMessagePage';
import { isExternalId } from '~/lib/api/validate';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  // Checked before the query so a malformed uuid is a 404 rather than a
  // PostgREST error on the way through.
  if (!isExternalId(params.externalId)) {
    throw new Response('Kiekkoa ei löytynyt.', { status: 404 });
  }

  return loadSendMessagePage(request, params.externalId);
};

export async function action({ request }: ActionFunctionArgs) {
  return recordMessageSent(request, await request.formData());
}

export default function SendMessageRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <SendMessagePage {...loaderData} />;
}
