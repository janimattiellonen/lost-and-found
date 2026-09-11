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

  const stats = getTopLostDiscsByDiscName(data, { groupByDiscName, limit: 10 });

  return (
    <div>
      <H3 className="mt-4 mb-2">Top 10 kadotettua kiekkomallia</H3>

      <div className="mb-2">
        <FormControlLabel
          control={
            <Checkbox checked={groupByDiscName} onChange={(event) => setGroupByDiscName(event.currentTarget.checked)} />
          }
          label="Ryhmittele kiekon nimen mukaan"
        />
      </div>

      <HorizontalBarChart data={stats} />
    </div>
  );
}
