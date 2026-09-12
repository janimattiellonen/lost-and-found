import type { DiscNameStat } from '~/features/stats/statsUtils';
import { getTopLostDiscsByDiscName } from '~/features/stats/statsUtils';
import type { DiscDTO } from '~/types';

import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H3 from '~/ui/H3';

import HorizontalBarChart from '~/ui/HorizontalBarChart';

import type { JSX } from 'react';
import { useState } from 'react';

type DiscProps = {
  data: DiscDTO[];
};

export default function MostLostByDiscName({ data }: DiscProps): JSX.Element {
  const [groupByDiscName, setGroupByDiscName] = useState(false);
  const [splitByYear, setSplitByYear] = useState(false);

  const stats = getTopLostDiscsByDiscName(data, { groupByDiscName, splitByYear, limit: 10 });

  return (
    <div>
      <H3 className="mt-4 mb-2">Top 10 kadotettua kiekkomallia</H3>

      <div className="mb-2 flex flex-wrap gap-4">
        <FormControlLabel
          control={
            <Checkbox checked={groupByDiscName} onChange={(event) => setGroupByDiscName(event.currentTarget.checked)} />
          }
          label="Ryhmittele kiekon nimen mukaan"
        />

        <FormControlLabel
          control={<Checkbox checked={splitByYear} onChange={(event) => setSplitByYear(event.currentTarget.checked)} />}
          label="Näytä vuosien mukaan"
        />
      </div>

      <HorizontalBarChart data={stats.map(toChartStat)} />
    </div>
  );
}

// The chart knows nothing about years: it draws captioned parts. The year
// becomes the caption here.
function toChartStat(stat: DiscNameStat) {
  return {
    label: stat.label,
    value: stat.value,
    segments: stat.years?.map((year) => ({ label: String(year.year), value: year.value })),
  };
}
