import H2 from '~/routes/components/H2';
import { json, LoaderArgs, redirect } from '@remix-run/node';
import { isUserLoggedIn } from '~/models/utils';
import { fetchClubs } from '~/models/clubs.server';
import { getLatestDiscsMarkedToBeSoldOrDonated } from '~/models/discs.server';
import { useLoaderData } from '@remix-run/react';
import { DiscDTO } from '~/types';

import {formatDate} from '~/routes/utils';
import { LatestDonatedDiscsPage } from '~/pages/LatestDonatedDiscsPage';

export const loader = async ({ request }: LoaderArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const data = await getLatestDiscsMarkedToBeSoldOrDonated();
  return json({ data });
};

export default function LatestDonatedDiscs() {
  const {data} = useLoaderData();

  return (
    <div>
      <H2 className="mt-8 mb-8">Uusimmat seuralle lahjoitetut kiekot</H2>

      {data.length > 0 && <LatestDonatedDiscsPage data={data} />}
    </div>
  )
}