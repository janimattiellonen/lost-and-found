import { DiscDTO } from '~/types';

import H3 from '../../H3';

import HorizontalBarChart from '~/routes/components/admin/HorizontaBarChart';

type DiscProps = {
  data: DiscDTO[];
};

type Stat = {
  label: string;
  value: number;
};

function getTopLostDiscsByDiscName(data: DiscDTO[], limit?: number): Stat[] {
  const temp: { [key: string]: number } = {};

  data.forEach((item: DiscDTO) => {
    if (temp[item.discName]) {
      temp[item.discName] += 1;
    } else {
      temp[item.discName] = 1;
    }
  });

  const keys: string[] = Object.keys(temp);

  const stats: Stat[] = keys.map((key: string): Stat => {
    return { label: key, value: temp[key] };
  });

  const sorted = stats.sort((a: Stat, b: Stat) => {
    if (a.value > b.value) {
      return -1;
    }

    if (a.value < b.value) {
      return 1;
    }

    return 0;
  });

  return limit ? sorted.slice(0, limit) : sorted;
}
export default function MostLostByDiscName({ data }: DiscProps): JSX.Element {
  const filtered = getTopLostDiscsByDiscName(data, 10);

  return (
    <div>
      <H3 className="mt-4 mb-2">Top 10 kadotettua kiekkomallia</H3>

      <HorizontalBarChart data={filtered} />
    </div>
  );
}
