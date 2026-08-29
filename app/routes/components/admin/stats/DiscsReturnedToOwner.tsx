import { useState, type JSX } from 'react';

import { parse } from 'date-fns';

import { getMonth, getMonthName, getDayOfMonth, getYear } from '~/routes/utils';
import BarChart from '~/routes/components/admin/BarChart';

import type { LostDiscsProps } from '~/routes/components/admin/stats/stats-utils';
import {
  getAddedDiscCountByMonth,
  getAddedDiscCountByDaysInMonth,
  mapBarData,
  getLegendItems,
  getLegendItems2,
} from '~/routes/components/admin/stats/stats-utils';
import type { DiscDTO } from '~/types';

// The date a disc went back to its owner comes from one of two places:
// returned_to_owner_date, written by the admin tool, or the leading d.M.yyyy of
// the free-text note copied from the Google Sheet ("29.8.2026 (Janimatti),
// postitettu"), which is all the older rows have.
function getReturnDate(disc: DiscDTO): Date | null {
  if (disc.returnedToOwnerDate) {
    const parsed = parse(disc.returnedToOwnerDate, 'y-MM-dd', new Date());

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!disc.returnedToOwnerText) {
    return null;
  }

  const ret = disc.returnedToOwnerText.match(/^\d+\.\d+\.\d+/);

  if (ret?.length !== 1) {
    return null;
  }

  const parsed = parse(ret[0], 'd.M.yyyy', new Date());

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function filter(data: DiscDTO[]): DiscDTO[] {
  return data.filter((item: DiscDTO) => item.isReturnedToOwner && getReturnDate(item) !== null);
}

function getMonthFromData(data: DiscDTO): Date | null {
  return getReturnDate(data);
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
