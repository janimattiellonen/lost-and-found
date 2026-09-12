import MethodBreakdown from '~/features/stats/MethodBreakdown';
import type { DatedDiscs, MethodCount, YearSelection } from '~/features/stats/statsUtils';
import {
  filterDiscsByYear,
  getDefaultYear,
  getEarliestDate,
  getSelectedYear,
  getStatsYears,
} from '~/features/stats/statsUtils';
import YearFilter from '~/features/stats/YearFilter';
import type { DiscDTO } from '~/types';
import H3 from '~/ui/H3';
import { format } from 'date-fns';

import type { JSX } from 'react';
import { useState } from 'react';

type Props = {
  title: string;
  /** The discs this total counts, and the date that places each in a year. */
  set: DatedDiscs;
  getMethodCounts: (discs: DiscDTO[]) => MethodCount[];
};

/**
 * One headline total with its own year buttons, method breakdown and the two
 * lines that keep its figures honest.
 *
 * Each total has its own filter rather than sharing one, because the two reach
 * back to different places: the club only started recording a disposal date in
 * September 2026, while the returns go back to 2024 through the dates written
 * into the Google Sheet notes. A shared filter would have offered the sale
 * total years that can only ever read zero.
 */
export default function TotalByYear({ title, set, getMethodCounts }: Props): JSX.Element {
  const years = getStatsYears(set);
  const [clicked, setClicked] = useState<YearSelection>(() => getDefaultYear(years));

  // What is clicked and what the data offers can drift apart when the loader
  // revalidates under an open page, so the shown year is derived, not stored.
  const year = getSelectedYear(clicked, years);

  const filtered = filterDiscsByYear(set, year);
  const earliest = getEarliestDate(set);

  return (
    <div>
      <H3>{title}</H3>

      <YearFilter years={years} selected={year} onSelect={setClicked} />

      <p>{filtered.discs.length}</p>

      <MethodBreakdown counts={getMethodCounts(filtered.discs)} />

      {earliest && <p className="mt-1 mb-1 ml-4 text-sm text-gray-500">Tiedot alkaen {format(earliest, 'd.M.y')}</p>}

      {filtered.undated > 0 && (
        <p className="mt-1 mb-4 ml-4 text-sm text-gray-500">
          Päivämäärä puuttuu {filtered.undated} kiekolta – ne eivät näy vuosivalinnoissa.
        </p>
      )}
    </div>
  );
}
