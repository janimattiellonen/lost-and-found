import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';

import StatsPage from '~/features/stats/StatsPage';
import { getDiscsForStats } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return { data: await getDiscsForStats() };
};

export default function StatsRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <StatsPage {...loaderData} />;
}
