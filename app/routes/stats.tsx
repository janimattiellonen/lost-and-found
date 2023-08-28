import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { isUserLoggedIn } from '~/models/utils';
import H2 from '~/routes/components/H2';
import BarChart from '~/routes/components/admin/BarChart';

import { getDiscsForStats } from '~/models/discs.server';

import LostDiscs from '~/routes/components/admin/stats/LostDiscs';

export const loader = async ({ request }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const data = await getDiscsForStats();

  return json({ data });
};
export default function StatsPage(): JSX.Element {
  const { data } = useLoaderData();
  return (
    <div>
      <H2 className="mt-8 mb-8">Statistiikka</H2>

      <LostDiscs data={data} />
    </div>
  );
}

/*
  - lisätyt kiekot / kk
  - lisätyt kiekot / valittu kk

  - kiekkoja seuralla
  - palautettujen kiekkojen määrä
  - myytyjen kiekkojen määrä
  - lahjoitettujen kiekkojen määrä
  -
 */
