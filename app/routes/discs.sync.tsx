import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { runSync } from '~/features/discSync/runSync.server';
import SyncPage from '~/features/discSync/SyncPage';
import { fetchClubs } from '~/models/clubs.server';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return { data: (await fetchClubs()) ?? [] };
};

export async function action({ request }: ActionFunctionArgs) {
  return runSync(request, await request.formData());
}

export default function SyncRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <SyncPage {...loaderData} />;
}
