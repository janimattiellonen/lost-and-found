import { useState } from 'react';

import { parse } from 'date-fns';

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
import { DiscDTO } from '~/types';

function hasDate(str?: string | null | undefined): boolean {
  if (!str) {
    return false;
  }
  const pattern = /^\d+\.\d+\.\d+/;

  const ret = str.match(pattern);

  return ret?.length === 1;
}

function filter(data: DiscDTO[]): DiscDTO[] {
  return data.filter((item: DiscDTO) => item.isReturnedToOwner && hasDate(item.returnedToOwnerText));
}

function getMonthFromData(data: DiscDTO): Date | null {
  if (!data.returnedToOwnerText) {
    return null;
  }

  const pattern = /^\d+\.\d+\.\d+/;

  const ret = data.returnedToOwnerText.match(pattern);

  if (ret?.length !== 1) {
    return null;
  }

  return parse(ret[0], 'd.M.yyyy', new Date());
}
export default function DiscsReturnedToOwner({ data }: LostDiscsProps): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const filtered = filter(data);
  const mapped = getAddedDiscCountByMonth(filtered, getMonth, getMonthFromData);

  return (
    <div>
      <BarChart
        className="[max-width:1200px] mb-8 [border:solid_1px_red] p-4"
        data={mapBarData(mapped)}
        legendItems={getLegendItems(mapped)}
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
          data={mapBarData(getAddedDiscCountByDaysInMonth(selectedMonth, data, getDayOfMonth, getMonthFromData))}
          legendItems={getLegendItems2(
            getAddedDiscCountByDaysInMonth(selectedMonth, data, getDayOfMonth, getMonthFromData),
          )}
          title={`Omistajille palautettujen kiekkojen määrä, ${getMonthName(selectedMonth, 'long')}, ${getYear(
            selectedMonth,
          )}`}
        />
      )}
    </div>
  );
}
