import DiscsReturnedToClub from '~/features/stats/DiscsReturnedToClub';
import DiscsReturnedToOwner from '~/features/stats/DiscsReturnedToOwner';
import MostLostByDiscName from '~/features/stats/MostLostByDiscName';
import { getDonatedOrSoldDiscCount, getReturnedDiscCount } from '~/features/stats/statsUtils';
import type { DiscDTO } from '~/types';
import H2 from '~/ui/H2';
import H3 from '~/ui/H3';

import type { JSX } from 'react';

type Props = {
  data: DiscDTO[];
};

export default function StatsPage({ data }: Props): JSX.Element {
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
