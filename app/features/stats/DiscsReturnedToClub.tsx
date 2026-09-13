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
} from '~/features/stats/statsUtils';
import type { DiscDTO } from '~/types';

function getMonthFromData(data: DiscDTO): Date | null {
  if (!data.addedAt) {
    return null;
  }

  return new Date(data.addedAt);
}

export default function DiscsReturnedToClub({ data }: LostDiscsProps): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const mapped = getAddedDiscCountByMonth(data, getMonthFromData);

  return (
    <div>
      <BarChart
        className="[max-width:1200px] mb-8 [border:solid_1px_red] p-4"
        data={mapBarData(mapped, toMonthOfYearRow)}
        title="Seuralle palautettujen kiekkojen määrä, kuukausittain"
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
            getAddedDiscCountByDaysInMonth(selectedMonth, data, getDayOfMonth, getMonthFromData),
            toDayRow,
          )}
          title={`Seuralle palautettujen kiekkojen määrä, ${getMonthName(selectedMonth, 'long')}, ${getYear(
            selectedMonth,
          )}`}
        />
      )}
    </div>
  );
}
