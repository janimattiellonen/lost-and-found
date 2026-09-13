import DiscsReturnedToClub from '~/features/stats/DiscsReturnedToClub';
import DiscsReturnedToOwner from '~/features/stats/DiscsReturnedToOwner';
import MostLostByDiscName from '~/features/stats/MostLostByDiscName';
import {
  getDisposalDate,
  getDisposalMethodCounts,
  getDonatedOrSoldDiscs,
  getReturnDate,
  getReturnMethodCounts,
  getReturnedDiscs,
} from '~/features/stats/statsUtils';
import TotalByYear from '~/features/stats/TotalByYear';
import type { DiscDTO } from '~/types';
import H2 from '~/ui/H2';

import type { JSX } from 'react';

type Props = {
  data: DiscDTO[];
};

export default function StatsPage({ data }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-8">Statistiikka</H2>

      <div>
        <TotalByYear
          title="Myytyjen / lahjoitettujen kiekkojen määrä"
          datedDiscs={{ discs: getDonatedOrSoldDiscs(data), getDate: getDisposalDate }}
          getMethodCounts={getDisposalMethodCounts}
        />

        <TotalByYear
          title="Omistajille palautettujen kiekkojen määrä"
          datedDiscs={{ discs: getReturnedDiscs(data), getDate: getReturnDate }}
          getMethodCounts={getReturnMethodCounts}
        />
      </div>

      <H2 className="mt-4 mb-2">Seuralle palautetut kiekot</H2>
      <DiscsReturnedToClub data={data} />

      <H2 className="mt-4 mb-2">Omistajille palautetut kiekot</H2>

      <DiscsReturnedToOwner data={data} />

      <MostLostByDiscName data={data} />
    </div>
  );
}
