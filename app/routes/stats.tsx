import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { useLoaderData } from 'react-router';

import { isUserLoggedIn } from '~/models/utils';
import H2 from '~/routes/components/H2';

import { getDiscsForStats } from '~/models/discs.server';

import DiscsReturnedToClub from '~/routes/components/admin/stats/DiscsReturnedToClub';
import DiscsReturnedToOwner from '~/routes/components/admin/stats/DiscsReturnedToOwner';
import { getReturnedDiscCount, getDonatedOrSoldDiscCount } from '~/routes/components/admin/stats/stats-utils';

import H3 from '~/routes/components/H3';

import MostLostByDiscName from '~/routes/components/admin/stats/MostLostByDiscName';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const data = await getDiscsForStats();

  return { data };
};
export default function StatsPage(): JSX.Element {
  const { data } = useLoaderData();
  return (
    <div>
      <H2 className="mt-8 mb-8">Statistiikka</H2>

      <div>
        <H3>Myytyjen / lahjoitettujen kiekkojen määrä</H3>

        <p>{getDonatedOrSoldDiscCount(data)}</p>

        <H3>Omistajille palautettujen kiekkojen määrä</H3>

        <p>{getReturnedDiscCount(data)}</p>
      </div>

      <H2 className="mt-4 mb-2">Seuralle palautetut kiekot</H2>
      <DiscsReturnedToClub data={data} />

      <H2 className="mt-4 mb-2">Omistajille palautetut kiekot</H2>

      <DiscsReturnedToOwner data={data} />

      <MostLostByDiscName data={data} />
    </div>
  );
}
