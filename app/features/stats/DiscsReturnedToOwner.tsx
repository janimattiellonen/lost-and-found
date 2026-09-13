import { useState, type JSX } from 'react';

import { getMonthName, getDayOfMonth, getYear } from '~/utils';
import BarChart from '~/ui/BarChart';

import type { LostDiscsProps } from '~/features/stats/statsUtils';
import {
  getAddedDiscCountByMonth,
  getAddedDiscCountByDaysInMonth,
  mapBarData,
  toMonthOfYearRow,
  toDayRow,
  getReturnDate,
} from '~/features/stats/statsUtils';
import type { DiscDTO } from '~/types';

function filter(data: DiscDTO[]): DiscDTO[] {
  return data.filter((item: DiscDTO) => item.isReturnedToOwner && getReturnDate(item) !== null);
}

export default function DiscsReturnedToOwner({ data }: LostDiscsProps): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const filtered = filter(data);
  const mapped = getAddedDiscCountByMonth(filtered, getReturnDate);

  return (
    <div>
      <BarChart
        className="[max-width:1200px] mb-8 [border:solid_1px_red] p-4"
        data={mapBarData(mapped, toMonthOfYearRow)}
        title="Omistajille palautettujen kiekkojen määrä, kuukausittain"
        onBarClick={(value) => {
          if (value) {
            setSelectedMonth(value);
          }
        }}
      />

      {selectedMonth && (
        <BarChart
          className="[max-width:1200px] [border:solid_1px_red] p-4"
          data={mapBarData(
            getAddedDiscCountByDaysInMonth(selectedMonth, filtered, getDayOfMonth, getReturnDate),
            toDayRow,
          )}
          title={`Omistajille palautettujen kiekkojen määrä, ${getMonthName(selectedMonth, 'long')}, ${getYear(
            selectedMonth,
          )}`}
        />
      )}
    </div>
  );
}
