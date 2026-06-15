import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

import { fetchClubs } from '~/models/clubs.server';
import { useLoaderData } from 'react-router';

import SyncItem from '~/routes/discs.syncItem';
import type { ClubDTO } from '~/types';

import { syncAllDiscs, syncNewDiscs } from '~/models/syncDiscs.server';

import { isUserLoggedIn } from '~/models/utils';

import H2 from '~/routes/components/H2';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const isLoggedIn = await isUserLoggedIn(request);

  if (!isLoggedIn) {
    return redirect('/sign-in');
  }

  const data = await fetchClubs();
  return { data };
};

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();

  const clubId = body.get('clubId');

  const allData = body.get('all');
  const newData = body.get('new');

  if (allData) {
    await syncAllDiscs(parseInt(clubId ? clubId.toString() : '', 10), request);
  } else if (newData) {
    await syncNewDiscs(parseInt(clubId ? clubId.toString() : '', 10), request);
  }

  return { ok: true };
}

export default function SyncPage(): JSX.Element {
  const { data } = useLoaderData();

  return (
    <div>
      <H2 className="mt-8 mb-8">Päivitä kiekkotiedot</H2>

      {data.map((club: ClubDTO) => {
        return (
          <form key={club.id} method="post" action="/discs/sync">
            <SyncItem club={club} />
          </form>
        );
      })}
    </div>
  );
}
