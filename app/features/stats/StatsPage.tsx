import DiscsReturnedToClub from '~/features/stats/DiscsReturnedToClub';
import DiscsReturnedToOwner from '~/features/stats/DiscsReturnedToOwner';
import MethodBreakdown from '~/features/stats/MethodBreakdown';
import MostLostByDiscName from '~/features/stats/MostLostByDiscName';
import type { DatedDiscs, YearSelection } from '~/features/stats/statsUtils';
import {
  filterDiscsByYear,
  getDisposalDate,
  getDisposalMethodCounts,
  getDonatedOrSoldDiscs,
  getReturnDate,
  getReturnMethodCounts,
  getReturnedDiscs,
  getStatsYears,
} from '~/features/stats/statsUtils';
import YearFilter from '~/features/stats/YearFilter';
import type { DiscDTO } from '~/types';
import H2 from '~/ui/H2';
import H3 from '~/ui/H3';

import type { JSX } from 'react';
import { useState } from 'react';

type Props = {
  data: DiscDTO[];
};

export default function StatsPage({ data }: Props): JSX.Element {
  const [year, setYear] = useState<YearSelection>('all');

  // Each total is dated by its own event, so the two are filtered separately
  // and the buttons are the union of the years either of them knows about.
  const disposalSet: DatedDiscs = { discs: getDonatedOrSoldDiscs(data), getDate: getDisposalDate };
  const returnSet: DatedDiscs = { discs: getReturnedDiscs(data), getDate: getReturnDate };

  const years = getStatsYears([disposalSet, returnSet]);

  const disposal = filterDiscsByYear(disposalSet, year);
  const returns = filterDiscsByYear(returnSet, year);

  return (
    <div>
      <H2 className="mt-8 mb-8">Statistiikka</H2>

      <div>
        <YearFilter years={years} selected={year} onSelect={setYear} />

        <H3>Myytyjen / lahjoitettujen kiekkojen määrä</H3>

        <p>{disposal.discs.length}</p>

        <MethodBreakdown counts={getDisposalMethodCounts(disposal.discs)} />

        <UndatedNote count={disposal.undated} />

        <H3>Omistajille palautettujen kiekkojen määrä</H3>

        <p>{returns.discs.length}</p>

        <MethodBreakdown counts={getReturnMethodCounts(returns.discs)} />

        <UndatedNote count={returns.undated} />
      </div>

      <H2 className="mt-4 mb-2">Seuralle palautetut kiekot</H2>
      <DiscsReturnedToClub data={data} />

      <H2 className="mt-4 mb-2">Omistajille palautetut kiekot</H2>

      <DiscsReturnedToOwner data={data} />

      <MostLostByDiscName data={data} />
    </div>
  );
}

/**
 * Says how many discs a selected year left out for having no date.
 *
 * Without it the year figures would silently fail to add up to the all-time
 * one: only 44 of the club's 495 sold-or-donated discs carry a disposal date.
 */
function UndatedNote({ count }: { count: number }): JSX.Element | null {
  if (count === 0) {
    return null;
  }

  return (
    <p className="mt-1 mb-4 ml-4 text-sm text-gray-500">
      Päivämäärä puuttuu {count} kiekolta – ne eivät näy vuosivalinnoissa.
    </p>
  );
}
