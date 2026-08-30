import SyncItem from '~/features/discSync/SyncItem';
import type { ClubDTO } from '~/types';
import H2 from '~/ui/H2';

import type { JSX } from 'react';

type Props = {
  data: ClubDTO[];
};

export default function SyncPage({ data }: Props): JSX.Element {
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
