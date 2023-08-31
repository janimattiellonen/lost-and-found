import { useState } from 'react';
import { getMonth, getMonthName, getDayOfMonth, getYear } from '~/routes/utils';
import BarChart from '~/routes/components/admin/BarChart';

import {
  getAddedDiscCountByMonth,
  getAddedDiscCountByDaysInMonth,
  LostDiscsProps,
  mapBarData,
  getLegendItems,
  getLegendItems2,
} from '~/routes/components/admin/stats/stats-utils';

export default function LostDiscs({ data }: LostDiscsProps): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const mapped = getAddedDiscCountByMonth(data, getMonth);

  return (
    <div>
      <BarChart
        className="[max-width:1200px] mb-8 [border:solid_1px_red] p-4"
        data={mapBarData(mapped)}
        legendItems={getLegendItems(mapped)}
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
          data={mapBarData(getAddedDiscCountByDaysInMonth(selectedMonth, data, getDayOfMonth))}
          legendItems={getLegendItems2(getAddedDiscCountByDaysInMonth(selectedMonth, data, getDayOfMonth))}
          title={`Seuralle palautettujen kiekkojen määrä, ${getMonthName(selectedMonth, 'long')}, ${getYear(
            selectedMonth,
          )}`}
        />
      )}
    </div>
  );
}
