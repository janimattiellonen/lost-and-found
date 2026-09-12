import type { YearSelection } from '~/features/stats/statsUtils';
import Button from '~/ui/Button';

import type { JSX } from 'react';

type Props = {
  /** Ascending. "Kaikki" is appended by this component, not by the caller. */
  years: number[];
  selected: YearSelection;
  onSelect: (year: YearSelection) => void;
};

/**
 * The "2024 | 2025 | 2026 | Kaikki" row above the two totals.
 *
 * Buttons rather than a <select>: there are only ever a handful of years, and
 * the current one should be readable without opening anything.
 */
export default function YearFilter({ years, selected, onSelect }: Props): JSX.Element {
  const options: YearSelection[] = [...years, 'all'];

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
