import type { YearSelection } from '~/features/stats/statsUtils';
import { offersAllYears } from '~/features/stats/statsUtils';
import Button from '~/ui/Button';

import type { JSX } from 'react';

type Props = {
  /** Ascending, and only the years this total has data for. */
  years: number[];
  selected: YearSelection;
  onSelect: (year: YearSelection) => void;
};

/**
 * The year buttons above one total.
 *
 * "Kaikki" (all) appears only once a second year has data. With a single year
 * it would not even be a synonym for that year: it also folds in every disc
 * whose date was never recorded, so on the sale/donation total it would read
 * 495 beside 2026's 44. It comes back on its own when the next year starts —
 * there is no date hardcoded here.
 *
 * Nothing renders at all when no disc in the total carries a usable date, since
 * there is then no year to choose between.
 */
export default function YearFilter({ years, selected, onSelect }: Props): JSX.Element | null {
  if (years.length === 0) {
    return null;
  }

  const options: YearSelection[] = offersAllYears(years) ? [...years, 'all'] : years;

  return (
    <div role="group" aria-label="Vuosi" className="mb-4 flex gap-1">
      {options.map((option) => (
        <Button
          key={option}
          variant={option === selected ? 'contained' : 'outlined'}
          aria-pressed={option === selected}
          onClick={() => onSelect(option)}
        >
          {option === 'all' ? 'Kaikki' : option}
        </Button>
      ))}
    </div>
  );
}
