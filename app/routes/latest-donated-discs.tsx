import H2 from '~/routes/components/H2';
import { json, LoaderArgs, redirect } from '@remix-run/node';
import { isUserLoggedIn } from '~/models/utils';
import { fetchClubs } from '~/models/clubs.server';
import { getLatestDiscsMarkedToBeSoldOrDonated } from '~/models/discs.server';
import { useLoaderData } from '@remix-run/react';
import { DiscDTO } from '~/types';

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

      <div>
        {data?.length > 0 && data.map( (disc: DiscDTO) => {
          return <div key={disc.id}>{disc.discName}: {disc.canBeSoldOrDonatedDate}</div>
        })}
      </div>
    </div>
  )
}